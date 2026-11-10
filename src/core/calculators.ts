/**
 * Registered deterministic calculators. A CalculatorItem in a content pack refers to one of these by
 * `calculator_key`; there is no eval() and no runtime model. All arithmetic is exact decimal with stated
 * rounding. These are general time-value-of-money tools: they embed no regulatory rate or threshold.
 */
import { add, dec, div, mul, mustDec, parseDec, powInt, round, sub, toPlain, type Dec } from './decimal.ts';

export interface CalcInput { key: string; label: string; unit: string; integer?: boolean; min?: string; help?: string }
export interface CalcStep { description: string; expression: string; result: string }
export type CalcResult =
  | { ok: true; value: string; unit: string; steps: CalcStep[] }
  | { ok: false; errors: Record<string, string> };
export interface CalculatorDef {
  key: string; title: string; summary: string; inputs: CalcInput[]; output_unit: string; output_decimals: number;
  rounding: 'HALF_UP'; formula: string; assumptions: string[];
  compute(values: Record<string, Dec>): { value: Dec; steps: CalcStep[] };
}

const ONE = dec(1n), HUNDRED = dec(100n);
const W = 24; // working decimal places for intermediate division
const show = (d: Dec, places = 6): string => toPlain(round(d, places, 'HALF_UP'), places).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
const rate = (pct: Dec): Dec => div(pct, HUNDRED, W);

const DEFS: CalculatorDef[] = [
  {
    key: 'simple_interest', title: 'Simple interest', summary: 'Interest on a principal at a flat annual rate for a period in years.',
    inputs: [{ key: 'principal', label: 'Principal', unit: '₹', min: '0' }, { key: 'rate_pct', label: 'Annual rate', unit: '% p.a.', min: '0' }, { key: 'years', label: 'Period', unit: 'years', min: '0' }],
    output_unit: '₹', output_decimals: 2, rounding: 'HALF_UP', formula: 'I = P × r × t',
    assumptions: ['Rate is a nominal annual percentage.', 'Period is expressed in years (use a fraction for part-years).', 'No compounding.'],
    compute(v) {
      const r = rate(v.rate_pct!); const value = mul(mul(v.principal!, r), v.years!);
      return { value, steps: [{ description: 'Convert the rate to a decimal', expression: `${show(v.rate_pct!)} ÷ 100`, result: show(r) }, { description: 'Multiply principal, rate and time', expression: `${show(v.principal!)} × ${show(r)} × ${show(v.years!)}`, result: show(value, 2) }] };
    },
  },
  {
    key: 'compound_amount', title: 'Compound amount (future value)', summary: 'Maturity amount of a single sum compounded a whole number of times.',
    inputs: [{ key: 'principal', label: 'Principal', unit: '₹', min: '0' }, { key: 'rate_pct', label: 'Annual rate', unit: '% p.a.', min: '0' }, { key: 'periods_per_year', label: 'Compounding periods per year', unit: 'per year', integer: true, min: '1' }, { key: 'years', label: 'Period', unit: 'whole years', integer: true, min: '0' }],
    output_unit: '₹', output_decimals: 2, rounding: 'HALF_UP', formula: 'A = P × (1 + r/m)^(m × t)',
    assumptions: ['Rate is a nominal annual percentage compounded m times a year.', 'The period is a whole number of years.', 'No deposits or withdrawals during the period.'],
    compute(v) {
      const i = div(rate(v.rate_pct!), v.periods_per_year!, W); const n = Number(v.periods_per_year!.n * v.years!.n);
      const factor = powInt(add(ONE, i), n, W); const value = mul(v.principal!, factor);
      return { value, steps: [{ description: 'Periodic rate', expression: `${show(v.rate_pct!)}% ÷ ${show(v.periods_per_year!)}`, result: show(i, 8) }, { description: 'Number of periods', expression: `${show(v.periods_per_year!)} × ${show(v.years!)}`, result: String(n) }, { description: 'Growth factor', expression: `(1 + ${show(i, 8)})^${n}`, result: show(factor, 8) }, { description: 'Amount', expression: `${show(v.principal!)} × ${show(factor, 8)}`, result: show(value, 2) }] };
    },
  },
  {
    key: 'present_value', title: 'Present value of a single sum', summary: 'Today\'s value of one future amount discounted a whole number of periods.',
    inputs: [{ key: 'future_value', label: 'Future amount', unit: '₹', min: '0' }, { key: 'rate_pct', label: 'Discount rate per period', unit: '% per period', min: '0' }, { key: 'periods', label: 'Number of periods', unit: 'periods', integer: true, min: '0' }],
    output_unit: '₹', output_decimals: 2, rounding: 'HALF_UP', formula: 'PV = FV ÷ (1 + i)^n',
    assumptions: ['The discount rate is per period and constant.', 'A single cash flow at the end of period n.'],
    compute(v) {
      const i = rate(v.rate_pct!); const n = Number(v.periods!.n); const factor = powInt(add(ONE, i), n, W); const value = div(v.future_value!, factor, W);
      return { value, steps: [{ description: 'Discount factor denominator', expression: `(1 + ${show(i, 8)})^${n}`, result: show(factor, 8) }, { description: 'Present value', expression: `${show(v.future_value!)} ÷ ${show(factor, 8)}`, result: show(value, 2) }] };
    },
  },
  {
    key: 'emi', title: 'Equated instalment (EMI)', summary: 'Level instalment that repays a loan over a whole number of periods.',
    inputs: [{ key: 'principal', label: 'Loan amount', unit: '₹', min: '0' }, { key: 'rate_pct', label: 'Annual rate', unit: '% p.a.', min: '0' }, { key: 'months', label: 'Number of monthly instalments', unit: 'months', integer: true, min: '1' }],
    output_unit: '₹ per month', output_decimals: 2, rounding: 'HALF_UP', formula: 'EMI = P × i × (1 + i)^n ÷ ((1 + i)^n − 1), with i = r ÷ 12',
    assumptions: ['Monthly rests: the monthly rate is the annual rate divided by 12.', 'Instalments are paid at the end of each month.', 'At a zero rate the instalment is principal divided by the number of months.'],
    compute(v) {
      const n = Number(v.months!.n); const i = div(rate(v.rate_pct!), dec(12n), W);
      if (i.n === 0n) { const value = div(v.principal!, v.months!, W); return { value, steps: [{ description: 'Zero rate: divide the principal equally', expression: `${show(v.principal!)} ÷ ${n}`, result: show(value, 2) }] }; }
      const factor = powInt(add(ONE, i), n, W); const value = div(mul(mul(v.principal!, i), factor), sub(factor, ONE), W);
      return { value, steps: [{ description: 'Monthly rate', expression: `${show(v.rate_pct!)}% ÷ 12`, result: show(i, 8) }, { description: 'Growth factor', expression: `(1 + ${show(i, 8)})^${n}`, result: show(factor, 8) }, { description: 'Instalment', expression: `${show(v.principal!)} × ${show(i, 8)} × ${show(factor, 8)} ÷ (${show(factor, 8)} − 1)`, result: show(value, 2) }] };
    },
  },
  {
    key: 'annuity_present_value', title: 'Present value of a level annuity', summary: 'Today\'s value of equal end-of-period payments.',
    inputs: [{ key: 'payment', label: 'Payment per period', unit: '₹', min: '0' }, { key: 'rate_pct', label: 'Discount rate per period', unit: '% per period', min: '0' }, { key: 'periods', label: 'Number of payments', unit: 'periods', integer: true, min: '1' }],
    output_unit: '₹', output_decimals: 2, rounding: 'HALF_UP', formula: 'PV = PMT × (1 − (1 + i)^(−n)) ÷ i',
    assumptions: ['Equal payments at the end of each period (ordinary annuity).', 'Constant rate per period.', 'At a zero rate the value is payment multiplied by the number of payments.'],
    compute(v) {
      const n = Number(v.periods!.n); const i = rate(v.rate_pct!);
      if (i.n === 0n) { const value = mul(v.payment!, v.periods!); return { value, steps: [{ description: 'Zero rate: sum of payments', expression: `${show(v.payment!)} × ${n}`, result: show(value, 2) }] }; }
      const factor = powInt(add(ONE, i), n, W); const annuity = div(sub(ONE, div(ONE, factor, W)), i, W); const value = mul(v.payment!, annuity);
      return { value, steps: [{ description: 'Growth factor', expression: `(1 + ${show(i, 8)})^${n}`, result: show(factor, 8) }, { description: 'Annuity factor', expression: `(1 − 1 ÷ ${show(factor, 8)}) ÷ ${show(i, 8)}`, result: show(annuity, 8) }, { description: 'Present value', expression: `${show(v.payment!)} × ${show(annuity, 8)}`, result: show(value, 2) }] };
    },
  },
];

const REGISTRY = new Map(DEFS.map(d => [d.key, d]));
export const calculatorKeys = (): string[] => [...REGISTRY.keys()];
export const calculator = (key: string): CalculatorDef | undefined => REGISTRY.get(key);
export const allCalculators = (): CalculatorDef[] => DEFS;

/** Validates raw text inputs and computes the rounded result. Invalid input is reported per field. */
export function runCalculator(key: string, raw: Record<string, string>): CalcResult {
  const def = REGISTRY.get(key);
  if (!def) return { ok: false, errors: { _: 'Unknown calculator.' } };
  const errors: Record<string, string> = {}; const values: Record<string, Dec> = {};
  for (const input of def.inputs) {
    const text = (raw[input.key] ?? '').trim();
    const d = text === '' ? null : parseDec(text.startsWith('+') ? text.slice(1) : text);
    if (!d) { errors[input.key] = text === '' ? 'Enter a value.' : 'Enter a plain number without commas or symbols.'; continue; }
    if (input.integer && d.s > 0 && d.n % 10n ** BigInt(d.s) !== 0n) { errors[input.key] = 'Enter a whole number.'; continue; }
    if (input.min !== undefined && d.n * 10n ** 0n < 0n && mustDec(input.min).n >= 0n) { errors[input.key] = 'This value cannot be negative.'; continue; }
    if (input.min !== undefined && sub(d, mustDec(input.min)).n < 0n) { errors[input.key] = `Enter at least ${input.min}.`; continue; }
    if (input.integer && d.n > 10_000n * 10n ** BigInt(d.s)) { errors[input.key] = 'This value is too large for the calculator.'; continue; }
    values[input.key] = input.integer ? round(d, 0, 'HALF_UP') : d;
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const { value, steps } = def.compute(values);
  return { ok: true, value: toPlain(round(value, def.output_decimals, def.rounding), def.output_decimals), unit: def.output_unit, steps };
}
