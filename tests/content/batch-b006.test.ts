// Independent deterministic recomputation for batch BFM-A-U01-B006.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, formatIndian, mul, mustDec, round, sub, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B006', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const western = (x: ReturnType<typeof mustDec>) => at(x, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

test('B006 D003: net position and revaluation of a long dollar position', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const bought = add(d('3000000'), d('500000')), sold = add(d('1200000'), d('1900000')), net = sub(bought, sold);
  assert.equal(western(bought), '3,500,000'); assert.equal(western(sold), '3,100,000'); assert.equal(western(net), '400,000');
  assert.ok(net.n > 0n); // overbought: long dollars, so a fall in the dollar is a loss
  const loss = mul(net, d('0.60'));
  assert.equal(at(loss, 2), '240000.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of ['3,500,000', '3,100,000', '400,000 overbought', formatIndian(loss, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('2,40,000.00'));
});

test('B006 D005: oversold position and a rising dollar', () => {
  const q = itemFor('D005') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const bought = add(d('1600000'), d('400000')), sold = add(d('2350000'), d('250000')), net = sub(bought, sold);
  assert.equal(western(bought), '2,000,000'); assert.equal(western(sold), '2,600,000'); assert.ok(net.n < 0n); // oversold, short dollars
  const loss = mul(sub(sold, bought), d('0.45'));
  assert.equal(at(loss, 2), '270000.00'); assert.equal(q.numeric_rule.expected_answer, '270000.00');
  assert.deepEqual(gradeNumeric('270000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '270000.00' });
  // Wrong readings: using only customer deals, or treating the position as long.
  const customerOnly = mul(sub(d('2350000'), d('1600000')), d('0.45'));
  for (const wrong of [at(customerOnly, 2), at(mul(add(sold, bought), d('0.45')), 2)]) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const shown = (q.worked_solution_steps ?? []).map(s => s.intermediate_result).join(' | ');
  for (const expected of ['2,000,000', '2,600,000', '600,000 oversold', formatIndian(loss, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
});

test('B006: choice questions well formed and all drafts', () => {
  const answers: Record<string, string> = { D004: 'C', D006: 'C' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
