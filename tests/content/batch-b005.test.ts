// Independent deterministic recomputation for batch BFM-A-U01-B005.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, div, formatIndian, mul, mustDec, round, sub, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B005', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('B005 D003: importer call option outlay in two cases', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const usd = d('100000'), strike = d('84.00'), premiumPer = d('0.35');
  const premium = mul(usd, premiumPer);
  const exercised = add(mul(usd, strike), premium);               // spot 84.80 > strike: exercise
  const lapsed = add(mul(usd, d('83.60')), premium);               // spot 83.60 < strike: buy in the market
  assert.equal(at(premium, 2), '35000.00'); assert.equal(at(exercised, 2), '8435000.00'); assert.equal(at(lapsed, 2), '8395000.00');
  assert.equal(at(add(strike, premiumPer), 2), '84.35'); assert.equal(at(add(d('83.60'), premiumPer), 2), '83.95');
  // The rational choice in each case: exercise only if spot exceeds the strike.
  assert.ok(Number(d('84.80').n) > Number(strike.n * 10n ** BigInt(d('84.80').s - strike.s)));
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of [formatIndian(premium, 2), formatIndian(mul(usd, strike), 2), formatIndian(exercised, 2), formatIndian(mul(usd, d('83.60')), 2), formatIndian(lapsed, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('84,35,000.00') && card.final_answer_with_unit.includes('83,95,000.00'));
});

test('B005 D005: net payment on an interest rate swap', () => {
  const q = itemFor('D005') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const notional = d('200000000'), four = d('4');
  const fixed = div(mul(notional, d('0.0710')), four, 6), floating = div(mul(notional, d('0.0690')), four, 6);
  assert.equal(at(fixed, 2), '3550000.00'); assert.equal(at(floating, 2), '3450000.00');
  const net = sub(fixed, floating);
  assert.equal(at(net, 2), '100000.00'); assert.equal(q.numeric_rule.expected_answer, '100000.00');
  assert.deepEqual(gradeNumeric('100000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '100000.00' });
  // Wrong methods: annual difference, or swapping the principal.
  for (const wrong of [at(mul(notional, sub(d('0.0710'), d('0.0690'))), 2), at(fixed, 2), at(add(fixed, floating), 2)]) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const shown = (q.worked_solution_steps ?? []).map(s => s.intermediate_result).join(' | ');
  for (const expected of [formatIndian(fixed, 2), formatIndian(floating, 2), formatIndian(net, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
});

test('B005: choice questions well formed; put/call moneyness logic; all drafts', () => {
  for (const id of ['D004', 'D006']) { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice'); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); }
  const putPayoff = Number(d('83.00').n) - Number(d('84.00').n); // exercising a put at 83.00 when spot is 84.00 loses 1 rupee: out of the money
  assert.ok(putPayoff < 0);
  assert.equal((itemFor('D006') as QuestionItem & { correct_option_id: string }).correct_option_id, 'C');
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
