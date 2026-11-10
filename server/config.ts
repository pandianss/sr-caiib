/** Server configuration from environment variables. Secrets are never logged or sent to the client. */
import { join } from 'node:path';

export type PaymentMode = 'disabled' | 'local_test' | 'razorpay';
export type PaymentEnvironment = 'local_simulation' | 'razorpay_test' | 'razorpay_live';

export interface ServerConfig {
  mode: 'development' | 'production';
  port: number;
  dataDir: string;
  /** Directory holding the built content (manifest, packs, catalogue). */
  contentDir: string;
  /** Directory of the built web app to serve, or null to serve the API only. */
  staticDir: string | null;
  appOrigins: string[];
  businessTimeZone: string;
  offlineLeaseDays: number;
  accessTermMonths: number;
  payment: {
    mode: PaymentMode;
    razorpayKeyId: string | null; razorpayKeySecret: string | null; razorpayWebhookSecret: string | null;
    razorpayApiBase: string;
    /** Live purchasing requires an explicit owner decision in addition to live keys. */
    livePurchasesEnabled: boolean;
  };
  mail: { mode: 'log' | 'http'; httpUrl: string | null; httpToken: string | null; from: string };
  entitlementKeyFile: string;
  adminToken: string | null;
}

export class ConfigError extends Error {}

export function paymentEnvironment(c: ServerConfig): PaymentEnvironment | null {
  if (c.payment.mode === 'local_test') return 'local_simulation';
  if (c.payment.mode === 'razorpay') return c.payment.razorpayKeyId?.startsWith('rzp_live_') ? 'razorpay_live' : 'razorpay_test';
  return null;
}

export function loadConfig(env: Record<string, string | undefined> = process.env, cwd = process.cwd()): ServerConfig {
  const mode = env.APP_MODE === 'production' ? 'production' : 'development';
  const dataDir = env.DATA_DIR ?? join(cwd, 'server', 'data');
  const paymentMode = (env.PAYMENT_PROVIDER ?? (mode === 'development' ? 'local_test' : 'disabled')) as PaymentMode;
  if (!['disabled', 'local_test', 'razorpay'].includes(paymentMode)) throw new ConfigError(`Unknown PAYMENT_PROVIDER: ${paymentMode}`);
  const config: ServerConfig = {
    mode, port: Number(env.PORT ?? 8787), dataDir,
    contentDir: env.CONTENT_DIR ?? join(cwd, mode === 'production' ? 'dist' : 'public', 'content'),
    staticDir: env.STATIC_DIR ?? (mode === 'production' ? join(cwd, 'dist') : null),
    appOrigins: (env.APP_ORIGIN ?? 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean),
    businessTimeZone: env.BUSINESS_TIME_ZONE ?? 'Asia/Kolkata',
    offlineLeaseDays: Number(env.OFFLINE_LEASE_DAYS ?? 30),
    accessTermMonths: Number(env.ACCESS_TERM_MONTHS ?? 6),
    payment: {
      mode: paymentMode,
      razorpayKeyId: env.RAZORPAY_KEY_ID ?? null, razorpayKeySecret: env.RAZORPAY_KEY_SECRET ?? null, razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET ?? null,
      razorpayApiBase: env.RAZORPAY_API_BASE ?? 'https://api.razorpay.com',
      livePurchasesEnabled: env.LIVE_PURCHASES_ENABLED === 'true',
    },
    mail: { mode: env.MAIL_MODE === 'http' ? 'http' : 'log', httpUrl: env.MAIL_HTTP_URL ?? null, httpToken: env.MAIL_HTTP_TOKEN ?? null, from: env.MAIL_FROM ?? 'no-reply@localhost' },
    entitlementKeyFile: env.ENTITLEMENT_PRIVATE_KEY_FILE ?? join(dataDir, 'entitlement-key.pem'),
    adminToken: env.ADMIN_TOKEN ?? null,
  };
  validateConfig(config, Boolean(env.ENTITLEMENT_PRIVATE_KEY_FILE));
  return config;
}

export function validateConfig(c: ServerConfig, explicitKeyFile: boolean): void {
  if (!Number.isInteger(c.port) || c.port < 0) throw new ConfigError('PORT must be a port number.');
  if (!(c.offlineLeaseDays >= 1 && c.offlineLeaseDays <= 60)) throw new ConfigError('OFFLINE_LEASE_DAYS must be between 1 and 60.');
  if (c.mode === 'production') {
    if (c.payment.mode === 'local_test') throw new ConfigError('The local payment simulation cannot run in production mode.');
    if (c.mail.mode === 'log') throw new ConfigError('Production needs MAIL_MODE=http: sign-in codes must be delivered, not logged.');
    if (!explicitKeyFile) throw new ConfigError('Production needs ENTITLEMENT_PRIVATE_KEY_FILE pointing at a managed signing key.');
  }
  if (c.mail.mode === 'http' && !c.mail.httpUrl) throw new ConfigError('MAIL_MODE=http needs MAIL_HTTP_URL.');
  if (c.payment.mode === 'razorpay') {
    const { razorpayKeyId: id, razorpayKeySecret: secret, razorpayWebhookSecret: hook } = c.payment;
    if (!id || !secret || !hook) throw new ConfigError('PAYMENT_PROVIDER=razorpay needs RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET.');
    if (!/^rzp_(test|live)_/.test(id)) throw new ConfigError('RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_.');
    if (id.startsWith('rzp_live_') && !c.payment.livePurchasesEnabled) throw new ConfigError('Live Razorpay keys are configured but LIVE_PURCHASES_ENABLED is not "true". Live purchasing stays off until the owner enables it.');
    if (id.startsWith('rzp_test_') && c.payment.livePurchasesEnabled) throw new ConfigError('LIVE_PURCHASES_ENABLED is "true" but the Razorpay key is a test key.');
  }
}
