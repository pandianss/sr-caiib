/**
 * Accounts, purchase ledger, payment reconciliation and signed entitlements.
 *
 * Trust rules:
 * - Amount, currency and product come from the server-side offer; a client-supplied price is never used.
 * - Access is granted only after the provider reports a captured payment whose order, amount and currency
 *   match the server's own order for that account. A client success callback alone grants nothing.
 * - Purchase state is monotonic for refunds: once refunded or revoked it never returns to verified, so a
 *   delayed or replayed capture notification cannot undo a refund.
 * - Records carry the payment environment (simulation / test / live); entitlements are issued only from
 *   purchases made in the server's current environment.
 */
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, randomInt, randomUUID, sign as cryptoSign, type KeyObject } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { OfflineEntitlementClaims, PaperId, ProductOffer, PurchaseRecord, SignedOfflineEntitlement } from '../src/types/contracts.ts';
import { validateEntitlementClaims } from '../src/validation/contracts.ts';
import { addCalendarMonths } from '../src/core/time.ts';
import type { PaymentEnvironment, ServerConfig } from './config.ts';
import { paymentEnvironment } from './config.ts';
import { all, one, run, tx, type Db } from './db.ts';
import type { PaymentAdapter, ProviderPayment } from './payments.ts';

export class HttpError extends Error {
  readonly status: number; readonly code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
const nowIso = (ms: number): string => new Date(ms).toISOString();
export const normaliseEmail = (raw: unknown): string => {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');
  return email;
};

// ---- offers -------------------------------------------------------------------------------------------------
export const PRICE_VERSION = 'TEST-PRICE-2026-11';
/** Test-price proposal from the product specification. Not an approved public offer. */
export function offers(config: ServerConfig, availability: string): ProductOffer[] {
  return [{
    product_id: 'CAIIB_PASS_6M', title: 'CAIIB preparation pass (6 months)', provider: 'razorpay', provider_product_id: 'CAIIB_PASS_6M',
    currency: 'INR', amount_minor: 39_900,
    term_description: `${config.accessTermMonths} calendar months from the time payment is verified. One-time payment; does not renew automatically.`,
    auto_renews: false, included_papers: ['ABM', 'BFM', 'ABFM', 'BRBL', 'CB', 'RM', 'ITDB', 'HRM', 'RB'] satisfies PaperId[],
    content_availability_description: availability,
  }];
}

// ---- accounts and sessions ------------------------------------------------------------------------------------
export interface Mailer { send(to: string, subject: string, text: string): Promise<void> }
export interface Account { account_id: string; email: string }
const CODE_TTL_MS = 10 * 60_000, MAX_CODE_ATTEMPTS = 5, MAX_REQUESTS_PER_HOUR = 5, SESSION_TTL_MS = 60 * 86_400_000;

export class Commerce {
  readonly db: Db; readonly config: ServerConfig; readonly adapter: PaymentAdapter | null; readonly mailer: Mailer;
  readonly environment: PaymentEnvironment | null;
  private readonly signingKey: KeyObject; readonly keyId: string; readonly publicJwk: { kty: 'EC'; crv: 'P-256'; x: string; y: string; kid: string };
  private readonly now: () => number;
  /** Text describing what content is actually available, shown before checkout. */
  availability: () => { description: string; purchasable: boolean };

  constructor(o: { db: Db; config: ServerConfig; adapter: PaymentAdapter | null; mailer: Mailer; now?: () => number; availability?: () => { description: string; purchasable: boolean } }) {
    this.db = o.db; this.config = o.config; this.adapter = o.adapter; this.mailer = o.mailer; this.now = o.now ?? Date.now;
    this.environment = paymentEnvironment(o.config);
    this.availability = o.availability ?? (() => ({ description: 'No paid content has been published yet.', purchasable: false }));
    this.signingKey = loadOrCreateKey(o.config);
    const jwk = createPublicKey(this.signingKey).export({ format: 'jwk' }) as { x: string; y: string };
    this.keyId = sha256(`${jwk.x}.${jwk.y}`).slice(0, 16);
    this.publicJwk = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, kid: this.keyId };
  }

  async requestLoginCode(rawEmail: unknown): Promise<void> {
    const email = normaliseEmail(rawEmail); const now = this.now();
    const recent = one<{ n: number }>(this.db, 'SELECT COUNT(*) AS n FROM login_requests WHERE email = ? AND requested_at > ?', email, nowIso(now - 3_600_000));
    if ((recent?.n ?? 0) >= MAX_REQUESTS_PER_HOUR) throw new HttpError(429, 'too_many_requests', 'Too many sign-in codes requested. Try again in an hour.');
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    tx(this.db, () => {
      run(this.db, 'INSERT INTO login_requests (email, requested_at) VALUES (?, ?)', email, nowIso(now));
      run(this.db, 'INSERT INTO login_codes (email, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = excluded.created_at',
        email, sha256(`${email}:${code}`), nowIso(now + CODE_TTL_MS), nowIso(now));
    });
    await this.mailer.send(email, 'Your CAIIB study sign-in code', `Your sign-in code is ${code}. It expires in 10 minutes. If you did not request it, ignore this message.`);
  }

  verifyLoginCode(rawEmail: unknown, rawCode: unknown): { token: string; account: Account } {
    const email = normaliseEmail(rawEmail); const code = typeof rawCode === 'string' ? rawCode.trim() : ''; const now = this.now();
    const bad = new HttpError(401, 'invalid_code', 'That code is not valid or has expired. Request a new one.');
    return txCommit(this.db, () => {
      const row = one<{ code_hash: string; expires_at: string; attempts: number }>(this.db, 'SELECT code_hash, expires_at, attempts FROM login_codes WHERE email = ?', email);
      if (!row || Date.parse(row.expires_at) <= now || row.attempts >= MAX_CODE_ATTEMPTS) { if (row) run(this.db, 'DELETE FROM login_codes WHERE email = ?', email); throw commitThenThrow(bad); }
      if (row.code_hash !== sha256(`${email}:${code}`)) { run(this.db, 'UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?', email); throw commitThenThrow(bad); }
      run(this.db, 'DELETE FROM login_codes WHERE email = ?', email);
      let account = one<Account>(this.db, 'SELECT account_id, email FROM accounts WHERE email = ?', email);
      if (!account) { account = { account_id: `acct-${randomUUID()}`, email }; run(this.db, 'INSERT INTO accounts (account_id, email, created_at) VALUES (?, ?, ?)', account.account_id, email, nowIso(now)); }
      const token = randomBytes(32).toString('base64url');
      run(this.db, 'INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)', sha256(token), account.account_id, nowIso(now), nowIso(now + SESSION_TTL_MS));
      return { token, account };
    });
  }

  authenticate(authorization: string | undefined): Account {
    const token = /^Bearer ([A-Za-z0-9_-]{20,})$/.exec(authorization ?? '')?.[1];
    if (!token) throw new HttpError(401, 'unauthenticated', 'Sign in to continue.');
    const row = one<Account & { expires_at: string }>(this.db, 'SELECT a.account_id, a.email, s.expires_at FROM sessions s JOIN accounts a ON a.account_id = s.account_id WHERE s.token_hash = ?', sha256(token));
    if (!row || Date.parse(row.expires_at) <= this.now()) throw new HttpError(401, 'unauthenticated', 'Your sign-in has expired. Sign in again.');
    return { account_id: row.account_id, email: row.email };
  }
  logout(authorization: string | undefined): void {
    const token = /^Bearer (.+)$/.exec(authorization ?? '')?.[1];
    if (token) run(this.db, 'DELETE FROM sessions WHERE token_hash = ?', sha256(token));
  }

  // ---- checkout ------------------------------------------------------------------------------------------------
  private requireAdapter(): { adapter: PaymentAdapter; environment: PaymentEnvironment } {
    if (!this.adapter || !this.environment) throw new HttpError(503, 'purchasing_unavailable', 'Purchasing is not enabled.');
    return { adapter: this.adapter, environment: this.environment };
  }

  async createOrder(account: Account, productId: unknown, idempotencyKey: unknown): Promise<OrderView> {
    const { adapter, environment } = this.requireAdapter();
    const availability = this.availability();
    if (!availability.purchasable) throw new HttpError(409, 'nothing_to_sell', 'There is no published paid content yet, so the pass cannot be purchased.');
    const offer = offers(this.config, availability.description).find(o => o.product_id === productId);
    if (!offer) throw new HttpError(400, 'unknown_product', 'Unknown product.');
    if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(idempotencyKey)) throw new HttpError(400, 'invalid_idempotency_key', 'Invalid request key.');
    if (this.activePurchase(account.account_id)) throw new HttpError(409, 'already_active', 'This account already has an active pass. Use Restore purchases instead of paying again.');
    const existing = one<OrderRow>(this.db, 'SELECT * FROM orders WHERE account_id = ? AND idempotency_key = ?', account.account_id, idempotencyKey);
    if (existing) return orderView(existing, adapter);
    const orderId = `ord-${randomUUID()}`;
    const provider = await adapter.createOrder({ amount_minor: offer.amount_minor, currency: offer.currency, receipt: orderId.slice(0, 40), notes: { order_id: orderId, product_id: offer.product_id } });
    const at = nowIso(this.now());
    try {
      run(this.db, 'INSERT INTO orders (order_id, account_id, product_id, price_version, amount_minor, currency, provider, environment, provider_order_id, idempotency_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        orderId, account.account_id, offer.product_id, PRICE_VERSION, offer.amount_minor, offer.currency, 'razorpay', environment, provider.provider_order_id, idempotencyKey, 'created', at, at);
    } catch { // a concurrent request with the same key won the race
      const raced = one<OrderRow>(this.db, 'SELECT * FROM orders WHERE account_id = ? AND idempotency_key = ?', account.account_id, idempotencyKey);
      if (raced) return orderView(raced, adapter);
      throw new HttpError(500, 'order_failed', 'Could not create the order.');
    }
    return orderView(one<OrderRow>(this.db, 'SELECT * FROM orders WHERE order_id = ?', orderId)!, adapter);
  }

  /** Client hand-back after checkout. The signature is checked against the SERVER's order, then the provider is queried. */
  async verifyCheckout(account: Account, orderId: unknown, providerPaymentId: unknown, signature: unknown): Promise<PurchaseOutcome> {
    const { adapter } = this.requireAdapter();
    const order = typeof orderId === 'string' ? one<OrderRow>(this.db, 'SELECT * FROM orders WHERE order_id = ? AND account_id = ?', orderId, account.account_id) : undefined;
    if (!order) throw new HttpError(404, 'unknown_order', 'Order not found for this account.');
    if (typeof providerPaymentId !== 'string' || typeof signature !== 'string' || !adapter.verifyCheckoutSignature({ provider_order_id: order.provider_order_id, provider_payment_id: providerPaymentId, signature })) {
      throw new HttpError(400, 'invalid_signature', 'The payment confirmation could not be verified.');
    }
    const payment = await adapter.fetchPayment(providerPaymentId);
    if (!payment) throw new HttpError(400, 'unknown_payment', 'The payment could not be found with the provider.');
    return this.applyPayment(order, payment);
  }

  /** Re-checks an order against the provider (pending recovery, app closed during payment, restore). */
  async reconcileOrder(order: OrderRow): Promise<PurchaseOutcome> {
    const { adapter } = this.requireAdapter();
    const payments = await adapter.fetchPaymentsForOrder(order.provider_order_id);
    const rank: Record<string, number> = { refunded: 5, captured: 4, authorized: 3, created: 2, failed: 1 };
    const best = [...payments].sort((a, b) => (rank[b.status] ?? 0) - (rank[a.status] ?? 0))[0];
    const existing = this.purchaseForOrder(order.order_id);
    // A known purchase is always re-read through its own payment so a refund is never masked by another attempt.
    const own = existing ? payments.find(p => p.provider_payment_id === existing.provider_transaction_id) : undefined;
    const chosen = own ?? best;
    if (!chosen) return { status: order.status === 'failed' ? 'failed' : 'pending', purchase: null };
    return this.applyPayment(order, chosen);
  }

  async orderStatus(account: Account, orderId: string): Promise<PurchaseOutcome> {
    const order = one<OrderRow>(this.db, 'SELECT * FROM orders WHERE order_id = ? AND account_id = ?', orderId, account.account_id);
    if (!order) throw new HttpError(404, 'unknown_order', 'Order not found for this account.');
    return this.reconcileOrder(order);
  }

  /** Restore: re-verifies every order of THIS account with the provider. Another account's payment cannot be claimed. */
  async restore(account: Account): Promise<{ purchases: PurchaseRecord[]; entitlement: SignedOfflineEntitlement | null }> {
    if (this.adapter && this.environment) {
      for (const order of all<OrderRow>(this.db, 'SELECT * FROM orders WHERE account_id = ? AND environment = ?', account.account_id, this.environment)) {
        try { await this.reconcileOrder(order); } catch (e) { if (!(e instanceof HttpError)) throw e; }
      }
    }
    return { purchases: this.purchases(account.account_id), entitlement: this.issueEntitlement(account) };
  }

  /**
   * Applies the provider's CURRENT payment state to the ledger in one transaction.
   * Mismatched order/amount/currency never grants access.
   */
  private applyPayment(order: OrderRow, payment: ProviderPayment): PurchaseOutcome {
    const at = nowIso(this.now());
    return txCommit(this.db, () => {
      if (payment.provider_order_id !== order.provider_order_id) throw commitThenThrow(new HttpError(400, 'order_mismatch', 'This payment belongs to a different order.'));
      if (payment.amount_minor !== order.amount_minor || payment.currency !== order.currency) {
        run(this.db, "UPDATE orders SET status = 'mismatch', updated_at = ? WHERE order_id = ?", at, order.order_id);
        throw commitThenThrow(new HttpError(400, 'amount_mismatch', 'The paid amount does not match the order. No access was granted; contact support.'));
      }
      const existing = this.purchaseForOrder(order.order_id);
      if (existing && existing.provider_transaction_id !== payment.provider_payment_id) {
        // A different payment attempt for an order that already has a recorded purchase: keep the recorded one.
        return { status: outcomeOf(existing.status), purchase: existing };
      }
      const refunded = payment.status === 'refunded' || (payment.amount_refunded_minor >= payment.amount_minor && payment.amount_minor > 0);
      if (refunded) {
        if (existing) {
          if (existing.status !== 'refunded' && existing.status !== 'revoked') run(this.db, "UPDATE purchases SET status = 'refunded', refunded_at = ?, entitlement_version = entitlement_version + 1, updated_at = ? WHERE purchase_id = ?", at, at, existing.purchase_id);
        } else {
          run(this.db, "INSERT INTO purchases (purchase_id, account_id, product_id, provider, environment, order_id, provider_transaction_id, amount_minor, currency, status, refunded_at, updated_at) VALUES (?, ?, ?, 'razorpay', ?, ?, ?, ?, ?, 'refunded', ?, ?)",
            `pur-${randomUUID()}`, order.account_id, order.product_id, order.environment, order.order_id, payment.provider_payment_id, order.amount_minor, order.currency, at, at);
        }
        run(this.db, "UPDATE orders SET status = 'refunded', updated_at = ? WHERE order_id = ?", at, order.order_id);
        return { status: 'refunded', purchase: this.purchaseForOrder(order.order_id) };
      }
      if (payment.status === 'captured') {
        if (existing) {
          // Refunded or revoked is terminal: a late capture notice cannot restore access.
          if (existing.status === 'pending' || existing.status === 'failed') this.markVerified(existing.purchase_id, at);
        } else {
          const id = `pur-${randomUUID()}`;
          run(this.db, "INSERT INTO purchases (purchase_id, account_id, product_id, provider, environment, order_id, provider_transaction_id, amount_minor, currency, status, updated_at) VALUES (?, ?, ?, 'razorpay', ?, ?, ?, ?, ?, 'pending', ?)",
            id, order.account_id, order.product_id, order.environment, order.order_id, payment.provider_payment_id, order.amount_minor, order.currency, at);
          this.markVerified(id, at);
        }
        const p = this.purchaseForOrder(order.order_id)!;
        if (p.status === 'verified') run(this.db, "UPDATE orders SET status = 'paid', updated_at = ? WHERE order_id = ?", at, order.order_id);
        return { status: outcomeOf(p.status), purchase: p };
      }
      if (payment.status === 'failed') {
        if (!existing && order.status === 'created') run(this.db, "UPDATE orders SET status = 'failed', updated_at = ? WHERE order_id = ?", at, order.order_id);
        return { status: existing ? outcomeOf(existing.status) : 'failed', purchase: existing ?? null };
      }
      return { status: existing ? outcomeOf(existing.status) : 'pending', purchase: existing ?? null }; // created / authorized: not yet paid
    });
  }

  private markVerified(purchaseId: string, at: string): void {
    const expires = addCalendarMonths(at, this.config.accessTermMonths, this.config.businessTimeZone);
    run(this.db, "UPDATE purchases SET status = 'verified', verified_at = ?, access_starts_at = ?, access_expires_at = ?, entitlement_version = entitlement_version + 1, updated_at = ? WHERE purchase_id = ?", at, at, expires, at, purchaseId);
  }

  /** Webhook delivery. Signature is checked on the raw body; event IDs are processed once; state comes from the provider. */
  async handleWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<{ status: number; outcome: string }> {
    const { adapter } = this.requireAdapter();
    const signature = String(headers['x-razorpay-signature'] ?? ''); const eventId = String(headers['x-razorpay-event-id'] ?? '');
    if (!signature || !adapter.verifyWebhookSignature(rawBody, signature)) return { status: 400, outcome: 'invalid_signature' };
    if (!eventId) return { status: 400, outcome: 'missing_event_id' };
    if (one(this.db, "SELECT 1 FROM provider_events WHERE provider = 'razorpay' AND event_id = ?", eventId)) return { status: 200, outcome: 'duplicate' };
    let body: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    try { body = JSON.parse(rawBody.toString('utf8')); } catch { return { status: 400, outcome: 'invalid_json' }; }
    const type = typeof body.event === 'string' ? body.event : 'unknown';
    const entity = body.payload?.payment?.entity;
    let outcome = 'ignored';
    if (entity?.id && entity.order_id) {
      const order = one<OrderRow>(this.db, 'SELECT * FROM orders WHERE provider_order_id = ?', entity.order_id);
      if (order) {
        // The event is only a trigger: current truth is read from the provider, so ordering does not matter.
        const payment = await adapter.fetchPayment(entity.id);
        if (payment) {
          try { outcome = this.applyPayment(order, payment).status; }
          catch (e) { if (e instanceof HttpError) outcome = e.code; else throw e; }
        } else outcome = 'payment_not_found';
      } else outcome = 'unknown_order';
    }
    // Recorded only after durable processing, so a crash before this point lets the provider's retry redo the work.
    run(this.db, "INSERT OR IGNORE INTO provider_events (provider, event_id, event_type, outcome, received_at) VALUES ('razorpay', ?, ?, ?, ?)", eventId, type, outcome, nowIso(this.now()));
    return { status: 200, outcome };
  }

  /** Owner-initiated revocation (for example after a chargeback handled outside the provider webhook). */
  revoke(purchaseId: string): boolean {
    const at = nowIso(this.now());
    return run(this.db, "UPDATE purchases SET status = 'revoked', entitlement_version = entitlement_version + 1, updated_at = ? WHERE purchase_id = ? AND status = 'verified'", at, purchaseId).changes > 0;
  }

  // ---- queries -------------------------------------------------------------------------------------------------
  purchaseForOrder(orderId: string): PurchaseRecord | null { const r = one<PurchaseRow>(this.db, 'SELECT * FROM purchases WHERE order_id = ?', orderId); return r ? toPurchase(r) : null; }
  purchases(accountId: string): PurchaseRecord[] { return all<PurchaseRow>(this.db, 'SELECT * FROM purchases WHERE account_id = ? ORDER BY updated_at', accountId).map(toPurchase); }
  private activePurchaseRow(accountId: string): PurchaseRow | undefined {
    if (!this.environment) return undefined;
    return one<PurchaseRow>(this.db, "SELECT * FROM purchases WHERE account_id = ? AND environment = ? AND status = 'verified' AND access_expires_at > ? ORDER BY access_expires_at DESC LIMIT 1", accountId, this.environment, nowIso(this.now()));
  }
  activePurchase(accountId: string): PurchaseRecord | null { const r = this.activePurchaseRow(accountId); return r ? toPurchase(r) : null; }

  /** Signs an offline entitlement for the account's active purchase, or returns null (fail closed). */
  issueEntitlement(account: Account): SignedOfflineEntitlement | null {
    const row = this.activePurchaseRow(account.account_id);
    if (!row || !row.access_expires_at) return null;
    const now = this.now(); const expires = Date.parse(row.access_expires_at);
    const offlineUntil = Math.min(now + this.config.offlineLeaseDays * 86_400_000, expires);
    if (offlineUntil <= now) return null;
    const offer = offers(this.config, '').find(o => o.product_id === row.product_id);
    if (!offer) return null;
    const claims: OfflineEntitlementClaims = {
      entitlement_id: `ent-${row.purchase_id}-${row.entitlement_version}-${now}`, learner_id: account.account_id, product_id: row.product_id, purchase_id: row.purchase_id,
      issued_at: nowIso(now), access_expires_at: row.access_expires_at, offline_until: nowIso(offlineUntil), allowed_papers: offer.included_papers, entitlement_version: row.entitlement_version,
    };
    if (!validateEntitlementClaims(claims).ok) return null;
    return { key_id: this.keyId, signed_token: signJws(claims, this.signingKey, this.keyId) };
  }
}

// ---- helpers ----------------------------------------------------------------------------------------------------
export interface OrderRow { order_id: string; account_id: string; product_id: string; price_version: string; amount_minor: number; currency: string; provider: string; environment: PaymentEnvironment; provider_order_id: string; idempotency_key: string; status: string; created_at: string; updated_at: string }
interface PurchaseRow { purchase_id: string; account_id: string; product_id: string; provider: 'razorpay'; environment: string; order_id: string; provider_transaction_id: string; amount_minor: number; currency: 'INR'; status: PurchaseRecord['status']; verified_at: string | null; access_starts_at: string | null; access_expires_at: string | null; refunded_at: string | null; entitlement_version: number; updated_at: string }
export interface OrderView { order_id: string; provider_order_id: string; amount_minor: number; currency: string; key_id: string; simulated: boolean; status: string }
export interface PurchaseOutcome { status: 'pending' | 'verified' | 'failed' | 'refunded' | 'revoked'; purchase: PurchaseRecord | null }

const outcomeOf = (s: PurchaseRecord['status']): PurchaseOutcome['status'] => s;
const orderView = (o: OrderRow, adapter: PaymentAdapter): OrderView => ({ order_id: o.order_id, provider_order_id: o.provider_order_id, amount_minor: o.amount_minor, currency: o.currency, key_id: adapter.publicKeyId(), simulated: adapter.simulated, status: o.status });
const toPurchase = (r: PurchaseRow): PurchaseRecord => ({
  purchase_id: r.purchase_id, learner_id: r.account_id, product_id: r.product_id, provider: r.provider, provider_transaction_id: r.provider_transaction_id,
  amount_minor: r.amount_minor, currency: r.currency, status: r.status, verified_at: r.verified_at, access_starts_at: r.access_starts_at, access_expires_at: r.access_expires_at, refunded_at: r.refunded_at,
});

/**
 * Marks an error whose preceding writes in the same transaction must still be committed (for example a
 * failed-attempt counter). tx() rolls back on throw, so such writes are re-applied by the caller pattern
 * below: we commit first, then rethrow.
 */
class CommitThenThrow extends Error { readonly inner: HttpError; constructor(inner: HttpError) { super(inner.message); this.inner = inner; } }
function commitThenThrow(e: HttpError): CommitThenThrow { return new CommitThenThrow(e); }
/** Like tx(), but a CommitThenThrow commits the writes made so far and then throws the wrapped error. */
function txCommit<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const out = fn(); db.exec('COMMIT'); return out; }
  catch (e) {
    if (e instanceof CommitThenThrow) { db.exec('COMMIT'); throw e.inner; }
    try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    throw e;
  }
}

function loadOrCreateKey(config: ServerConfig): KeyObject {
  if (existsSync(config.entitlementKeyFile)) return createPrivateKey(readFileSync(config.entitlementKeyFile, 'utf8'));
  if (config.mode === 'production') throw new Error('Entitlement signing key file is missing.');
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  if (config.entitlementKeyFile !== ':memory:') {
    mkdirSync(dirname(config.entitlementKeyFile), { recursive: true });
    writeFileSync(config.entitlementKeyFile, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  }
  return privateKey;
}

const b64url = (b: Buffer | string): string => Buffer.from(b).toString('base64url');
export function signJws(claims: object, key: KeyObject, kid: string): string {
  const head = b64url(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid })), body = b64url(JSON.stringify(claims));
  const sig = cryptoSign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64url(sig)}`;
}
