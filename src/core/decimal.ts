/**
 * Exact decimal arithmetic on scaled BigInt values. Used for grading and calculators so that
 * precision-sensitive financial results never depend on binary floating point.
 * A Dec represents n / 10^s with s >= 0.
 */
import type { RoundingMode } from '../types/contracts.ts';

export interface Dec { readonly n: bigint; readonly s: number }

const PLAIN = /^([+-])?(\d+)(?:\.(\d+))?$/;
const pow10 = (k: number): bigint => 10n ** BigInt(k);

export function dec(n: bigint, s = 0): Dec { return { n, s }; }

/** Parses a plain decimal (optional sign, digits, optional fraction). No commas, exponents or units. */
export function parseDec(text: string): Dec | null {
  const m = PLAIN.exec(text);
  if (!m) return null;
  const frac = m[3] ?? '';
  const n = BigInt(m[2] + frac);
  return { n: m[1] === '-' ? -n : n, s: frac.length };
}

export function mustDec(text: string): Dec {
  const d = parseDec(text);
  if (!d) throw new RangeError(`Not a plain decimal: ${text}`);
  return d;
}

function align(a: Dec, b: Dec): [bigint, bigint, number] {
  const s = Math.max(a.s, b.s);
  return [a.n * pow10(s - a.s), b.n * pow10(s - b.s), s];
}

export function add(a: Dec, b: Dec): Dec { const [x, y, s] = align(a, b); return { n: x + y, s }; }
export function sub(a: Dec, b: Dec): Dec { const [x, y, s] = align(a, b); return { n: x - y, s }; }
export function mul(a: Dec, b: Dec): Dec { return { n: a.n * b.n, s: a.s + b.s }; }
export function cmp(a: Dec, b: Dec): -1 | 0 | 1 { const [x, y] = align(a, b); return x < y ? -1 : x > y ? 1 : 0; }
export function isZero(a: Dec): boolean { return a.n === 0n; }
export function neg(a: Dec): Dec { return { n: -a.n, s: a.s }; }

/** Integer quotient of num/den (den > 0) rounded with the given mode. */
export function roundQuotient(num: bigint, den: bigint, mode: RoundingMode): bigint {
  if (den <= 0n) throw new RangeError('Divisor must be positive');
  const negative = num < 0n;
  const abs = negative ? -num : num;
  const q = abs / den;
  const r = abs % den;
  if (r === 0n) return negative ? -q : q;
  const twice = r * 2n;
  let up: boolean; // whether magnitude increases
  switch (mode) {
    case 'TOWARD_ZERO': up = false; break;
    case 'AWAY_FROM_ZERO': up = true; break;
    case 'FLOOR': up = negative; break;
    case 'CEILING': up = !negative; break;
    case 'HALF_UP': up = twice >= den; break;
    case 'HALF_EVEN': up = twice > den || (twice === den && q % 2n === 1n); break;
    default: throw new RangeError(`Unknown rounding mode: ${String(mode)}`);
  }
  const mag = up ? q + 1n : q;
  return negative ? -mag : mag;
}

/** Rounds to the given number of decimal places. HALF_UP rounds ties away from zero. */
export function round(a: Dec, places: number, mode: RoundingMode): Dec {
  if (!Number.isInteger(places) || places < 0) throw new RangeError('Places must be a nonnegative integer');
  if (a.s <= places) return { n: a.n * pow10(places - a.s), s: places };
  return { n: roundQuotient(a.n, pow10(a.s - places), mode), s: places };
}

/** a / b rounded to `places` decimals. */
export function div(a: Dec, b: Dec, places: number, mode: RoundingMode = 'HALF_EVEN'): Dec {
  if (b.n === 0n) throw new RangeError('Division by zero');
  // (a.n / 10^a.s) / (b.n / 10^b.s) * 10^places = a.n * 10^(b.s + places) / (b.n * 10^a.s)
  let num = a.n * pow10(b.s + places);
  let den = b.n * pow10(a.s);
  if (den < 0n) { num = -num; den = -den; }
  return { n: roundQuotient(num, den, mode), s: places };
}

/** base^exp for a nonnegative integer exponent, keeping `workPlaces` decimals after each multiplication. */
export function powInt(base: Dec, exp: number, workPlaces = 30): Dec {
  if (!Number.isInteger(exp) || exp < 0) throw new RangeError('Exponent must be a nonnegative integer');
  let result: Dec = { n: 1n, s: 0 };
  let b = base;
  let e = exp;
  while (e > 0) {
    if (e & 1) result = round(mul(result, b), Math.min(workPlaces, result.s + b.s), 'HALF_EVEN');
    e = Math.floor(e / 2);
    if (e > 0) b = round(mul(b, b), Math.min(workPlaces, b.s * 2), 'HALF_EVEN');
  }
  return result;
}

/** Canonical plain string. With `places`, pads with zeros (the value must already fit that scale). */
export function toPlain(a: Dec, places?: number): string {
  let v = a;
  if (places !== undefined) {
    if (a.s > places) {
      const cut = pow10(a.s - places);
      if (a.n % cut !== 0n) throw new RangeError('Value has more precision than requested places');
      v = { n: a.n / cut, s: places };
    } else v = { n: a.n * pow10(places - a.s), s: places };
  }
  const negative = v.n < 0n;
  const digits = (negative ? -v.n : v.n).toString().padStart(v.s + 1, '0');
  const whole = digits.slice(0, digits.length - v.s);
  const frac = v.s ? `.${digits.slice(digits.length - v.s)}` : '';
  return `${negative ? '-' : ''}${whole}${frac}`;
}

/** Display helper with Indian digit grouping (e.g. 12,34,567.50). Presentation only; never parsed back. */
export function formatIndian(a: Dec, places: number): string {
  const plain = toPlain(round(a, places, 'HALF_UP'), places);
  const negative = plain.startsWith('-');
  const [whole = '0', frac] = (negative ? plain.slice(1) : plain).split('.');
  let grouped = whole;
  if (whole.length > 3) {
    const last3 = whole.slice(-3);
    const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = `${rest},${last3}`;
  }
  return `${negative ? '-' : ''}${grouped}${frac !== undefined ? `.${frac}` : ''}`;
}
