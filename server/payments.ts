/**
 * Payment provider adapters.
 *
 * RazorpayAdapter talks to the real Razorpay REST API (test or live keys). LocalTestAdapter is a LOCAL
 * SIMULATION that follows the same order/payment/signature protocol against tables in the app database.
 * Results from the simulation are never evidence of provider sandbox verification.
 *
 * Razorpay protocol implemented here (Standard Checkout, Orders API, webhooks):
 * - Order: POST /v1/orders with HTTP Basic auth (key id : key secret); amount in paise.
 * - Checkout signature: hex HMAC-SHA256 of `${order_id}|${payment_id}` keyed with the key secret, where
 *   order_id is the SERVER's stored order id (never one supplied by the client).
 * - Webhook signature: hex HMAC-SHA256 of the raw request body keyed with the webhook secret
 *   (header X-Razorpay-Signature); duplicate deliveries share the header x-razorpay-event-id.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Db } from './db.ts';
import { all, one, run } from './db.ts';

export interface ProviderOrder { provider_order_id: string; amount_minor: number; currency: string }
export type ProviderPaymentStatus = 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
export interface ProviderPayment {
  provider_payment_id: string; provider_order_id: string; amount_minor: number; currency: string;
  status: ProviderPaymentStatus; amount_refunded_minor: number;
}
export class ProviderError extends Error {}

export interface PaymentAdapter {
  readonly simulated: boolean;
  publicKeyId(): string;
  createOrder(input: { amount_minor: number; currency: string; receipt: string; notes: Record<string, string> }): Promise<ProviderOrder>;
  verifyCheckoutSignature(input: { provider_order_id: string; provider_payment_id: string; signature: string }): boolean;
  fetchPayment(providerPaymentId: string): Promise<ProviderPayment | null>;
  fetchPaymentsForOrder(providerOrderId: string): Promise<ProviderPayment[]>;
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
}

export function hmacHex(secret: string, data: string | Buffer): string { return createHmac('sha256', secret).update(data).digest('hex'); }
export function safeEqualHex(a: string, b: string): boolean {
  if (!/^[0-9a-f]+$/i.test(a) || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a.toLowerCase(), 'hex'), Buffer.from(b.toLowerCase(), 'hex'));
}

interface RzpPayment { id: string; order_id: string | null; amount: number; currency: string; status: string; amount_refunded?: number }
const mapPayment = (p: RzpPayment): ProviderPayment => ({
  provider_payment_id: p.id, provider_order_id: p.order_id ?? '', amount_minor: p.amount, currency: p.currency,
  status: (['created', 'authorized', 'captured', 'refunded', 'failed'].includes(p.status) ? p.status : 'failed') as ProviderPaymentStatus,
  amount_refunded_minor: p.amount_refunded ?? 0,
});

export class RazorpayAdapter implements PaymentAdapter {
  readonly simulated = false;
  private readonly keyId: string; private readonly keySecret: string; private readonly webhookSecret: string; private readonly base: string;
  private readonly fetcher: typeof fetch;
  constructor(o: { keyId: string; keySecret: string; webhookSecret: string; apiBase: string; fetcher?: typeof fetch }) {
    this.keyId = o.keyId; this.keySecret = o.keySecret; this.webhookSecret = o.webhookSecret; this.base = o.apiBase.replace(/\/$/, ''); this.fetcher = o.fetcher ?? fetch;
  }
  publicKeyId(): string { return this.keyId; }
  private async call<T>(method: string, path: string, body?: unknown): Promise<{ status: number; json: T }> {
    const res = await this.fetcher(`${this.base}${path}`, {
      method, signal: AbortSignal.timeout(15_000),
      headers: { authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let json: unknown = null;
    try { json = await res.json(); } catch { /* non-JSON error body */ }
    return { status: res.status, json: json as T };
  }
  async createOrder(input: { amount_minor: number; currency: string; receipt: string; notes: Record<string, string> }): Promise<ProviderOrder> {
    const { status, json } = await this.call<{ id?: string; amount?: number; currency?: string }>('POST', '/v1/orders', { amount: input.amount_minor, currency: input.currency, receipt: input.receipt, notes: input.notes });
    if (status !== 200 || !json?.id || json.amount !== input.amount_minor || json.currency !== input.currency) throw new ProviderError(`Razorpay order creation failed (HTTP ${status}).`);
    return { provider_order_id: json.id, amount_minor: json.amount, currency: json.currency };
  }
  verifyCheckoutSignature(i: { provider_order_id: string; provider_payment_id: string; signature: string }): boolean {
    return safeEqualHex(i.signature, hmacHex(this.keySecret, `${i.provider_order_id}|${i.provider_payment_id}`));
  }
  async fetchPayment(id: string): Promise<ProviderPayment | null> {
    if (!/^[A-Za-z0-9_]+$/.test(id)) return null;
    const { status, json } = await this.call<RzpPayment>('GET', `/v1/payments/${id}`);
    if (status === 400 || status === 404) return null;
    if (status !== 200 || !json?.id) throw new ProviderError(`Razorpay payment lookup failed (HTTP ${status}).`);
    return mapPayment(json);
  }
  async fetchPaymentsForOrder(orderId: string): Promise<ProviderPayment[]> {
    const { status, json } = await this.call<{ items?: RzpPayment[] }>('GET', `/v1/orders/${orderId}/payments`);
    if (status !== 200 || !Array.isArray(json?.items)) throw new ProviderError(`Razorpay order payments lookup failed (HTTP ${status}).`);
    return json.items.map(mapPayment);
  }
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean { return safeEqualHex(signature, hmacHex(this.webhookSecret, rawBody)); }
}

/** LOCAL SIMULATION ONLY. Mirrors the provider protocol so the purchase flow can be developed and tested. */
export class LocalTestAdapter implements PaymentAdapter {
  readonly simulated = true;
  static readonly KEY_ID = 'local_sim_key';
  readonly keySecret = 'local-simulation-secret-not-a-credential';
  readonly webhookSecret = 'local-simulation-webhook-secret';
  private readonly db: Db;
  constructor(db: Db) { this.db = db; }
  publicKeyId(): string { return LocalTestAdapter.KEY_ID; }
  async createOrder(input: { amount_minor: number; currency: string }): Promise<ProviderOrder> {
    const id = `order_SIM${randomBytes(8).toString('hex')}`;
    run(this.db, 'INSERT INTO sim_orders (provider_order_id, amount_minor, currency, status) VALUES (?, ?, ?, ?)', id, input.amount_minor, input.currency, 'created');
    return { provider_order_id: id, amount_minor: input.amount_minor, currency: input.currency };
  }
  verifyCheckoutSignature(i: { provider_order_id: string; provider_payment_id: string; signature: string }): boolean {
    return safeEqualHex(i.signature, hmacHex(this.keySecret, `${i.provider_order_id}|${i.provider_payment_id}`));
  }
  async fetchPayment(id: string): Promise<ProviderPayment | null> {
    return one<ProviderPayment>(this.db, 'SELECT provider_payment_id, provider_order_id, amount_minor, currency, status, amount_refunded_minor FROM sim_payments WHERE provider_payment_id = ?', id) ?? null;
  }
  async fetchPaymentsForOrder(orderId: string): Promise<ProviderPayment[]> {
    return all<ProviderPayment>(this.db, 'SELECT provider_payment_id, provider_order_id, amount_minor, currency, status, amount_refunded_minor FROM sim_payments WHERE provider_order_id = ?', orderId);
  }
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean { return safeEqualHex(signature, hmacHex(this.webhookSecret, rawBody)); }

  // ---- simulation controls (development and tests only) ---------------------------------------------------
  /** Simulates the buyer completing checkout. Returns what the provider's checkout would hand the client. */
  simulatePayment(providerOrderId: string, outcome: 'captured' | 'authorized' | 'failed', overrides: { amount_minor?: number; currency?: string } = {}): { provider_payment_id: string; signature: string } {
    const order = one<{ amount_minor: number; currency: string }>(this.db, 'SELECT amount_minor, currency FROM sim_orders WHERE provider_order_id = ?', providerOrderId);
    if (!order) throw new ProviderError('Unknown simulated order.');
    const id = `pay_SIM${randomBytes(8).toString('hex')}`;
    run(this.db, 'INSERT INTO sim_payments (provider_payment_id, provider_order_id, amount_minor, currency, status) VALUES (?, ?, ?, ?, ?)', id, providerOrderId, overrides.amount_minor ?? order.amount_minor, overrides.currency ?? order.currency, outcome);
    return { provider_payment_id: id, signature: hmacHex(this.keySecret, `${providerOrderId}|${id}`) };
  }
  simulateCapture(providerPaymentId: string): void { run(this.db, "UPDATE sim_payments SET status = 'captured' WHERE provider_payment_id = ? AND status = 'authorized'", providerPaymentId); }
  simulateRefund(providerPaymentId: string): void { run(this.db, "UPDATE sim_payments SET status = 'refunded', amount_refunded_minor = amount_minor WHERE provider_payment_id = ?", providerPaymentId); }
  /** Builds a signed webhook delivery exactly as the handler expects it. */
  webhook(eventType: string, providerPaymentId: string, eventId = `evt_SIM${randomBytes(6).toString('hex')}`): { rawBody: Buffer; headers: Record<string, string> } {
    const payment = one<ProviderPayment>(this.db, 'SELECT provider_payment_id, provider_order_id, amount_minor, currency, status FROM sim_payments WHERE provider_payment_id = ?', providerPaymentId);
    const rawBody = Buffer.from(JSON.stringify({ entity: 'event', event: eventType, payload: { payment: { entity: { id: providerPaymentId, order_id: payment?.provider_order_id ?? null, amount: payment?.amount_minor ?? 0, currency: payment?.currency ?? 'INR', status: payment?.status ?? 'failed' } } } }));
    return { rawBody, headers: { 'x-razorpay-signature': hmacHex(this.webhookSecret, rawBody), 'x-razorpay-event-id': eventId, 'content-type': 'application/json' } };
  }
}
