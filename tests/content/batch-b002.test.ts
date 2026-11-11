// Independent deterministic recomputation for batch BFM-A-U01-B002 (forward margin, cross rates).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, mustDec, round, sub, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const id = b.draft_item_map.find(m => m.draft_id === draftId)?.item_id;
  const item = b.items.find(i => i.id === id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const notTie = (x: ReturnType<typeof mustDec>, places: number) => assert.equal(toPlain(round(x, places, 'TOWARD_ZERO'), places) === toPlain(round(x, places, 'AWAY_FROM_ZERO'), places) || toPlain(round(x, places, 'HALF_UP'), places) === toPlain(round(x, places, 'HALF_EVEN'), places), true);
const eurBid = d('1.0836'), eurOffer = d('1.0841'), usdBid = d('83.4125'), usdOffer = d('83.4175');

test('B002 D002: self-check figure on the formula card', () => {
  const card = itemFor('D002') as StudyCard;
  assert.equal(card.card_type, 'formula');
  assert.equal(at(sub(d('83.40'), d('0.30')), 2), '83.10');
  assert.ok(card.self_check.mode === 'self_assessed' && card.self_check.expected_takeaway.startsWith('83.10'));
});

test('B002 D003: cross rate by the chain rule and rupee proceeds', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const exact = mul(eurBid, usdBid);
  assert.equal(toPlain(exact), '90.38578500');
  // HALF_UP and HALF_EVEN agree here, so the unstated tie rule does not affect the 4-decimal rate.
  assert.equal(at(exact, 4), '90.3858'); assert.equal(toPlain(round(exact, 4, 'HALF_EVEN'), 4), '90.3858');
  const proceeds = mul(d('25000'), d('90.3858'));
  assert.equal(at(proceeds, 2), '2259645.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of ['1.0836', '83.4125', '90.385785', '90.3858', formatIndian(proceeds, 2)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('90.3858') && card.final_answer_with_unit.includes('22,59,645.00'));
});

test('B002 D005: forward premium in paise', () => {
  const q = itemFor('D005') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const paise = mul(sub(d('84.6325'), d('83.4175')), d('100'));
  assert.equal(at(paise, 2), '121.50'); assert.equal(q.numeric_rule.expected_answer, '121.50'); notTie(paise, 2);
  assert.deepEqual(gradeNumeric('121.5', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '121.50' });
  const inRupees = gradeNumeric('1.22', q.numeric_rule); assert.equal(inRupees.status === 'graded' && inRupees.is_correct, false);
});

test('B002 D006: two-way cross quote and spread', () => {
  const q = itemFor('D006') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const buyExact = mul(eurBid, usdBid), sellExact = mul(eurOffer, usdOffer);
  assert.equal(toPlain(sellExact), '90.43291175');
  const buy = round(buyExact, 4, 'HALF_UP'), sell = round(sellExact, 4, 'HALF_UP');
  assert.equal(toPlain(buy, 4), '90.3858'); assert.equal(toPlain(sell, 4), '90.4329');
  // Neither rounding is a tie under any of the supported tie rules.
  assert.equal(toPlain(round(sellExact, 4, 'HALF_EVEN'), 4), '90.4329'); assert.equal(toPlain(round(buyExact, 4, 'HALF_EVEN'), 4), '90.3858');
  const spreadPaise = mul(sub(sell, buy), d('100'));
  assert.equal(at(spreadPaise, 2), '4.71'); assert.equal(q.numeric_rule.expected_answer, '4.71');
  assert.deepEqual(gradeNumeric('4.71', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '4.71' });
  // Wrong pairings (bid with offer) and an unrounded spread give different figures and are marked wrong.
  const mixed = [mul(sub(round(mul(eurOffer, usdBid), 4, 'HALF_UP'), buy), d('100')), mul(sub(sell, round(mul(eurBid, usdOffer), 4, 'HALF_UP')), d('100'))].map(x => at(x, 2));
  for (const wrong of mixed) { assert.notEqual(wrong, '4.71'); const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const shown = (q.worked_solution_steps ?? []).map(s => s.intermediate_result).join(' | ');
  for (const expected of ['90.385785', '90.3858', '90.43291175', '90.4329', '4.71 paise']) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
});

test('B002: choice question has four distinct options and all items are drafts', () => {
  const q = itemFor('D004') as QuestionItem;
  if (q.question_type !== 'single_choice') throw new Error('expected choice');
  assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
  assert.equal(q.options.find(o => o.option_id === q.correct_option_id)!.text_md, 'The central bank');
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
