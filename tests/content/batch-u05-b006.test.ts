// Independent deterministic recomputation for batch BFM-A-U05-B006 (export finance case study).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, mul, sub, mustDec, round, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U05-B006', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const addDays = (s: string, n: number) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) + n * 86400000).toISOString().slice(0, 10);
const pcl = (usd: string, rate: string, ship: string, margin: string) => mul(mul(mul(d(usd), d(rate)), sub(d('1'), d(ship))), sub(d('1'), d(margin)));

test('U05-B006 D001: packing credit against the order', () => {
  const card = itemFor('D001') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const order = mul(d('80000'), d('83.60')), fob = mul(order, d('0.90')), loan = mul(fob, d('0.80'));
  assert.equal(at(order, 2), '6688000.00'); assert.equal(at(fob, 2), '6019200.00'); assert.equal(at(loan, 2), '4815360.00');
  assert.equal(at(pcl('80000', '83.60', '0.10', '0.20'), 2), '4815360.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const v of [order, fob, loan]) assert.ok(shown.includes(formatIndian(v, 2)), `${formatIndian(v, 2)} not in ${shown}`);
});

test('U05-B006 D002: discounting the bill and closing the packing credit', () => {
  const card = itemFor('D002') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const rate = add(d('83.55'), d('0.12')); assert.equal(at(rate, 2), '83.67');
  const value = mul(d('78000'), rate), adv = mul(value, d('0.85')), credited = sub(adv, d('4815360'));
  assert.equal(at(value, 2), '6526260.00'); assert.equal(at(adv, 2), '5547321.00'); assert.equal(at(credited, 2), '731961.00');
  assert.equal(addDays('2026-08-12', 70), '2026-10-21'); assert.equal(addDays('2026-08-12', 45), '2026-09-26'); // distractor: without transit
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['83.67', formatIndian(value, 2), formatIndian(adv, 2), '7,31,961.00', '21 October 2026']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B006 D003 and D004: numerical questions', () => {
  const q3 = itemFor('D003') as QuestionItem; if (q3.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(pcl('60000', '84.00', '0.12', '0.25'), 2), '3326400.00'); assert.equal(q3.numeric_rule.expected_answer, '3326400.00');
  assert.deepEqual(gradeNumeric('3326400', q3.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '3326400.00' });
  const q4 = itemFor('D004') as QuestionItem; if (q4.question_type !== 'numeric_input') throw new Error('numeric');
  const adv = mul(mul(d('40000'), add(d('84.10'), d('0.15'))), d('0.85'));
  assert.equal(at(adv, 2), '2864500.00'); assert.equal(q4.numeric_rule.expected_answer, '2864500.00');
  assert.deepEqual(gradeNumeric('2864500', q4.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '2864500.00' });
  for (const wrong of ['3370000', '2856000', '2889200']) { const g = gradeNumeric(wrong, q4.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U05-B006: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D005: 'C', D006: 'B', D007: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
