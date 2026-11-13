// Independent deterministic recomputation for batch BFM-B-U08-B001 (Basel III liquidity standards).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, cmp, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U08-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
type D = ReturnType<typeof mustDec>;
const d = mustDec;
const at = (x: D, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const pct = (n: string, m: string) => at(mul(div(d(n), d(m), 8, 'HALF_UP'), d('100')), 2);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const numeric = (id: string) => { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric'); return q; };
const wrongs = (q: QuestionItem, vals: string[]) => { if (q.question_type !== 'numeric_input') throw new Error('numeric'); for (const w of vals) { const g = gradeNumeric(w, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, w); } };
const maxD = (...xs: D[]) => xs.reduce((m, x) => (cmp(x, m) > 0 ? x : m));
const minD = (a: D, b2: D) => (cmp(a, b2) < 0 ? a : b2);
/** Stock of HQLA from adjusted (after haircut) Level 1, 2A and 2B, per the Directions' formula. */
const stock = (l1: string, l2a: string, l2b: string) => {
  const a1 = d(l1), a2 = d(l2a), a3 = d(l2b);
  const lim1 = sub(a3, mul(div(d('15'), d('85'), 12, 'HALF_UP'), add(a1, a2)));
  const lim2 = sub(a3, mul(div(d('15'), d('60'), 12, 'HALF_UP'), a1));
  const adj15 = maxD(lim1, lim2, d('0'));
  const adj40 = maxD(sub(sub(add(a2, a3), adj15), mul(div(d('2'), d('3'), 12, 'HALF_UP'), a1)), d('0'));
  return { lim1, lim2, adj15, adj40, stock: sub(sub(add(add(a1, a2), a3), adj15), adj40) };
};
const netOut = (out: string, inn: string) => sub(d(out), minD(d(inn), mul(d(out), d('0.75'))));

test('B8-B001 D008: HQLA caps', () => {
  const s = stock('400', '300', '200');
  assert.equal(at(s.lim1, 2), '76.47'); assert.equal(at(s.lim2, 2), '100.00'); assert.equal(at(s.adj15, 2), '100.00'); assert.equal(at(s.adj40, 2), '133.33'); assert.equal(at(s.stock, 2), '666.67');
  const shown = shownOf(itemFor('D008') as StudyCard);
  for (const t of ['₹76.47 crore', '₹100.00 crore', '₹133.33 crore', '₹666.67 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  // after the caps Level 2 is 40% of the stock
  assert.equal(at(div(sub(s.stock, d('400')), s.stock, 8, 'HALF_UP'), 2), '0.40');
});

test('B8-B001 D009: retail run-off', () => {
  const t = add(add(add(mul(d('4000'), d('0.05')), mul(d('2000'), d('0.075'))), mul(d('3000'), d('0.10'))), mul(d('1000'), d('0.125')));
  assert.equal(at(t, 0), '775');
  const shown = shownOf(itemFor('D009') as StudyCard);
  for (const x of ['₹200 crore', '₹150 crore', '₹300 crore', '₹125 crore', '₹775 crore']) assert.ok(shown.includes(x), `${x} not in ${shown}`);
});

test('B8-B001 D010: LCR with the inflow cap', () => {
  assert.equal(at(netOut('900', '800'), 0), '225'); assert.equal(pct('270', '225'), '120.00');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const x of ['₹675 crore', '₹225 crore', '120.00%']) assert.ok(shown.includes(x), `${x} not in ${shown}`);
});

test('B8-B001 D011: NSFR', () => {
  const asf = add(add(add(mul(d('1000'), d('1')), mul(d('2000'), d('0.95'))), mul(d('1000'), d('0.9'))), mul(d('1500'), d('0.5')));
  assert.equal(at(asf, 0), '4550');
  const short = add(add(mul(d('300'), d('0')), mul(d('1000'), d('0.05'))), mul(d('200'), d('0.15')));
  const long = add(mul(d('2000'), d('0.65')), mul(d('1500'), d('0.85')));
  const rsf = add(add(add(short, mul(d('1500'), d('0.5'))), long), mul(d('400'), d('0.05')));
  assert.equal(at(short, 0), '80'); assert.equal(at(long, 0), '2575'); assert.equal(at(rsf, 0), '3425'); assert.equal(pct('4550', '3425'), '132.85');
  const shown = shownOf(itemFor('D011') as StudyCard);
  for (const x of ['₹4,550 crore', '₹80 crore', '₹2,575 crore', '₹3,425 crore', '132.85%']) assert.ok(shown.includes(x), `${x} not in ${shown}`);
});

test('B8-B001 D037 to D044: numerical questions', () => {
  const q1 = numeric('D037'); assert.equal(at(mul(d('8000'), d('0.15')), 0), '1200'); assert.equal(q1.numeric_rule.expected_answer, '1200'); wrongs(q1, ['3200', '120', '4800', '8000']);
  const q2 = numeric('D038'); assert.equal(at(mul(d('500'), d('0.85')), 0), '425'); assert.equal(q2.numeric_rule.expected_answer, '425'); wrongs(q2, ['75', '250', '500', '475']);
  const q3 = numeric('D039'); assert.equal(at(mul(d('300'), d('0.5')), 0), '150'); assert.equal(q3.numeric_rule.expected_answer, '150'); wrongs(q3, ['45', '300', '255', '15']);
  const q4 = numeric('D040'); assert.equal(at(netOut('1600', '1500'), 0), '400'); assert.equal(q4.numeric_rule.expected_answer, '400'); wrongs(q4, ['100', '1500', '1200', '0']);
  const q5 = numeric('D041'); assert.equal(pct('540', '400'), '135.00'); assert.equal(q5.numeric_rule.expected_answer, '135.00'); wrongs(q5, ['74.07', '13.50', '140.00', '100.00']);
  const q6 = numeric('D042'); assert.equal(at(add(add(mul(d('3000'), d('0.95')), mul(d('1000'), d('0.9'))), mul(d('800'), d('0.5'))), 0), '4150'); assert.equal(q6.numeric_rule.expected_answer, '4150'); wrongs(q6, ['4800', '3950', '4350', '415']);
  const q7 = numeric('D043'); assert.equal(at(add(mul(d('50000'), d('0.02')), mul(d('50000'), d('0.16'))), 0), '9000'); assert.equal(q7.numeric_rule.expected_answer, '9000'); wrongs(q7, ['8000', '4500', '1000', '5000']);
  const q8 = numeric('D044'); assert.equal(at(add(mul(d('600'), d('0.05')), mul(d('500'), d('0.03'))), 0), '45'); assert.equal(q8.numeric_rule.expected_answer, '45'); wrongs(q8, ['55', '33', '30', '75']);
});

test('B8-B001: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 25; i++) {
    const id = 'D' + String(12 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
