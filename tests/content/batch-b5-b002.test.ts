// Independent deterministic recomputation for batch BFM-B-U05-B002 (additional reading: Altman Z, implied default, haircuts, transition matrix).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, cmp, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U05-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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
/** Z = 1.2 X1 + 1.4 X2 + 3.3 X3 + 0.6 X4 + 1.0 X5 */
const z = (x1: string, x2: string, x3: string, x4: string, x5: string) =>
  add(add(add(add(mul(d('1.2'), d(x1)), mul(d('1.4'), d(x2))), mul(d('3.3'), d(x3))), mul(d('0.6'), d(x4))), mul(d('1.0'), d(x5)));
/** Default probability implied by risk-free i and corporate k (decimals): 1 - (1+i)/(1+k). */
const pd = (i: string, k: string) => sub(d('1'), div(add(d('1'), d(i)), add(d('1'), d(k)), 10, 'HALF_UP'));
/** E* = max{0, E(1+He) - C(1-Hc-Hfx)} */
const eStar = (e: string, he: string, c: string, hc: string, hfx: string) => maxZero(sub(mul(d(e), add(d('1'), d(he))), mul(d(c), sub(sub(d('1'), d(hc)), d(hfx)))));

test('U05-B002 D005: two Z scores', () => {
  const p = z('0.20', '0.15', '0.10', '0.80', '1.10'); const q = z('0.05', '0.04', '0.03', '0.30', '0.90');
  assert.equal(at(p, 2), '2.36'); assert.equal(at(q, 3), '1.295');
  assert.ok(cmp(p, d('1.81')) > 0); assert.ok(cmp(q, d('1.81')) < 0);
  const shown = shownOf(itemFor('D005') as StudyCard);
  for (const t of ['2.36', '1.295', '0.24 + 0.21 + 0.33 + 0.48 + 1.10', '0.06 + 0.056 + 0.099 + 0.18 + 0.90']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  // raising X3 by 0.05 adds 0.165
  assert.equal(at(mul(d('3.3'), d('0.05')), 3), '0.165');
});

test('U05-B002 D006: implied default probability', () => {
  assert.equal(at(pd('0.07', '0.095'), 6), '0.022831'); assert.equal(at(mul(pd('0.07', '0.095'), d('100')), 2), '2.28');
  assert.equal(at(div(d('1.07'), d('1.095'), 6, 'HALF_UP'), 6), '0.977169');
  assert.equal(at(mul(pd('0.07', '0.105'), d('100')), 2), '3.17');
  const shown = shownOf(itemFor('D006') as StudyCard);
  for (const t of ['1.07', '1.095', '0.977169', '2.28%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B002 D007: collateral with loans and a repo-style exposure', () => {
  assert.equal(at(mul(d('90'), d('0.85')), 2), '76.50');
  assert.equal(at(eStar('100', '0', '90', '0.15', '0'), 2), '23.50');
  const he = add(mul(div(d('60'), d('100'), 6, 'HALF_UP'), d('0')), d('0.048')); assert.equal(at(he, 3), '0.048');
  assert.equal(at(mul(d('100'), add(d('1'), d('0.048'))), 2), '104.80');
  assert.equal(at(eStar('100', '0.048', '90', '0.15', '0'), 2), '28.30');
  const shown = shownOf(itemFor('D007') as StudyCard);
  for (const t of ['₹76.50 crore', '₹23.50 crore', '₹104.80 crore', '₹28.30 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B002: courseware illustration reproduces 87 and the Directions give 60', () => {
  const he = add(mul(div(d('100'), d('300'), 12, 'HALF_UP'), d('0.07')), mul(div(d('200'), d('300'), 12, 'HALF_UP'), d('0.10')));
  assert.equal(at(he, 2), '0.09');
  assert.equal(at(eStar('300', '0.09', '300', '0.20', '0'), 0), '87');
  assert.equal(at(eStar('300', '0', '300', '0.20', '0'), 0), '60');
});

test('U05-B002 D008: BB row of the matrix, and the matrix itself', () => {
  const rows: Record<string, number[]> = { A: [94, 5, 1, 0, 0], BBB: [3, 88, 7, 1, 1], BB: [0, 6, 80, 10, 4], B: [0, 0, 8, 74, 18] };
  for (const r of Object.values(rows)) assert.equal(r.reduce((a, c) => a + c, 0), 100);
  const bb = [6, 80, 10, 4].map(p => 400 * p / 100); assert.deepEqual(bb, [24, 320, 40, 16]); assert.equal(bb.reduce((a, c) => a + c, 0), 400);
  const shown = shownOf(itemFor('D008') as StudyCard);
  for (const t of ['24', '320', '40', '16', '400']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  const card = itemFor('D004') as StudyCard;
  for (const t of ['| **A** | 800 | 94 | 5 | 1 | 0 | 0 |', '| **BBB** | 600 | 3 | 88 | 7 | 1 | 1 |', '| **BB** | 400 | 0 | 6 | 80 | 10 | 4 |', '| **B** | 200 | 0 | 0 | 8 | 74 | 18 |']) assert.ok(card.core_explanation_md.includes(t), t);
});

test('U05-B002 D027 to D034: numerical questions', () => {
  const q1 = numeric('D027'); assert.equal(at(z('0.10', '0.08', '0.06', '0.50', '1.00'), 3), '1.730'); assert.equal(q1.numeric_rule.expected_answer, '1.73'); wrongs(q1, ['1.81', '1.17', '2.73', '1.50']);
  const q2 = numeric('D028'); assert.equal(at(z('0.30', '0.20', '0.12', '1.00', '1.30'), 3), '2.936'); assert.equal(at(z('0.30', '0.20', '0.12', '1.00', '1.30'), 2), '2.94'); assert.equal(q2.numeric_rule.expected_answer, '2.94'); wrongs(q2, ['2.93', '2.84', '3.94', '2.00']);
  const q3 = numeric('D029'); assert.equal(at(mul(pd('0.06', '0.08'), d('100')), 2), '1.85'); assert.equal(q3.numeric_rule.expected_answer, '1.85'); wrongs(q3, ['2.00', '98.15', '1.89', '0.02']);
  const q4 = numeric('D030'); assert.equal(at(mul(pd('0.08', '0.115'), d('100')), 2), '3.14'); assert.equal(q4.numeric_rule.expected_answer, '3.14'); wrongs(q4, ['3.50', '3.04', '96.86', '3.00']);
  const q5 = numeric('D031'); assert.equal(at(eStar('200', '0', '150', '0.20', '0'), 0), '80'); assert.equal(q5.numeric_rule.expected_answer, '80'); wrongs(q5, ['50', '120', '200', '30']);
  const q6 = numeric('D032'); assert.equal(at(eStar('120', '0', '100', '0.10', '0.08'), 0), '38'); assert.equal(q6.numeric_rule.expected_answer, '38'); wrongs(q6, ['30', '20', '82', '48']);
  const q7 = numeric('D033'); assert.equal(Math.round(400 * (10 + 4) / 100), 56); assert.equal(q7.numeric_rule.expected_answer, '56'); wrongs(q7, ['40', '16', '14', '320']);
  const q8 = numeric('D034'); assert.equal(800 * 0 / 100 + 600 * 1 / 100 + 400 * 4 / 100 + 200 * 18 / 100, 58); assert.equal(q8.numeric_rule.expected_answer, '58'); wrongs(q8, ['36', '22', '2.9', '100']);
});

test('U05-B002: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 18; i++) {
    const q = itemFor('D' + String(9 + i).padStart(3, '0')) as QuestionItem;
    assert.equal(q.question_type, 'single_choice');
    if (q.question_type !== 'single_choice') continue;
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
