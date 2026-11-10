/**
 * Offline entitlement verification. Tokens are compact JWS (ES256, ECDSA P-256 + SHA-256) signed by the
 * backend; the client holds only public keys. Shape validation alone never grants access: the signature,
 * account binding, time bounds and clock-rollback checks below must all pass (fail closed).
 */
import type { OfflineEntitlementClaims, PaperId, SignedOfflineEntitlement } from '../types/contracts.ts';
import { validateEntitlementClaims } from '../validation/contracts.ts';
import type { EntitlementRecord } from './model.ts';

export type PublicJwk = { kty: 'EC'; crv: 'P-256'; x: string; y: string; kid: string };
/** Device clock may run this far behind the last trusted time before the token is distrusted. */
export const CLOCK_SKEW_TOLERANCE_MS = 5 * 60_000;

export type EntitlementStatus =
  | { state: 'valid'; claims: OfflineEntitlementClaims; refreshDue: boolean }
  | { state: 'none' }
  | { state: 'invalid'; reason: 'malformed' | 'unknown_key' | 'bad_signature' | 'bad_claims' | 'wrong_account' }
  | { state: 'expired'; claims: OfflineEntitlementClaims }
  | { state: 'refresh_required'; claims: OfflineEntitlementClaims; reason: 'offline_lease_ended' | 'clock_rollback' };

const b64urlToBytes = (s: string): Uint8Array => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(pad);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};

export async function verifySignedToken(signed: SignedOfflineEntitlement, keys: readonly PublicJwk[]): Promise<{ ok: true; claims: OfflineEntitlementClaims } | { ok: false; reason: 'malformed' | 'unknown_key' | 'bad_signature' | 'bad_claims' }> {
  const parts = signed.signed_token.split('.');
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) return { ok: false, reason: 'malformed' };
  const [h, p, s] = parts as [string, string, string];
  let header: { alg?: string; kid?: string }, payload: unknown;
  try { header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h))); payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p))); }
  catch { return { ok: false, reason: 'malformed' }; }
  if (header.alg !== 'ES256' || header.kid !== signed.key_id) return { ok: false, reason: 'malformed' };
  const jwk = keys.find(k => k.kid === signed.key_id);
  if (!jwk) return { ok: false, reason: 'unknown_key' };
  let valid = false;
  try {
    const key = await globalThis.crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    valid = await globalThis.crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64urlToBytes(s) as unknown as BufferSource, new TextEncoder().encode(`${h}.${p}`) as unknown as BufferSource);
  } catch { valid = false; }
  if (!valid) return { ok: false, reason: 'bad_signature' };
  const claims = validateEntitlementClaims(payload);
  if (!claims.ok) return { ok: false, reason: 'bad_claims' };
  return { ok: true, claims: claims.data };
}

/**
 * Evaluates a stored entitlement. `deviceNowMs` is the device clock. If it reads earlier than the last
 * trusted server time (beyond tolerance) or earlier than a previously observed device time, the clock is
 * treated as rolled back and an online refresh is required.
 */
export async function evaluateEntitlement(record: EntitlementRecord | undefined, keys: readonly PublicJwk[], learnerId: string, deviceNowMs: number): Promise<EntitlementStatus> {
  if (!record) return { state: 'none' };
  const verified = await verifySignedToken(record.signed, keys);
  if (!verified.ok) return { state: 'invalid', reason: verified.reason };
  const claims = verified.claims;
  if (claims.learner_id !== learnerId) return { state: 'invalid', reason: 'wrong_account' };
  const trusted = Date.parse(record.last_trusted_server_time), seen = Date.parse(record.last_seen_device_time);
  if (deviceNowMs + CLOCK_SKEW_TOLERANCE_MS < trusted || deviceNowMs + CLOCK_SKEW_TOLERANCE_MS < seen) return { state: 'refresh_required', claims, reason: 'clock_rollback' };
  if (deviceNowMs >= Date.parse(claims.access_expires_at)) return { state: 'expired', claims };
  if (deviceNowMs >= Date.parse(claims.offline_until)) return { state: 'refresh_required', claims, reason: 'offline_lease_ended' };
  const lease = Date.parse(claims.offline_until) - Date.parse(claims.issued_at);
  return { state: 'valid', claims, refreshDue: deviceNowMs > Date.parse(claims.issued_at) + lease / 2 };
}

export const entitles = (status: EntitlementStatus, paper: PaperId): boolean => status.state === 'valid' && status.claims.allowed_papers.includes(paper);

/**
 * Bounded finish policy: a paid timed session that started while access was valid may run to its own
 * persisted deadline even if a refresh becomes due meanwhile. New paid sessions require valid access.
 */
export function mayContinueStartedSession(startedAt: string, deadline: string | null, status: EntitlementStatus, nowMs: number): boolean {
  if (status.state === 'valid') return true;
  if (!deadline || nowMs >= Date.parse(deadline)) return false;
  if (status.state === 'refresh_required' || status.state === 'expired') return Date.parse(startedAt) < Date.parse(status.claims.offline_until) && Date.parse(startedAt) < Date.parse(status.claims.access_expires_at);
  return false;
}
