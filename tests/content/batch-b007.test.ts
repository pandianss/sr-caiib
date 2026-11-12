// Independent deterministic recomputation for batch BFM-A-U01-B007 (held back from publication).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, formatIndian, mul, mustDec, round, sub, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B007', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('B007 D003: cancellation cost of a forward purchase', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const rate = add(d('84.0100'), d('0.0900')), usd = d('400000');
  const contracted = mul(usd, d('83.7500')), cancelled = mul(usd, rate), cost = sub(cancelled, contracted);
  assert.equal(at(rate, 4), '84.1000'); assert.equal(at(contracted, 2), '33500000.00'); assert.equal(at(cancelled, 2), '33640000.00'); assert.equal(at(cost, 2), '140000.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of ['84.1000', formatIndian(contracted, 2), formatIndian(cancelled, 2), formatIndian(cost, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
});

test('B007 D005: cancellation of a forward sale contract', () => {
  const q = itemFor('D005') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const cost = mul(d('200000'), sub(d('84.4000'), d('84.1000')));
  assert.equal(at(cost, 2), '60000.00'); assert.equal(q.numeric_rule.expected_answer, '60000.00');
  assert.deepEqual(gradeNumeric('60000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '60000.00' });
  const wrong = gradeNumeric(at(mul(d('200000'), d('84.1000')), 2), q.numeric_rule); assert.equal(wrong.status === 'graded' && wrong.is_correct, false);
});

test('B007: choice questions well formed; batch is draft and held back from every publish spec', () => {
  for (const [id, correct] of [['D004', 'C'], ['D006', 'B']] as const) { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice'); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct); }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
  for (const v of ['v1', 'v2', 'v3', 'v4', 'v5']) assert.ok(!readFileSync(join(ROOT, 'content', 'publish', `BFM-2026DEC-${v}.json`), 'utf8').includes('BFM-A-U01-B007'));
});
