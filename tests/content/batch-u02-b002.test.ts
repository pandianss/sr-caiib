// Independent deterministic recomputation for batch BFM-A-U02-B002 (TCS on LRS remittances).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, mul, sub, mustDec, round, toPlain, cmp } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U02-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const threshold = d('1000000');
/** Tax on the part of the running total above the threshold, for each successive remittance. */
function tcs(remittances: string[], rate: string): string[] {
  let total = d('0'); const out: string[] = [];
  for (const r of remittances) {
    const before = total; total = add(total, d(r));
    const taxableBefore = cmp(before, threshold) > 0 ? sub(before, threshold) : d('0');
    const taxableAfter = cmp(total, threshold) > 0 ? sub(total, threshold) : d('0');
    out.push(at(mul(sub(taxableAfter, taxableBefore), d(rate)), 2));
  }
  return out;
}

test('U02-B002 D003: TCS across three remittances at 20%', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.deepEqual(tcs(['400000', '850000', '100000'], '0.20'), ['0.00', '50000.00', '20000.00']);
  assert.deepEqual(tcs(['400000', '850000', '100000'], '0.02'), ['0.00', '5000.00', '2000.00']); // self-check at 2%
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['₹0.00', '₹12,50,000', '₹50,000.00', '₹20,000.00', '₹70,000.00']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('50,000.00') && card.final_answer_with_unit.includes('70,000.00'));
});

test('U02-B002 D008: education TCS at 2%', () => {
  const q = itemFor('D008') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const t = tcs(['2150000'], '0.02')[0];
  assert.equal(t, '23000.00'); assert.equal(q.numeric_rule.expected_answer, '23000.00');
  assert.deepEqual(gradeNumeric('23000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '23000.00' });
  // Wrong readings: tax on the whole amount, or at 20%, or at the old 5% above 7 lakh.
  for (const wrong of [at(mul(d('2150000'), d('0.02')), 2), at(mul(sub(d('2150000'), d('1000000')), d('0.2')), 2), at(mul(sub(d('2150000'), d('700000')), d('0.05')), 2)]) {
    const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong);
  }
});

test('U02-B002 D009: two investment remittances at 20%', () => {
  const q = itemFor('D009') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const parts = tcs(['1100000', '600000'], '0.20');
  assert.deepEqual(parts, ['20000.00', '120000.00']);
  assert.equal(at(add(d(parts[0]!), d(parts[1]!)), 2), '140000.00'); assert.equal(q.numeric_rule.expected_answer, '140000.00');
  assert.deepEqual(gradeNumeric('140000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '140000.00' });
  for (const wrong of [at(mul(d('1700000'), d('0.2')), 2), at(mul(d('600000'), d('0.2')), 2), at(mul(sub(d('1700000'), d('700000')), d('0.2')), 2)]) {
    const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong);
  }
});

test('U02-B002: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D005: 'C', D006: 'B', D007: 'D', D010: 'C', D011: 'A' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  assert.ok((itemFor('D005') as QuestionItem & { options: { option_id: string; text_md: string }[] }).options.find(o => o.option_id === 'C')!.text_md === '2%');
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
