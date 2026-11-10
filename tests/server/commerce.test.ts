// LOCAL SIMULATION tests of the purchase ledger, entitlement signing and sync API.
// These exercise our server against a simulated provider. They are NOT Razorpay sandbox verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, LogMailer, type App } from '../../server/app.ts';
import { ConfigError, loadConfig, type ServerConfig } from '../../server/config.ts';
import { signJws } from '../../server/commerce.ts';
import { hmacHex, LocalTestAdapter, RazorpayAdapter } from '../../server/payments.ts';
import { openDb } from '../../server/db.ts';
import { entitles, evaluateEntitlement, mayContinueStartedSession, verifySignedToken, type PublicJwk } from '../../src/core/entitlement.ts';
import { validateProgressAck, validateProgressChanges, validatePurchase, validateOffer, validateSignedEntitlement } from '../../src/validation/contracts.ts';
import type { EntitlementRecord } from '../../src/core/model.ts';
import type { SignedOfflineEntitlement } from '../../src/types/contracts.ts';
import { answerEvent, fixtureBytes } from '../helpers.ts';

const DAY = 86_400_000;
let clock = Date.parse('2026-11-10T04:30:00.000Z');

function setup(opts: { paidContent?: boolean } = {}): { app: App; sim: LocalTestAdapter; mailer: LogMailer; config: ServerConfig; dir: string } {
  clock = Date.parse('2026-11-10T04:30:00.000Z');
  const dir = mkdtempSync(join(tmpdir(), 'caiib-srv-'));
  const contentDir = join(dir, 'content'); mkdirSync(join(contentDir, 'packs'), { recursive: true });
  const paid = opts.paidContent ?? true;
  // A stand-in manifest entry so the availability and gating logic has something to act on. The bytes are the synthetic fixture.
  writeFileSync(join(contentDir, 'packs', 'PAID.json'), fixtureBytes('BFM'));
  writeFileSync(join(contentDir, 'manifest.json'), JSON.stringify({ generated_at: '2026-11-10T00:00:00.000Z', packs: paid ? [{ pack_id: 'PAID', pack_version: '1', paper_id: 'BFM', exam_context_id: 'X', syllabus_version: 'S', schema_version: '2.0.0', file_size_bytes: 1, sha256: 'a'.repeat(64), path: 'packs/PAID.json', minimum_client_version: '0.1.0', change_summary: 't', kind: 'published', access: 'full', free_unit_ids: [], unit_ids: ['U1', 'U2'], item_counts: { cards: 1, questions: 1, case_studies: 0, references: 0, calculators: 0 } }] : [] }));
  const config = loadConfig({ DATA_DIR: dir, CONTENT_DIR: contentDir, PAYMENT_PROVIDER: 'local_test', PORT: '0' }, dir);
  const db = openDb(':memory:'); const sim = new LocalTestAdapter(db); const mailer = new LogMailer();
  const app = createApp({ config, db, adapter: sim, mailer, now: () => clock });
  return { app, sim, mailer, config, dir };
}
async function signIn(s: { app: App; mailer: LogMailer }, email: string) {
  await s.app.commerce.requestLoginCode(email);
  return s.app.commerce.verifyLoginCode(email, s.mailer.last.get(email)!);
}
const key = () => `idem_${Math.random().toString(36).slice(2, 12)}`;
async function paidAccount(s: ReturnType<typeof setup>, email = 'buyer@example.test') {
  const { account, token } = await signIn(s, email);
  const order = await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key());
  const pay = s.sim.simulatePayment(order.provider_order_id, 'captured');
  const out = await s.app.commerce.verifyCheckout(account, order.order_id, pay.provider_payment_id, pay.signature);
  return { account, token, order, pay, out };
}
const quiet = async <T>(fn: () => Promise<T>): Promise<T> => { const log = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = log; } };
const reject = (p: Promise<unknown>, code: string) => assert.rejects(p, (e: { code?: string }) => e.code === code);

test('configuration guards: no simulation in production, live keys need an explicit owner switch', () => {
  assert.throws(() => loadConfig({ APP_MODE: 'production', PAYMENT_PROVIDER: 'local_test', MAIL_MODE: 'http', MAIL_HTTP_URL: 'https://mail.example.test', ENTITLEMENT_PRIVATE_KEY_FILE: 'k.pem' }), ConfigError);
  assert.throws(() => loadConfig({ APP_MODE: 'production', PAYMENT_PROVIDER: 'disabled' }), /MAIL_MODE=http/);
  const rz = { PAYMENT_PROVIDER: 'razorpay', RAZORPAY_KEY_SECRET: 's', RAZORPAY_WEBHOOK_SECRET: 'w', SUPPORT_TEXT: 'Email support@example.test. Refunds within 7 days if no paid unit was opened.' };
  assert.throws(() => loadConfig({ ...rz, SUPPORT_TEXT: '', RAZORPAY_KEY_ID: 'rzp_test_abc' }), /SUPPORT_TEXT/);
  assert.throws(() => loadConfig({ ...rz, RAZORPAY_KEY_ID: 'rzp_live_abc' }), /LIVE_PURCHASES_ENABLED/);
  assert.throws(() => loadConfig({ ...rz, RAZORPAY_KEY_ID: 'rzp_test_abc', LIVE_PURCHASES_ENABLED: 'true' }), /test key/);
  assert.throws(() => loadConfig({ PAYMENT_PROVIDER: 'razorpay', SUPPORT_TEXT: 'x' }), /RAZORPAY_KEY_ID/);
  assert.equal(loadConfig({ ...rz, RAZORPAY_KEY_ID: 'rzp_test_abc' }).payment.mode, 'razorpay');
});

test('sign-in: codes expire, attempts are limited, requests are rate limited', async () => quiet(async () => {
  const s = setup(); const email = 'a@example.test';
  await s.app.commerce.requestLoginCode(email); const code = s.mailer.last.get(email)!;
  assert.throws(() => s.app.commerce.verifyLoginCode(email, '000000' === code ? '111111' : '000000'), /not valid/);
  assert.equal(s.app.commerce.verifyLoginCode(email, code).account.email, email);
  assert.throws(() => s.app.commerce.verifyLoginCode(email, code), /not valid/, 'a code works once');
  await s.app.commerce.requestLoginCode(email); clock += 11 * 60_000;
  assert.throws(() => s.app.commerce.verifyLoginCode(email, s.mailer.last.get(email)!), /not valid/, 'expired');
  await s.app.commerce.requestLoginCode(email); const c3 = s.mailer.last.get(email)!;
  for (let i = 0; i < 5; i++) assert.throws(() => s.app.commerce.verifyLoginCode(email, c3 === '999999' ? '888888' : '999999'));
  assert.throws(() => s.app.commerce.verifyLoginCode(email, c3), /not valid/, 'locked after five wrong attempts');
  await s.app.commerce.requestLoginCode(email); await s.app.commerce.requestLoginCode(email);
  await reject(s.app.commerce.requestLoginCode(email), 'too_many_requests');
  await reject(s.app.commerce.requestLoginCode('not-an-email'), 'invalid_email');
  assert.throws(() => s.app.commerce.authenticate('Bearer nope-nope-nope-nope-nope'), /Sign in/);
}));

test('verified purchase: server-priced order, provider-confirmed capture, six calendar months of access', async () => quiet(async () => {
  const s = setup(); const { account, order, out } = await paidAccount(s);
  assert.equal(order.amount_minor, 39_900); assert.equal(order.currency, 'INR'); assert.equal(order.simulated, true);
  assert.equal(out.status, 'verified'); assert.equal(validatePurchase(out.purchase).ok, true);
  assert.equal(out.purchase?.access_starts_at, '2026-11-10T04:30:00.000Z'); assert.equal(out.purchase?.access_expires_at, '2027-05-10T04:30:00.000Z');
  assert.equal(out.purchase?.learner_id, account.account_id);
  const offer = (await (await fetchJson(s, 'GET', '/api/v1/offers')).json() as { offers: unknown[]; purchasing_enabled: boolean });
  assert.equal(validateOffer(offer.offers[0]).ok, true); assert.equal(offer.purchasing_enabled, true);
  await reject(s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key()), 'already_active'); // no accidental second payment
  await s.app.close();
}));

async function fetchJson(s: { app: App }, method: string, path: string, token?: string, body?: unknown): Promise<Response> {
  const addr = s.app.server.address(); const port = typeof addr === 'object' && addr ? addr.port : await s.app.listen(0);
  return fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

test('a spoofed success callback grants nothing', async () => quiet(async () => {
  const s = setup(); const { account } = await signIn(s, 'spoof@example.test');
  const order = await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key());
  await reject(s.app.commerce.verifyCheckout(account, order.order_id, 'pay_FAKE', 'ab'.repeat(32)), 'invalid_signature');
  // A correctly formed signature for a payment the provider has never seen is still refused.
  await reject(s.app.commerce.verifyCheckout(account, order.order_id, 'pay_GHOST', hmacHex(s.sim.keySecret, `${order.provider_order_id}|pay_GHOST`)), 'unknown_payment');
  // A real payment for ANOTHER order cannot be replayed against this one.
  const other = await paidAccount(s, 'other@example.test');
  await reject(s.app.commerce.verifyCheckout(account, order.order_id, other.pay.provider_payment_id, other.pay.signature), 'invalid_signature');
  await reject(s.app.commerce.verifyCheckout(account, other.order.order_id, other.pay.provider_payment_id, other.pay.signature), 'unknown_order');
  assert.equal(s.app.commerce.activePurchase(account.account_id), null); assert.equal(s.app.commerce.issueEntitlement(account), null);
}));

test('amount or currency mismatch never grants access; a client cannot choose the price or product', async () => quiet(async () => {
  const s = setup(); const { account } = await signIn(s, 'm@example.test');
  const order = await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key());
  const cheap = s.sim.simulatePayment(order.provider_order_id, 'captured', { amount_minor: 100 });
  await reject(s.app.commerce.verifyCheckout(account, order.order_id, cheap.provider_payment_id, cheap.signature), 'amount_mismatch');
  const usd = s.sim.simulatePayment(order.provider_order_id, 'captured', { currency: 'USD' });
  await reject(s.app.commerce.verifyCheckout(account, order.order_id, usd.provider_payment_id, usd.signature), 'amount_mismatch');
  assert.equal(s.app.commerce.issueEntitlement(account), null);
  await reject(s.app.commerce.createOrder(account, 'FREE_EVERYTHING', key()), 'unknown_product');
}));

test('order creation is idempotent per request key', async () => quiet(async () => {
  const s = setup(); const { account } = await signIn(s, 'i@example.test'); const k = key();
  const a = await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', k), b = await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', k);
  assert.equal(a.order_id, b.order_id); assert.equal(a.provider_order_id, b.provider_order_id);
  assert.notEqual((await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key())).order_id, a.order_id);
}));

test('pending stays pending; closing the app after paying still ends in a verified purchase', async () => quiet(async () => {
  const s = setup(); const { account } = await signIn(s, 'p@example.test');
  const order = await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key());
  assert.equal((await s.app.commerce.orderStatus(account, order.order_id)).status, 'pending', 'no payment yet');
  const pay = s.sim.simulatePayment(order.provider_order_id, 'authorized');
  assert.equal((await s.app.commerce.verifyCheckout(account, order.order_id, pay.provider_payment_id, pay.signature)).status, 'pending', 'authorized is not paid');
  assert.equal(s.app.commerce.issueEntitlement(account), null);
  s.sim.simulateCapture(pay.provider_payment_id);
  // The client never calls verify again (app was closed). Reopening and checking the order reconciles with the provider.
  const later = await s.app.commerce.orderStatus(account, order.order_id);
  assert.equal(later.status, 'verified'); assert.ok(s.app.commerce.issueEntitlement(account));
}));

test('webhooks: bad signatures rejected, duplicates processed once, a capture alone can complete a purchase', async () => quiet(async () => {
  const s = setup(); const { account } = await signIn(s, 'w@example.test');
  const order = await s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key());
  const pay = s.sim.simulatePayment(order.provider_order_id, 'captured');
  const hook = s.sim.webhook('payment.captured', pay.provider_payment_id, 'evt_1');
  assert.deepEqual(await s.app.commerce.handleWebhook(hook.rawBody, { ...hook.headers, 'x-razorpay-signature': 'ab'.repeat(32) }), { status: 400, outcome: 'invalid_signature' });
  const tampered = Buffer.from(hook.rawBody.toString().replace('"captured"', '"captured" '));
  assert.equal((await s.app.commerce.handleWebhook(tampered, hook.headers)).status, 400, 'signature covers the raw body');
  assert.deepEqual(await s.app.commerce.handleWebhook(hook.rawBody, hook.headers), { status: 200, outcome: 'verified' });
  const first = s.app.commerce.activePurchase(account.account_id)!;
  assert.deepEqual(await s.app.commerce.handleWebhook(hook.rawBody, hook.headers), { status: 200, outcome: 'duplicate' });
  const again = s.sim.webhook('order.paid', pay.provider_payment_id, 'evt_2'); // a different event about the same payment
  assert.equal((await s.app.commerce.handleWebhook(again.rawBody, again.headers)).outcome, 'verified');
  const purchases = s.app.commerce.purchases(account.account_id);
  assert.equal(purchases.length, 1, 'one grant'); assert.deepEqual(purchases[0], first, 'term not restarted by a repeat notification');
  const stranger = s.sim.webhook('payment.captured', 'pay_UNKNOWN', 'evt_3');
  assert.equal((await s.app.commerce.handleWebhook(stranger.rawBody, stranger.headers)).outcome, 'ignored');
}));

test('refund is terminal: a delayed or replayed capture notice cannot restore access', async () => quiet(async () => {
  const s = setup(); const { account, pay, out } = await paidAccount(s);
  assert.ok(s.app.commerce.issueEntitlement(account));
  s.sim.simulateRefund(pay.provider_payment_id);
  const refund = s.sim.webhook('refund.processed', pay.provider_payment_id, 'evt_r1');
  assert.equal((await s.app.commerce.handleWebhook(refund.rawBody, refund.headers)).outcome, 'refunded');
  const lateCapture = s.sim.webhook('payment.captured', pay.provider_payment_id, 'evt_late');
  assert.equal((await s.app.commerce.handleWebhook(lateCapture.rawBody, lateCapture.headers)).outcome, 'refunded');
  const p = s.app.commerce.purchases(account.account_id)[0]!;
  assert.equal(p.status, 'refunded'); assert.ok(p.refunded_at); assert.equal(p.purchase_id, out.purchase?.purchase_id);
  assert.equal(s.app.commerce.issueEntitlement(account), null, 'no new entitlement after refund');
  assert.equal((await s.app.commerce.restore(account)).entitlement, null, 'restore does not resurrect a refunded purchase');
  // Out of order: refund notice arrives before we ever saw the capture.
  const { account: b } = await signIn(s, 'ooo@example.test');
  const order = await s.app.commerce.createOrder(b, 'CAIIB_PASS_6M', key());
  const pay2 = s.sim.simulatePayment(order.provider_order_id, 'captured'); s.sim.simulateRefund(pay2.provider_payment_id);
  const cap = s.sim.webhook('payment.captured', pay2.provider_payment_id, 'evt_c2');
  assert.equal((await s.app.commerce.handleWebhook(cap.rawBody, cap.headers)).outcome, 'refunded');
  assert.equal(s.app.commerce.issueEntitlement(b), null);
}));

test('restore re-verifies this account only and returns its purchase after reinstall; revocation is honoured', async () => quiet(async () => {
  const s = setup(); const buyer = await paidAccount(s, 'owner@example.test');
  const fresh = await signIn(s, 'owner@example.test'); // same person, new device/session
  const restored = await s.app.commerce.restore(fresh.account);
  assert.equal(restored.purchases.length, 1); assert.equal(restored.purchases[0]?.status, 'verified'); assert.ok(restored.entitlement);
  const thief = await signIn(s, 'thief@example.test');
  const none = await s.app.commerce.restore(thief.account);
  assert.deepEqual(none, { purchases: [], entitlement: null });
  await reject(s.app.commerce.orderStatus(thief.account, buyer.order.order_id), 'unknown_order');
  assert.equal(s.app.commerce.revoke(buyer.out.purchase!.purchase_id), true);
  assert.equal(s.app.commerce.issueEntitlement(buyer.account), null);
  assert.equal(s.app.commerce.revoke(buyer.out.purchase!.purchase_id), false);
}));

test('nothing is sold when no paid content exists', async () => quiet(async () => {
  const s = setup({ paidContent: false }); const { account } = await signIn(s, 'n@example.test');
  await reject(s.app.commerce.createOrder(account, 'CAIIB_PASS_6M', key()), 'nothing_to_sell');
  const offer = await (await fetchJson(s, 'GET', '/api/v1/offers')).json() as { purchasing_enabled: boolean; purchasable_reason: string };
  assert.equal(offer.purchasing_enabled, false); assert.match(offer.purchasable_reason, /No paid content/);
  await s.app.close();
}));

test('offline entitlement: signature, account binding, lease, expiry and clock rollback all fail closed', async () => quiet(async () => {
  const s = setup(); const { account } = await paidAccount(s);
  const signed = s.app.commerce.issueEntitlement(account)!; const keys = [s.app.commerce.publicJwk as PublicJwk];
  assert.equal(validateSignedEntitlement(signed).ok, true);
  const verified = await verifySignedToken(signed, keys);
  assert.equal(verified.ok, true); if (!verified.ok) return;
  assert.equal(verified.claims.learner_id, account.account_id);
  assert.equal(verified.claims.offline_until, new Date(clock + 30 * DAY).toISOString(), '30-day offline lease');
  assert.equal(verified.claims.access_expires_at, '2027-05-10T04:30:00.000Z');
  const record: EntitlementRecord = { signed, last_trusted_server_time: new Date(clock).toISOString(), last_seen_device_time: new Date(clock).toISOString() };
  const at = (ms: number, r = record, learner = account.account_id) => evaluateEntitlement(r, keys, learner, ms);

  const ok = await at(clock + DAY); assert.equal(ok.state, 'valid'); assert.equal(entitles(ok, 'BFM'), true);
  assert.equal((await at(clock + 31 * DAY)).state, 'refresh_required', 'lease ended');
  assert.equal((await at(Date.parse('2027-05-11T00:00:00Z'))).state, 'expired');
  assert.deepEqual(await at(clock + DAY, record, 'acct-someone-else'), { state: 'invalid', reason: 'wrong_account' });
  const rolled = await at(clock - DAY); assert.equal(rolled.state, 'refresh_required'); assert.equal(rolled.state === 'refresh_required' && rolled.reason, 'clock_rollback');
  const seenLater = await at(clock + DAY, { ...record, last_seen_device_time: new Date(clock + 5 * DAY).toISOString() });
  assert.equal(seenLater.state, 'refresh_required', 'device clock moved backwards since last use');
  assert.deepEqual(await evaluateEntitlement(undefined, keys, account.account_id, clock), { state: 'none' });

  // Counterfeits: tampered payload, token signed by a different key, unknown key id, wrong algorithm.
  const [h, p, sig] = signed.signed_token.split('.') as [string, string, string];
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString()); claims.access_expires_at = '2030-01-01T00:00:00.000Z';
  const tampered: SignedOfflineEntitlement = { key_id: signed.key_id, signed_token: `${h}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${sig}` };
  assert.deepEqual(await verifySignedToken(tampered, keys), { ok: false, reason: 'bad_signature' });
  const forged: SignedOfflineEntitlement = { key_id: signed.key_id, signed_token: signJws(claims, generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey, signed.key_id) };
  assert.deepEqual(await verifySignedToken(forged, keys), { ok: false, reason: 'bad_signature' });
  assert.deepEqual(await verifySignedToken({ key_id: 'other', signed_token: signJws(claims, generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey, 'other') }, keys), { ok: false, reason: 'unknown_key' });
  const none = `${Buffer.from(JSON.stringify({ alg: 'none', kid: signed.key_id })).toString('base64url')}.${p}.`;
  assert.equal((await verifySignedToken({ key_id: signed.key_id, signed_token: none }, keys)).ok, false);
  assert.deepEqual(await verifySignedToken({ key_id: signed.key_id, signed_token: 'garbage' }, keys), { ok: false, reason: 'malformed' });
  assert.equal((await at(clock + DAY, { ...record, signed: forged })).state, 'invalid');

  // Bounded finish: a mock started while valid may run to its own deadline after the lease ends; new ones may not.
  const leaseEnded = await at(clock + 30 * DAY + 60_000);
  const started = new Date(clock + 30 * DAY - 3_600_000).toISOString(), deadline = new Date(clock + 30 * DAY + 3_600_000).toISOString();
  assert.equal(mayContinueStartedSession(started, deadline, leaseEnded, clock + 30 * DAY + 60_000), true);
  assert.equal(mayContinueStartedSession(started, deadline, leaseEnded, clock + 30 * DAY + 2 * 3_600_000), false, 'not past its own deadline');
  assert.equal(mayContinueStartedSession(new Date(clock + 30 * DAY + 1000).toISOString(), deadline, leaseEnded, clock + 30 * DAY + 60_000), false, 'started after the lease ended');
  assert.equal(mayContinueStartedSession(started, null, leaseEnded, clock), false, 'untimed sessions get no exception');

  // The lease is capped by the purchased term.
  clock = Date.parse('2027-05-01T04:30:00.000Z');
  const late = await verifySignedToken(s.app.commerce.issueEntitlement(account)!, keys);
  assert.equal(late.ok && late.claims.offline_until, '2027-05-10T04:30:00.000Z');
  clock = Date.parse('2027-05-10T04:30:00.000Z');
  assert.equal(s.app.commerce.issueEntitlement(account), null, 'expired purchases issue nothing');
}));

test('HTTP: paid packs need an active pass; progress upload is idempotent and learner-bound', async () => quiet(async () => {
  const s = setup(); await s.app.listen(0);
  const buyer = await paidAccount(s, 'http@example.test'); const free = await signIn(s, 'free@example.test');
  assert.equal((await fetchJson(s, 'GET', '/api/v1/packs/PAID')).status, 401);
  assert.equal((await fetchJson(s, 'GET', '/api/v1/packs/PAID', free.token)).status, 403);
  const ok = await fetchJson(s, 'GET', '/api/v1/packs/PAID', buyer.token);
  assert.equal(ok.status, 200); assert.equal((await ok.arrayBuffer()).byteLength, fixtureBytes('BFM').byteLength);
  assert.equal((await fetchJson(s, 'GET', '/api/v1/packs/..%2Fmanifest.json', buyer.token)).status, 404);
  const ent = await (await fetchJson(s, 'GET', '/api/v1/entitlement', buyer.token)).json() as { entitlement: unknown; server_time: string };
  assert.equal(validateSignedEntitlement(ent.entitlement).ok, true);
  assert.equal(((await (await fetchJson(s, 'GET', '/api/v1/entitlement', free.token)).json()) as { entitlement: unknown }).entitlement, null);
  assert.equal((await fetchJson(s, 'GET', '/api/v1/entitlement')).status, 401);

  const mine = [1, 2, 3].map(i => answerEvent({ item: `q${i}`, correct: true, atMs: clock + i, learner: buyer.account.account_id, id: `sync-${i}` }));
  const foreign = answerEvent({ item: 'q9', correct: true, atMs: clock, learner: 'acct-other', id: 'sync-foreign' });
  const invalid = { ...mine[0], event_id: 'sync-bad', is_first_exposure: true };
  const up = async () => (await fetchJson(s, 'POST', '/api/v1/progress/events', buyer.token, { events: [...mine, foreign, invalid, mine[0]], after_cursor: null })).json();
  const first = await up() as { accepted_event_ids: string[]; duplicate_event_ids: string[]; rejected: { event_id: string }[]; next_cursor: string };
  assert.equal(validateProgressAck(first).ok, true, JSON.stringify(validateProgressAck(first)));
  assert.deepEqual(first.accepted_event_ids, ['sync-1', 'sync-2', 'sync-3']); assert.deepEqual(first.rejected.map(r => r.event_id).sort(), ['sync-bad', 'sync-foreign']);
  const second = await up() as typeof first;
  assert.deepEqual(second.accepted_event_ids, []); assert.deepEqual(second.duplicate_event_ids, ['sync-1', 'sync-2', 'sync-3'], 'retry produces no new logical events');
  assert.equal(second.next_cursor, first.next_cursor);
  const changes = await (await fetchJson(s, 'GET', '/api/v1/progress/changes?cursor=0', buyer.token)).json() as { events: { event_id: string }[]; next_cursor: string; has_more: boolean };
  assert.equal(validateProgressChanges(changes).ok, true); assert.deepEqual(changes.events.map(e => e.event_id), ['sync-1', 'sync-2', 'sync-3']);
  const after = await (await fetchJson(s, 'GET', `/api/v1/progress/changes?cursor=${changes.next_cursor}`, buyer.token)).json() as { events: unknown[] };
  assert.equal(after.events.length, 0);
  // Another account cannot read these events or reuse their IDs.
  assert.equal(((await (await fetchJson(s, 'GET', '/api/v1/progress/changes?cursor=0', free.token)).json()) as { events: unknown[] }).events.length, 0);
  const clash = await (await fetchJson(s, 'POST', '/api/v1/progress/events', free.token, { events: [{ ...mine[0], learner_id: free.account.account_id }], after_cursor: null })).json() as typeof first;
  assert.deepEqual(clash.rejected.map(r => r.event_id), ['sync-1']);
  assert.equal((await fetchJson(s, 'POST', '/api/v1/progress/events', undefined, { events: [], after_cursor: null })).status, 401);
  assert.equal((await fetchJson(s, 'GET', '/api/v1/nope')).status, 404);
  await s.app.close();
}));

test('Razorpay adapter speaks the documented protocol (checked against a LOCAL stand-in server, not Razorpay)', async () => {
  const seen: { method: string; url: string; auth: string; body: string }[] = [];
  const stub = createServer((req, res) => {
    let body = ''; req.on('data', c => { body += c; }); req.on('end', () => {
      seen.push({ method: req.method ?? '', url: req.url ?? '', auth: String(req.headers.authorization), body });
      res.setHeader('content-type', 'application/json');
      if (req.method === 'POST' && req.url === '/v1/orders') { const b = JSON.parse(body); res.end(JSON.stringify({ id: 'order_ABC', amount: b.amount, currency: b.currency, status: 'created' })); }
      else if (req.url === '/v1/payments/pay_1') res.end(JSON.stringify({ id: 'pay_1', order_id: 'order_ABC', amount: 39900, currency: 'INR', status: 'captured', amount_refunded: 0 }));
      else if (req.url === '/v1/orders/order_ABC/payments') res.end(JSON.stringify({ items: [{ id: 'pay_1', order_id: 'order_ABC', amount: 39900, currency: 'INR', status: 'refunded', amount_refunded: 39900 }] }));
      else if (req.url === '/v1/payments/pay_missing') { res.statusCode = 400; res.end(JSON.stringify({ error: { code: 'BAD_REQUEST_ERROR' } })); }
      else { res.statusCode = 500; res.end('{}'); }
    });
  });
  await new Promise<void>(r => stub.listen(0, r)); const port = (stub.address() as { port: number }).port;
  const rz = new RazorpayAdapter({ keyId: 'rzp_test_KEY', keySecret: 'SECRET', webhookSecret: 'HOOK', apiBase: `http://127.0.0.1:${port}` });
  const order = await rz.createOrder({ amount_minor: 39900, currency: 'INR', receipt: 'r1', notes: { a: 'b' } });
  assert.deepEqual(order, { provider_order_id: 'order_ABC', amount_minor: 39900, currency: 'INR' });
  assert.equal(seen[0]?.auth, `Basic ${Buffer.from('rzp_test_KEY:SECRET').toString('base64')}`);
  assert.deepEqual(JSON.parse(seen[0]!.body), { amount: 39900, currency: 'INR', receipt: 'r1', notes: { a: 'b' } });
  assert.equal((await rz.fetchPayment('pay_1'))?.status, 'captured'); assert.equal(await rz.fetchPayment('pay_missing'), null);
  assert.equal(await rz.fetchPayment('../orders'), null, 'payment ids are never interpolated unchecked');
  assert.deepEqual((await rz.fetchPaymentsForOrder('order_ABC')).map(p => [p.status, p.amount_refunded_minor]), [['refunded', 39900]]);
  await assert.rejects(rz.createOrder({ amount_minor: 1, currency: 'XXX', receipt: 'r', notes: {} }).then(() => rz.fetchPayment('pay_500')), /lookup failed/);
  // Signature formulas: HMAC-SHA256(order_id|payment_id, key secret) and HMAC-SHA256(raw body, webhook secret).
  const sig = hmacHex('SECRET', 'order_ABC|pay_1');
  assert.equal(rz.verifyCheckoutSignature({ provider_order_id: 'order_ABC', provider_payment_id: 'pay_1', signature: sig }), true);
  assert.equal(rz.verifyCheckoutSignature({ provider_order_id: 'order_XYZ', provider_payment_id: 'pay_1', signature: sig }), false);
  assert.equal(rz.verifyCheckoutSignature({ provider_order_id: 'order_ABC', provider_payment_id: 'pay_1', signature: 'zz' }), false);
  const raw = Buffer.from('{"event":"payment.captured"}');
  assert.equal(rz.verifyWebhookSignature(raw, hmacHex('HOOK', raw)), true); assert.equal(rz.verifyWebhookSignature(Buffer.from('{"event":"payment.captured" }'), hmacHex('HOOK', raw)), false);
  // Known-answer check of the HMAC primitive (RFC 4231 test case 2).
  assert.equal(hmacHex('Jefe', 'what do ya want for nothing?'), '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  await new Promise<void>(r => stub.close(() => r()));
});
