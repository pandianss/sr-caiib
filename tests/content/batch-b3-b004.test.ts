// Independent deterministic recomputation for batch BFM-B-U03-B004 (capital annexure: CCF, counterparty risk, collateral, RWA).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, cmp, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U03-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
type D = ReturnType<typeof mustDec>;
const d = mustDec;
const at = (x: D, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const numeric = (id: string) => { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric'); return q; };
const wrongs = (q: QuestionItem, vals: string[]) => { if (q.question_type !== 'numeric_input') throw new Error('numeric'); for (const w of vals) { const g = gradeNumeric(w, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, w); } };
const maxZero = (x: D) => (cmp(x, d('0')) > 0 ? x : d('0'));
/** E* = max{0, E(1+He) - C(1-Hc-Hfx)} (percent inputs as decimals). */
const eStar = (e: string, he: string, c: string, hc: string, hfx: string) => maxZero(sub(mul(d(e), add(d('1'), d(he))), mul(d(c), sub(sub(d('1'), d(hc)), d(hfx)))));

test('B3-B004 D009: credit equivalents of one borrower', () => {
  const cc = mul(sub(d('200'), d('120')), d('0.2')); const tl = add(mul(d('40'), d('0.2')), mul(d('60'), d('0.5')));
  const nfb = add(add(mul(d('90'), d('1')), mul(d('80'), d('0.5'))), mul(d('40'), d('0.2')));
  assert.equal(at(cc, 0), '16'); assert.equal(at(tl, 0), '38'); assert.equal(at(nfb, 0), '138'); assert.equal(at(add(add(cc, tl), nfb), 0), '192');
  const shown = shownOf(itemFor('D009') as StudyCard);
  for (const t of ['₹80 lakh', '₹16 lakh', '₹8 lakh', '₹30 lakh', '₹90 lakh', '₹40 lakh', '₹192 lakh']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B004 D010: current exposure method', () => {
  const swap = add(d('6'), mul(d('1000'), d('0.005'))); const fwd = add(maxZero(d('-2')), mul(d('500'), d('0.01')));
  assert.equal(at(swap, 0), '11'); assert.equal(at(fwd, 0), '5'); assert.equal(at(add(swap, fwd), 0), '16');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['₹5 crore', '₹11 crore', '₹0 crore', '₹16 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B004 D011: exposure after collateral', () => {
  const a = eStar('100', '0', '30', '0.06', '0'); const bb = eStar('100', '0', '40', '0.08', '0.08');
  assert.equal(at(mul(d('30'), d('0.94')), 2), '28.20'); assert.equal(at(a, 2), '71.80'); assert.equal(at(mul(d('40'), d('0.84')), 2), '33.60'); assert.equal(at(bb, 2), '66.40');
  const shown = shownOf(itemFor('D011') as StudyCard);
  for (const t of ['₹28.20 lakh', '₹71.80 lakh', '₹33.60 lakh', '₹66.40 lakh']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B004 D012: maturity adjustment', () => {
  const mf = div(sub(d('2'), d('0.25')), sub(d('4'), d('0.25')), 6, 'HALF_UP'); assert.equal(at(mf, 4), '0.4667');
  const p = div(mul(d('60'), d('1.75')), d('3.75'), 6, 'HALF_UP'); assert.equal(at(p, 2), '28.00'); assert.equal(at(sub(d('100'), p), 2), '72.00');
  const shown = shownOf(itemFor('D012') as StudyCard);
  for (const t of ['4 years', '2 years', '0.4667', '₹28.00 lakh', '₹72.00 lakh']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B004 D013: capital ratios', () => {
  const rwa = add(add(d('14000'), mul(d('640'), d('12.5'))), mul(d('360'), d('12.5')));
  assert.equal(at(rwa, 0), '26500'); assert.equal(at(mul(div(d('2100'), rwa, 8, 'HALF_UP'), d('100')), 2), '7.92'); assert.equal(at(mul(div(d('3000'), rwa, 8, 'HALF_UP'), d('100')), 2), '11.32');
  assert.ok(cmp(mul(div(d('3000'), rwa, 8, 'HALF_UP'), d('100')), d('11.5')) < 0); assert.equal(at(mul(rwa, d('0.115')), 1), '3047.5');
  const shown = shownOf(itemFor('D013') as StudyCard);
  for (const t of ['₹8,000 crore', '₹4,500 crore', '₹26,500 crore', '7.92%', '11.32%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B004 D039 to D047: numerical questions', () => {
  const q1 = numeric('D039'); assert.equal(at(mul(sub(d('250'), d('180')), d('0.2')), 0), '14'); assert.equal(q1.numeric_rule.expected_answer, '14'); wrongs(q1, ['70', '35', '1.4', '180']);
  const q2 = numeric('D040'); assert.equal(at(mul(d('200'), d('0.5')), 0), '100'); assert.equal(q2.numeric_rule.expected_answer, '100'); wrongs(q2, ['40', '200', '10', '20']);
  const q3 = numeric('D041'); assert.equal(at(add(mul(d('60'), d('0.5')), mul(d('100'), d('0.2'))), 0), '50'); assert.equal(q3.numeric_rule.expected_answer, '50'); wrongs(q3, ['160', '80', '30', '20']);
  const q4 = numeric('D042'); assert.equal(at(mul(d('800'), d('0.005')), 2), '4.00'); assert.equal(q4.numeric_rule.expected_answer, '4.00'); wrongs(q4, ['8.00', '12.00', '2.00', '40.00']);
  const q5 = numeric('D043'); assert.equal(at(add(d('3'), mul(d('300'), d('0.01'))), 0), '6'); assert.equal(q5.numeric_rule.expected_answer, '6'); wrongs(q5, ['3', '18', '15', '4.5']);
  const q6 = numeric('D044'); assert.equal(at(eStar('100', '0', '35', '0.12', '0'), 2), '69.20'); assert.equal(q6.numeric_rule.expected_answer, '69.20'); wrongs(q6, ['65.00', '30.80', '72.00', '70.00']);
  const q7 = numeric('D045'); assert.equal(at(eStar('80', '0', '50', '0.15', '0'), 2), '37.50'); assert.equal(q7.numeric_rule.expected_answer, '37.50'); wrongs(q7, ['30.00', '42.50', '80.00', '27.50']);
  const q8 = numeric('D046'); const cap = mul(d('18000'), d('0.0125')); assert.equal(at(cap, 0), '225'); assert.equal(q8.numeric_rule.expected_answer, '225'); wrongs(q8, ['280', '505', '1,125', '2250']);
  const q9 = numeric('D047'); assert.equal((4 * Math.sqrt((1 + 5 - 1) / 10)).toFixed(2), '2.83'); assert.equal(q9.numeric_rule.expected_answer, '2.83'); wrongs(q9, ['4.00', '2.00', '5.66', '1.41']);
});

test('B3-B004: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 25; i++) {
    const q = itemFor('D' + String(14 + i).padStart(3, '0')) as QuestionItem;
    assert.equal(q.question_type, 'single_choice');
    if (q.question_type !== 'single_choice') continue;
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
