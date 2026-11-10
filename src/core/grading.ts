/**
 * Deterministic grading. No tolerance is applied: the canonical expected answer is already rounded to the
 * stated precision and a learner response is correct only when it is numerically equal to it.
 *
 * Numeric input policy (GRADING_POLICY_V1):
 * - Surrounding whitespace is trimmed. A leading "+" and a bare leading decimal point (".5") are normalised.
 * - Commas, exponents, currency symbols, unit suffixes, internal spaces, NaN and Infinity are invalid input
 *   (reported for correction, never silently graded).
 * - Trailing zeros are harmless: "4", "4.0" and "4.00" are equal. Extra NONZERO digits beyond the stated
 *   precision are invalid input, so an over-precise response is never rounded into correctness.
 * - "-0" is treated as 0. A negative value is invalid input when the rule forbids negatives.
 */
import type { NumericRule, OptionId, QuestionItem } from '../types/contracts.ts';
import { cmp, mustDec, parseDec, toPlain, type Dec } from './decimal.ts';

export const GRADING_POLICY_VERSION = 'GRADING_POLICY_V1';

export type NumericInputIssue =
  | 'empty' | 'not_a_number' | 'has_comma' | 'has_exponent' | 'has_unit_or_symbol'
  | 'too_many_decimals' | 'negative_not_allowed';

export type NumericParse =
  | { ok: true; value: Dec; normalized: string }
  | { ok: false; issue: NumericInputIssue; message: string };

const MESSAGES: Record<NumericInputIssue, string> = {
  empty: 'Enter a number before submitting.',
  not_a_number: 'Enter digits only, with an optional decimal point.',
  has_comma: 'Remove commas. Enter the number without digit separators.',
  has_exponent: 'Do not use exponent notation. Enter the full number.',
  has_unit_or_symbol: 'Enter the number only, without a unit or symbol. The unit is shown beside the field.',
  too_many_decimals: 'Too many decimal places. Round your answer as instructed.',
  negative_not_allowed: 'This answer cannot be negative.',
};

export function parseNumericInput(raw: string, rule: Pick<NumericRule, 'precision_decimals' | 'allow_negative'>): NumericParse {
  const fail = (issue: NumericInputIssue): NumericParse => ({ ok: false, issue, message: MESSAGES[issue] });
  let text = raw.trim();
  if (text === '') return fail('empty');
  if (text.includes(',')) return fail('has_comma');
  if (/^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/.test(text)) return fail('has_exponent');
  if (/^[+-]?(\d+\.?\d*|\.\d+)\s*[^\d\s.]/.test(text) || /^[^\d+\-.\s]/.test(text) && /\d/.test(text)) return fail('has_unit_or_symbol');
  if (text.startsWith('+')) text = text.slice(1);
  if (/^-?\.\d+$/.test(text)) text = text.replace('.', '0.');
  const value = parseDec(text);
  if (!value) return fail('not_a_number');
  const frac = text.split('.')[1] ?? '';
  if (frac.length > rule.precision_decimals && /[1-9]/.test(frac.slice(rule.precision_decimals))) return fail('too_many_decimals');
  const zero = value.n === 0n;
  if (!zero && value.n < 0n && !rule.allow_negative) return fail('negative_not_allowed');
  const canonical: Dec = zero ? { n: 0n, s: 0 } : value;
  return { ok: true, value: canonical, normalized: toPlain(trimScale(canonical, rule.precision_decimals), rule.precision_decimals) };
}

function trimScale(d: Dec, places: number): Dec {
  if (d.s <= places) return d;
  return { n: d.n / 10n ** BigInt(d.s - places), s: places }; // only zeros are dropped; checked by the caller
}

export type GradeResult =
  | { status: 'invalid'; issue: NumericInputIssue; message: string }
  | { status: 'graded'; is_correct: boolean; normalized_response: string };

export function gradeNumeric(raw: string, rule: NumericRule): GradeResult {
  const parsed = parseNumericInput(raw, rule);
  if (!parsed.ok) return { status: 'invalid', issue: parsed.issue, message: parsed.message };
  const expected = mustDec(rule.expected_answer);
  return { status: 'graded', is_correct: cmp(parsed.value, expected) === 0, normalized_response: parsed.normalized };
}

const OPTION_IDS: readonly string[] = ['A', 'B', 'C', 'D'];

export function gradeChoice(response: string, correct: OptionId): GradeResult {
  if (!OPTION_IDS.includes(response)) return { status: 'invalid', issue: 'empty', message: 'Select one option before submitting.' };
  return { status: 'graded', is_correct: response === correct, normalized_response: response };
}

export function gradeQuestion(question: QuestionItem, response: string): GradeResult {
  return question.question_type === 'single_choice'
    ? gradeChoice(response, question.correct_option_id)
    : gradeNumeric(response, question.numeric_rule);
}
