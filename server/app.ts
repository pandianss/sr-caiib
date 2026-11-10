/** HTTP API: accounts, checkout, webhooks, entitlements, progress sync, content delivery and static hosting. */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import type { LearnerEvent, ProgressAck, ProgressChanges } from '../src/types/contracts.ts';
import { validateProgressUpload } from '../src/validation/contracts.ts';
import type { AppManifest, ExamContextRecord } from '../src/core/model.ts';
import type { CoverageLedger } from '../src/core/coverage.ts';
import { PAPER_NAMES } from '../src/core/catalogue.ts';
import type { ServerConfig } from './config.ts';
import { Commerce, HttpError, offers, type Mailer } from './commerce.ts';
import { all, one, openDb, run, tx, type Db } from './db.ts';
import { LocalTestAdapter, ProviderError, RazorpayAdapter, type PaymentAdapter } from './payments.ts';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const MAX_BODY = 1_000_000;

export class LogMailer implements Mailer {
  /** Development only: the latest code per address is kept in memory so the local sign-in flow can be exercised. */
  readonly last = new Map<string, string>();
  async send(to: string, _subject: string, text: string): Promise<void> {
    const code = /\b(\d{6})\b/.exec(text)?.[1];
    if (code) this.last.set(to, code);
    console.log(`[mail:log] to=${to} ${text}`);
  }
}
export class HttpMailer implements Mailer {
  private readonly url: string; private readonly token: string | null; private readonly from: string;
  constructor(url: string, token: string | null, from: string) { this.url = url; this.token = token; this.from = from; }
  async send(to: string, subject: string, text: string): Promise<void> {
    const res = await fetch(this.url, { method: 'POST', signal: AbortSignal.timeout(15_000), headers: { 'content-type': 'application/json', ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) }, body: JSON.stringify({ from: this.from, to, subject, text }) });
    if (!res.ok) throw new HttpError(502, 'mail_failed', 'The sign-in code could not be sent. Try again shortly.');
  }
}

export interface AppOptions { config: ServerConfig; db?: Db; adapter?: PaymentAdapter | null; mailer?: Mailer; now?: () => number }
export interface App { server: Server; commerce: Commerce; db: Db; adapter: PaymentAdapter | null; mailer: Mailer; close(): Promise<void>; listen(port?: number): Promise<number> }

function readJson<T>(file: string): T | null { try { return JSON.parse(readFileSync(file, 'utf8')) as T; } catch { return null; } }

export function createApp(o: AppOptions): App {
  const config = o.config;
  const db = o.db ?? openDb(join(config.dataDir, 'app.sqlite'));
  const adapter: PaymentAdapter | null = o.adapter !== undefined ? o.adapter
    : config.payment.mode === 'local_test' ? new LocalTestAdapter(db)
    : config.payment.mode === 'razorpay' ? new RazorpayAdapter({ keyId: config.payment.razorpayKeyId!, keySecret: config.payment.razorpayKeySecret!, webhookSecret: config.payment.razorpayWebhookSecret!, apiBase: config.payment.razorpayApiBase })
    : null;
  const mailer = o.mailer ?? (config.mail.mode === 'http' ? new HttpMailer(config.mail.httpUrl!, config.mail.httpToken, config.mail.from) : new LogMailer());
  const now = o.now ?? Date.now;
  const manifest = (): AppManifest => readJson<AppManifest>(join(config.contentDir, 'manifest.json')) ?? { generated_at: new Date(0).toISOString(), packs: [] };
  const availability = () => {
    const paid = manifest().packs.filter(p => p.kind === 'published' && p.access === 'full');
    if (!paid.length) return { description: 'No paid content has been published yet. The pass cannot be purchased until reviewed content is available.', purchasable: false };
    const list = paid.map(p => `${PAPER_NAMES[p.paper_id]} (${p.unit_ids.length} unit${p.unit_ids.length === 1 ? '' : 's'})`).join('; ');
    return { description: `Currently available: ${list}. Papers and units not listed here are not yet published and are not part of what you are buying today.`, purchasable: true };
  };
  const commerce = new Commerce({ db, config, adapter, mailer, now, availability });

  const send = (res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
    const payload = body === undefined ? '' : JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers });
    res.end(payload);
  };
  const readBody = (req: IncomingMessage): Promise<Buffer> => new Promise((resolve, reject) => {
    const chunks: Buffer[] = []; let size = 0;
    req.on('data', (c: Buffer) => { size += c.length; if (size > MAX_BODY) { reject(new HttpError(413, 'too_large', 'Request too large.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject);
  });
  const json = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
    const raw = await readBody(req);
    try { const v = JSON.parse(raw.toString('utf8') || '{}'); if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>; } catch { /* fall through */ }
    throw new HttpError(400, 'invalid_json', 'Request body must be a JSON object.');
  };

  async function api(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    const path = url.pathname.replace(/^\/api\/v1/, ''); const method = req.method ?? 'GET'; const auth = req.headers.authorization;
    const route = `${method} ${path}`;

    if (route === 'GET /health') return send(res, 200, { ok: true, time: new Date(now()).toISOString(), payment_mode: config.payment.mode, simulated_payments: adapter?.simulated ?? false });

    // ---- accounts --------------------------------------------------------------------------------------------
    if (route === 'POST /auth/request-code') { await commerce.requestLoginCode((await json(req)).email); return send(res, 200, { ok: true }); }
    if (route === 'POST /auth/verify-code') { const b = await json(req); return send(res, 200, commerce.verifyLoginCode(b.email, b.code)); }
    if (route === 'POST /auth/logout') { commerce.logout(auth); return send(res, 200, { ok: true }); }
    if (route === 'GET /account') { const a = commerce.authenticate(auth); return send(res, 200, { account: a, purchases: commerce.purchases(a.account_id), server_time: new Date(now()).toISOString() }); }

    // ---- offers and checkout -----------------------------------------------------------------------------------
    if (route === 'GET /offers') {
      const av = availability();
      return send(res, 200, { offers: offers(config, av.description), purchasing_enabled: Boolean(adapter) && av.purchasable, purchasable_reason: av.purchasable ? null : av.description, simulated_payments: adapter?.simulated ?? false, key_id: adapter?.publicKeyId() ?? null, business_time_zone: config.businessTimeZone, offline_lease_days: config.offlineLeaseDays, support: 'Refunds and support: contact the publisher using the details shown in the app before purchase.' });
    }
    if (route === 'POST /checkout/orders') { const a = commerce.authenticate(auth); const b = await json(req); return send(res, 200, await commerce.createOrder(a, b.product_id, b.idempotency_key)); }
    if (route === 'POST /checkout/verify') { const a = commerce.authenticate(auth); const b = await json(req); const out = await commerce.verifyCheckout(a, b.order_id, b.provider_payment_id, b.signature); return send(res, 200, { ...out, entitlement: commerce.issueEntitlement(a), server_time: new Date(now()).toISOString() }); }
    const orderMatch = /^\/checkout\/orders\/([A-Za-z0-9-]+)$/.exec(path);
    if (method === 'GET' && orderMatch) { const a = commerce.authenticate(auth); const out = await commerce.orderStatus(a, orderMatch[1]!); return send(res, 200, { ...out, entitlement: commerce.issueEntitlement(a), server_time: new Date(now()).toISOString() }); }
    if (route === 'POST /purchases/restore') { const a = commerce.authenticate(auth); return send(res, 200, { ...(await commerce.restore(a)), server_time: new Date(now()).toISOString() }); }
    if (route === 'POST /webhooks/razorpay') { const raw = await readBody(req); const out = await commerce.handleWebhook(raw, req.headers); return send(res, out.status, { outcome: out.outcome }); }

    // ---- entitlement -------------------------------------------------------------------------------------------
    if (route === 'GET /entitlement/keys') return send(res, 200, { keys: [commerce.publicJwk] }, { 'cache-control': 'public, max-age=3600' });
    if (route === 'GET /entitlement') { const a = commerce.authenticate(auth); return send(res, 200, { entitlement: commerce.issueEntitlement(a), server_time: new Date(now()).toISOString() }); }

    // ---- progress sync (idempotent by event ID) ----------------------------------------------------------------
    if (route === 'POST /progress/events') {
      const a = commerce.authenticate(auth); const body = await json(req); const checked = validateProgressUpload(body);
      const events = Array.isArray(body.events) ? body.events as LearnerEvent[] : [];
      if (!Array.isArray(body.events) || events.length > 500) throw new HttpError(400, 'invalid_upload', 'Upload must contain at most 500 events.');
      const ack: ProgressAck = { accepted_event_ids: [], duplicate_event_ids: [], rejected: [], next_cursor: '0' };
      const badIndexes = new Set<number>();
      if (!checked.ok) for (const issue of checked.issues) { const m = /^\$\.events\[(\d+)\]/.exec(issue.path); if (m) badIndexes.add(Number(m[1])); }
      tx(db, () => {
        const seen = new Set<string>();
        events.forEach((e, i) => {
          const id = typeof e?.event_id === 'string' && e.event_id ? e.event_id : `invalid-${i}`;
          if (seen.has(id)) return; seen.add(id);
          if (badIndexes.has(i)) { ack.rejected.push({ event_id: id, reason: 'Event failed validation.' }); return; }
          if (e.learner_id !== a.account_id) { ack.rejected.push({ event_id: id, reason: 'Event belongs to a different learner.' }); return; }
          const existing = one<{ account_id: string }>(db, 'SELECT account_id FROM progress_events WHERE event_id = ?', id);
          if (existing) { if (existing.account_id === a.account_id) ack.duplicate_event_ids.push(id); else ack.rejected.push({ event_id: id, reason: 'Event ID is already in use.' }); return; }
          run(db, 'INSERT INTO progress_events (account_id, event_id, payload, received_at) VALUES (?, ?, ?, ?)', a.account_id, id, JSON.stringify(e), new Date(now()).toISOString());
          ack.accepted_event_ids.push(id);
        });
      });
      ack.next_cursor = String(one<{ m: number | null }>(db, 'SELECT MAX(seq) AS m FROM progress_events WHERE account_id = ?', a.account_id)?.m ?? 0);
      return send(res, 200, ack);
    }
    if (route === 'GET /progress/changes') {
      const a = commerce.authenticate(auth); const cursor = Number(url.searchParams.get('cursor') ?? '0');
      if (!Number.isSafeInteger(cursor) || cursor < 0) throw new HttpError(400, 'invalid_cursor', 'Invalid cursor.');
      const rows = all<{ seq: number; payload: string }>(db, 'SELECT seq, payload FROM progress_events WHERE account_id = ? AND seq > ? ORDER BY seq LIMIT 201', a.account_id, cursor);
      const page = rows.slice(0, 200);
      const out: ProgressChanges = { events: page.map(r => JSON.parse(r.payload) as LearnerEvent), next_cursor: String(page.at(-1)?.seq ?? cursor), has_more: rows.length > 200 };
      return send(res, 200, out);
    }

    // ---- content ------------------------------------------------------------------------------------------------
    if (route === 'GET /papers') {
      const ledger = readJson<CoverageLedger>(join(config.contentDir, 'coverage.json')); const packs = manifest().packs;
      return send(res, 200, { papers: (ledger?.papers ?? []).map(p => ({ paper_id: p.paper_id, name: p.title, kind: p.kind, baseline_status: p.baseline.status, topics_listed: p.topics.length, published_packs: packs.filter(x => x.paper_id === p.paper_id && x.kind === 'published').map(x => ({ pack_id: x.pack_id, pack_version: x.pack_version, access: x.access })) })) });
    }
    if (route === 'GET /exam-config') {
      const id = url.searchParams.get('exam_context_id'); const list = readJson<ExamContextRecord[]>(join(config.contentDir, 'exam-contexts.json')) ?? [];
      const found = list.find(c => c.exam_context_id === id);
      if (!found) throw new HttpError(404, 'unknown_exam_context', 'Unknown exam context.');
      return send(res, 200, found);
    }
    if (route === 'GET /packs/manifest') {
      const ctx = url.searchParams.get('exam_context_id'), paper = url.searchParams.get('paper_id');
      const origin = `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers.host ?? 'localhost'}`;
      const packs = manifest().packs.filter(p => (!ctx || p.exam_context_id === ctx) && (!paper || p.paper_id === paper)).map(p => ({ ...p, download_url: `${origin}/api/v1/packs/${encodeURIComponent(p.pack_id)}?version=${encodeURIComponent(p.pack_version)}` }));
      return send(res, 200, { generated_at: manifest().generated_at, packs });
    }
    const packMatch = /^\/packs\/([A-Za-z0-9._-]+)$/.exec(path);
    if (method === 'GET' && packMatch) {
      const entry = manifest().packs.find(p => p.pack_id === packMatch[1] && (!url.searchParams.get('version') || p.pack_version === url.searchParams.get('version')));
      if (!entry) throw new HttpError(404, 'unknown_pack', 'Unknown content pack.');
      if (entry.access === 'full' && entry.kind === 'published') {
        const a = commerce.authenticate(auth); const active = commerce.activePurchase(a.account_id);
        if (!active) throw new HttpError(403, 'not_entitled', 'This content needs an active pass.');
      }
      const file = join(config.contentDir, normalize(entry.path));
      if (!file.startsWith(config.contentDir + sep) || !existsSync(file)) throw new HttpError(404, 'unknown_pack', 'Content file is missing.');
      const bytes = readFileSync(file);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': String(bytes.length), 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' });
      res.end(bytes); return;
    }

    // ---- development-only simulation controls ---------------------------------------------------------------------
    if (adapter instanceof LocalTestAdapter && config.mode === 'development') {
      if (route === 'GET /dev/last-code' && mailer instanceof LogMailer) return send(res, 200, { code: mailer.last.get(String(url.searchParams.get('email') ?? '').toLowerCase()) ?? null });
      if (route === 'POST /dev/sim/pay') {
        const a = commerce.authenticate(auth); const b = await json(req);
        const order = one<{ provider_order_id: string }>(db, 'SELECT provider_order_id FROM orders WHERE order_id = ? AND account_id = ?', String(b.order_id), a.account_id);
        if (!order) throw new HttpError(404, 'unknown_order', 'Order not found.');
        const outcome = b.outcome === 'failed' ? 'failed' : b.outcome === 'authorized' ? 'authorized' : 'captured';
        return send(res, 200, adapter.simulatePayment(order.provider_order_id, outcome));
      }
      if (route === 'POST /dev/sim/refund') {
        const a = commerce.authenticate(auth); const b = await json(req);
        const p = commerce.purchases(a.account_id).find(x => x.purchase_id === b.purchase_id);
        if (!p) throw new HttpError(404, 'unknown_purchase', 'Purchase not found.');
        adapter.simulateRefund(p.provider_transaction_id);
        const hook = adapter.webhook('refund.processed', p.provider_transaction_id);
        return send(res, 200, await commerce.handleWebhook(hook.rawBody, hook.headers));
      }
    }
    throw new HttpError(404, 'not_found', 'Not found.');
  }

  function serveStatic(req: IncomingMessage, res: ServerResponse, url: URL): void {
    const root = config.staticDir;
    if (!root || (req.method !== 'GET' && req.method !== 'HEAD')) { send(res, 404, { error: { code: 'not_found', message: 'Not found.' } }); return; }
    let rel = decodeURIComponent(url.pathname); if (rel.endsWith('/')) rel += 'index.html';
    let file = join(root, normalize(rel));
    if (!file.startsWith(root + sep) && file !== root) { send(res, 400, { error: { code: 'bad_path', message: 'Bad path.' } }); return; }
    if (!existsSync(file) || !statSync(file).isFile()) {
      if (extname(rel)) { send(res, 404, { error: { code: 'not_found', message: 'Not found.' } }); return; }
      file = join(root, 'index.html'); // single-page app fallback
      if (!existsSync(file)) { send(res, 404, { error: { code: 'not_found', message: 'Not found.' } }); return; }
    }
    const ext = extname(file); const bytes = readFileSync(file);
    const immutable = /[\\/]assets[\\/]/.test(file);
    res.writeHead(200, {
      'content-type': MIME[ext] ?? 'application/octet-stream', 'content-length': String(bytes.length), 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
      'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      ...(ext === '.html' ? { 'content-security-policy': "default-src 'self'; script-src 'self' https://checkout.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; connect-src 'self' https://lumberjack.razorpay.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'" } : {}),
    });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  }

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const origin = req.headers.origin;
    const cors: Record<string, string> = origin && config.appOrigins.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' } : {};
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (!url.pathname.startsWith('/api/')) { try { serveStatic(req, res, url); } catch { send(res, 500, { error: { code: 'server_error', message: 'Something went wrong.' } }); } return; }
    api(req, res, url).catch((e: unknown) => {
      if (res.headersSent) { res.end(); return; }
      if (e instanceof HttpError) return send(res, e.status, { error: { code: e.code, message: e.message } });
      if (e instanceof ProviderError) { console.error(`[provider] ${e.message}`); return send(res, 502, { error: { code: 'provider_unavailable', message: 'The payment provider could not be reached. Nothing was charged by this request; try again shortly.' } }); }
      console.error('[server]', e instanceof Error ? e.stack : e);
      return send(res, 500, { error: { code: 'server_error', message: 'Something went wrong.' } });
    });
  });

  return {
    server, commerce, db, adapter, mailer,
    listen: (port = config.port) => new Promise<number>((resolve, reject) => { server.once('error', reject); server.listen(port, () => { const a = server.address(); resolve(typeof a === 'object' && a ? a.port : port); }); }),
    close: () => new Promise<void>(resolve => { server.close(() => { try { db.close(); } catch { /* already closed */ } resolve(); }); server.closeAllConnections(); }),
  };
}
