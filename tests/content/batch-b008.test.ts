// Independent deterministic recomputation for batch BFM-A-U01-B008.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { div, formatIndian, mul, mustDec, round, sub, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B008', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('B008 D003: converting an indirect quote and comparing costs', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const exact = div(d('100'), d('1.2030'), 10);
  assert.equal(toPlain(round(exact, 5, 'HALF_UP'), 5), '83.12552'); // not a tie: next digit is 1
  const converted = round(exact, 4, 'HALF_UP'); assert.equal(toPlain(converted, 4), '83.1255');
  assert.equal(toPlain(round(exact, 4, 'HALF_EVEN'), 4), '83.1255');
  const a = mul(d('50000'), d('83.2000')), bCost = mul(d('50000'), converted), saving = sub(a, bCost);
  assert.equal(at(a, 2), '4160000.00'); assert.equal(at(bCost, 2), '4156275.00'); assert.equal(at(saving, 2), '3725.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of ['83.1255', formatIndian(a, 2), formatIndian(bCost, 2), formatIndian(saving, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
});

test('B008 D005 and D002: reciprocal conversion', () => {
  const q = itemFor('D005') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const x = div(d('100'), d('1.2000'), 10);
  assert.equal(toPlain(round(x, 5, 'HALF_UP'), 5), '83.33333'); assert.equal(at(x, 4), '83.3333'); assert.equal(q.numeric_rule.expected_answer, '83.3333');
  assert.deepEqual(gradeNumeric('83.3333', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '83.3333' });
  for (const wrong of [at(mul(d('100'), d('1.2000')), 4), at(d('1.2000'), 4), '83.3300']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  assert.equal(at(div(d('100'), d('1.2500'), 8), 2), '80.00'); // self-check on the formula card
  const card = itemFor('D002') as StudyCard; assert.ok(card.self_check.mode === 'self_assessed' && card.self_check.expected_takeaway.startsWith('₹80.00'));
});

test('B008: choice questions well formed; all drafts', () => {
  for (const [id, correct] of [['D004', 'C'], ['D006', 'C']] as const) { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice'); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct); }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
