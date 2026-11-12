// Independent deterministic recomputation for batch BFM-A-U01-B003.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, mul, mustDec, round, sub, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('B003 D003: customer forward rate, cost and break-even', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const forwardInterbank = add(d('83.4175'), d('0.4200')); const customer = add(forwardInterbank, d('0.0500'));
  const cost = mul(d('50000'), customer);
  assert.equal(at(forwardInterbank, 4), '83.8375'); assert.equal(at(customer, 4), '83.8875'); assert.equal(at(cost, 2), '4194375.00');
  assert.equal(at(sub(customer, d('0.0500')), 4), '83.8375'); // break-even interbank selling rate
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of ['83.4175', '83.8375', '83.8875', formatIndian(cost, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('83.8875') && card.final_answer_with_unit.includes('41,94,375.00') && card.final_answer_with_unit.includes('83.8375'));
});

test('B003 D004: dollars received for pounds sold', () => {
  const q = itemFor('D004') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  assert.equal(at(mul(d('10000'), d('1.2710')), 2), q.numeric_rule.expected_answer);
  assert.deepEqual(gradeNumeric('12710', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '12710.00' });
  const wrong = gradeNumeric(at(mul(d('10000'), d('1.2720')), 2), q.numeric_rule); assert.equal(wrong.status === 'graded' && wrong.is_correct, false);
});

test('B003: choice questions have four distinct options; value-date table has four rows; all drafts', () => {
  for (const id of ['D005', 'D006']) { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice'); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); }
  const card = itemFor('D001') as StudyCard;
  assert.equal(card.core_explanation_md.split('\n').filter(l => /^\| (Cash|Tom|Spot|Forward)/.test(l)).length, 4);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
