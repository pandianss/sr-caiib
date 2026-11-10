import test from 'node:test';
import assert from 'node:assert/strict';
import { add, dec, div, formatIndian, mul, mustDec, parseDec, powInt, round, toPlain } from '../../src/core/decimal.ts';
import { gradeChoice, gradeNumeric, parseNumericInput } from '../../src/core/grading.ts';
import { allCalculators, runCalculator } from '../../src/core/calculators.ts';
import type { NumericRule, RoundingMode } from '../../src/types/contracts.ts';

const r = (v: string, places: number, mode: RoundingMode) => toPlain(round(mustDec(v), places, mode), places);

test('decimal: exact arithmetic avoids binary floating error', () => {
  assert.equal(toPlain(add(mustDec('0.1'), mustDec('0.2'))), '0.3');
  assert.equal(toPlain(mul(mustDec('1.15'), mustDec('100'))), '115.00');
  assert.equal(toPlain(div(mustDec('1'), mustDec('3'), 6)), '0.333333');
  assert.equal(toPlain(powInt(mustDec('1.02'), 8, 24), undefined).slice(0, 12), '1.1716593810');
  assert.equal(parseDec('1e3'), null); assert.equal(parseDec('1,000'), null); assert.equal(parseDec('NaN'), null);
});

test('decimal: every rounding mode on positive and negative ties', () => {
  const cases: [string, RoundingMode, string][] = [
    ['2.345', 'HALF_UP', '2.35'], ['-2.345', 'HALF_UP', '-2.35'], ['2.345', 'HALF_EVEN', '2.34'], ['2.355', 'HALF_EVEN', '2.36'],
    ['2.349', 'TOWARD_ZERO', '2.34'], ['-2.349', 'TOWARD_ZERO', '-2.34'], ['2.341', 'AWAY_FROM_ZERO', '2.35'], ['-2.341', 'AWAY_FROM_ZERO', '-2.35'],
    ['2.349', 'FLOOR', '2.34'], ['-2.341', 'FLOOR', '-2.35'], ['2.341', 'CEILING', '2.35'], ['-2.349', 'CEILING', '-2.34'], ['2.3', 'HALF_UP', '2.30'],
  ];
  for (const [v, mode, expected] of cases) assert.equal(r(v, 2, mode), expected, `${v} ${mode}`);
});

test('decimal: Indian digit grouping is display only', () => {
  assert.equal(formatIndian(mustDec('1234567.5'), 2), '12,34,567.50');
  assert.equal(formatIndian(mustDec('-999.999'), 2), '-1,000.00');
  assert.equal(formatIndian(dec(0n), 0), '0');
});

const rule: NumericRule = { expected_answer: '270.00', unit_label: 'units', precision_decimals: 2, rounding_mode: 'HALF_UP', rounding_instruction: 'Round to 2 decimals.', allow_negative: false };

test('numeric grading: equal values with harmless formatting are correct', () => {
  for (const input of ['270', '270.0', '270.00', ' 270.00 ', '+270', '270.000', '0270']) {
    const g = gradeNumeric(input, rule);
    assert.deepEqual(g, { status: 'graded', is_correct: true, normalized_response: '270.00' }, input);
  }
});

test('numeric grading: a nearby or over-precise answer is never rounded into correctness', () => {
  assert.deepEqual(gradeNumeric('270.01', rule), { status: 'graded', is_correct: false, normalized_response: '270.01' });
  assert.deepEqual(gradeNumeric('269.99', rule), { status: 'graded', is_correct: false, normalized_response: '269.99' });
  const over = gradeNumeric('270.004', rule);
  assert.equal(over.status, 'invalid'); assert.equal(over.status === 'invalid' && over.issue, 'too_many_decimals');
});

test('numeric grading: invalid input is reported, not graded', () => {
  const issue = (s: string) => { const g = gradeNumeric(s, rule); return g.status === 'invalid' ? g.issue : 'graded'; };
  assert.equal(issue(''), 'empty'); assert.equal(issue('   '), 'empty'); assert.equal(issue('2,70'), 'has_comma'); assert.equal(issue('2.7e2'), 'has_exponent');
  assert.equal(issue('270 units'), 'has_unit_or_symbol'); assert.equal(issue('₹270'), 'has_unit_or_symbol'); assert.equal(issue('270%'), 'has_unit_or_symbol');
  assert.equal(issue('abc'), 'not_a_number'); assert.equal(issue('NaN'), 'not_a_number'); assert.equal(issue('Infinity'), 'not_a_number');
  assert.equal(issue('2 70'), 'not_a_number'); assert.equal(issue('-270'), 'negative_not_allowed'); assert.equal(issue('1.2.3'), 'not_a_number');
});

test('numeric grading: negative zero, leading decimal point and allowed negatives', () => {
  const zero: NumericRule = { ...rule, expected_answer: '0.00' };
  assert.deepEqual(gradeNumeric('-0', zero), { status: 'graded', is_correct: true, normalized_response: '0.00' });
  assert.deepEqual(gradeNumeric('-0.00', zero), { status: 'graded', is_correct: true, normalized_response: '0.00' });
  const half: NumericRule = { ...rule, expected_answer: '0.50' };
  assert.deepEqual(gradeNumeric('.5', half), { status: 'graded', is_correct: true, normalized_response: '0.50' });
  const neg: NumericRule = { ...rule, expected_answer: '-12.50', allow_negative: true };
  assert.deepEqual(gradeNumeric('-12.5', neg), { status: 'graded', is_correct: true, normalized_response: '-12.50' });
  assert.equal(parseNumericInput('12.50', neg).ok, true);
});

test('choice grading: exact option match only', () => {
  assert.deepEqual(gradeChoice('B', 'B'), { status: 'graded', is_correct: true, normalized_response: 'B' });
  assert.deepEqual(gradeChoice('A', 'B'), { status: 'graded', is_correct: false, normalized_response: 'A' });
  assert.equal(gradeChoice('', 'B').status, 'invalid'); assert.equal(gradeChoice('b', 'B').status, 'invalid');
});

test('calculators: deterministic results with independent expected values', () => {
  const ok = (key: string, raw: Record<string, string>) => { const x = runCalculator(key, raw); assert.equal(x.ok, true, JSON.stringify(x)); return x.ok ? x.value : ''; };
  assert.equal(ok('simple_interest', { principal: '1500', rate_pct: '6', years: '3' }), '270.00');
  assert.equal(ok('compound_amount', { principal: '20000', rate_pct: '8', periods_per_year: '4', years: '2' }), '23433.19'); // 20000 x 1.02^8
  assert.equal(ok('present_value', { future_value: '11025', rate_pct: '5', periods: '2' }), '10000.00');
  assert.equal(ok('emi', { principal: '100000', rate_pct: '12', months: '12' }), '8884.88'); // standard amortisation identity
  assert.equal(ok('emi', { principal: '120000', rate_pct: '0', months: '12' }), '10000.00');
  assert.equal(ok('annuity_present_value', { payment: '1000', rate_pct: '10', periods: '3' }), '2486.85');
  assert.equal(ok('annuity_present_value', { payment: '1000', rate_pct: '0', periods: '3' }), '3000.00');
});

test('calculators: invalid input is rejected per field and every calculator states assumptions', () => {
  const bad = runCalculator('emi', { principal: '1,00,000', rate_pct: '-1', months: '0' });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ['months', 'principal', 'rate_pct']);
  assert.equal(runCalculator('emi', { principal: '1000', rate_pct: '10', months: '2.5' }).ok, false);
  assert.equal(runCalculator('nope', {}).ok, false);
  for (const c of allCalculators()) { assert.ok(c.assumptions.length > 0); assert.ok(c.formula.length > 0); }
});
