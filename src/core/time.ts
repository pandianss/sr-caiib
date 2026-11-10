/** Calendar helpers. All persisted instants are UTC ISO strings; calendar days are resolved in a named time zone. */

export type IsoInstant = string; // e.g. 2026-11-10T08:30:00.000Z
export type IsoDate = string;    // e.g. 2026-11-10

export function toIso(ms: number): IsoInstant { return new Date(ms).toISOString(); }

/** The calendar date (YYYY-MM-DD) of an instant in the given IANA time zone. */
export function localDate(instant: IsoInstant | number, timeZone: string): IsoDate {
  const d = typeof instant === 'number' ? new Date(instant) : new Date(instant);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Offset (ms) of a time zone at a given instant: local wall time minus UTC. */
export function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(instantMs));
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? '0');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

/**
 * Adds calendar months in a business time zone, clamping to the last valid day of the destination month
 * (31 Aug + 6 months = 28/29 Feb). The local wall-clock time is preserved; the result is a UTC instant.
 */
export function addCalendarMonths(instant: IsoInstant, months: number, timeZone: string): IsoInstant {
  const startMs = Date.parse(instant);
  const localMs = startMs + zoneOffsetMs(startMs, timeZone);
  const l = new Date(localMs);
  const y = l.getUTCFullYear(), m = l.getUTCMonth(), d = l.getUTCDate();
  const targetIndex = m + months;
  const ty = y + Math.floor(targetIndex / 12);
  const tm = ((targetIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const localTarget = Date.UTC(ty, tm, Math.min(d, lastDay), l.getUTCHours(), l.getUTCMinutes(), l.getUTCSeconds(), l.getUTCMilliseconds());
  // Resolve the offset at the destination (two passes handle a DST boundary; Asia/Kolkata has none).
  let utc = localTarget - zoneOffsetMs(localTarget, timeZone);
  utc = localTarget - zoneOffsetMs(utc, timeZone);
  return new Date(utc).toISOString();
}

export function formatDateTime(instant: IsoInstant, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', ...(timeZone ? { timeZone } : {}) }).format(new Date(instant));
}

export function formatDate(instantOrDate: string, timeZone?: string): string {
  const d = instantOrDate.length === 10 ? new Date(`${instantOrDate}T00:00:00Z`) : new Date(instantOrDate);
  const tz = instantOrDate.length === 10 ? 'UTC' : timeZone;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', ...(tz ? { timeZone: tz } : {}) }).format(d);
}
