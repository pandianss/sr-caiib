// Independent deterministic recomputation for batch BFM-B-U05-B001 (credit risk).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const numeric = (id: string) => { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric'); return q; };
const wrongs = (q: QuestionItem, vals: string[]) => { if (q.question_type !== 'numeric_input') throw new Error('numeric'); for (const w of vals) { const g = gradeNumeric(w, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, w); } };
/** MRR: 5% when original maturity is 24 months or less or for RMBS; 10% when over 24 months (non-RMBS). */
const mrr = (book: string, months: number, rmbs: boolean) => mul(d(book), d(rmbs || months <= 24 ? '0.05' : '0.10'));

test('B5-B001 D012: expected defaults and loss rates', () => {
  assert.equal(at(mul(d('500'), d('0.008')), 0), '4'); assert.equal(at(mul(d('300'), d('0.04')), 0), '12');
  assert.equal(at(mul(d('0.008'), d('0.6')), 4), '0.0048'); assert.equal(at(mul(d('0.04'), d('0.6')), 3), '0.024');
  assert.equal(at(mul(mul(d('300'), d('0.5')), d('0.024')), 1), '3.6'); // crore: 300 loans x 0.5 crore x 2.4%
  const shown = shownOf(itemFor('D012') as StudyCard);
  for (const t of ['4 borrowers', '12 borrowers', '0.48%', '2.40%', '₹3.6 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B5-B001 D013: migration probabilities', () => {
  const n = d('200');
  assert.equal(at(mul(div(d('130'), n, 6, 'HALF_UP'), d('100')), 0), '65'); assert.equal(at(mul(div(d('4'), n, 6, 'HALF_UP'), d('100')), 0), '2');
  assert.equal(at(mul(div(add(d('40'), d('18')), n, 6, 'HALF_UP'), d('100')), 0), '29'); assert.equal(at(mul(div(d('8'), n, 6, 'HALF_UP'), d('100')), 0), '4');
  assert.equal(4 + 130 + 40 + 18 + 8, 200);
  const shown = shownOf(itemFor('D013') as StudyCard);
  for (const t of ['65%', '2%', '29%', '4%', '100%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B5-B001 D014: minimum retention', () => {
  assert.equal(at(mrr('300', 18, false), 0), '15'); assert.equal(at(mrr('500', 60, false), 0), '50'); assert.equal(at(mrr('400', 240, true), 0), '20');
  const shown = shownOf(itemFor('D014') as StudyCard);
  for (const t of ['₹15 crore', '₹50 crore', '₹20 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B5-B001 D015: cash settlement of a credit default swap', () => {
  const prem = mul(d('60'), d('0.015')); assert.equal(at(prem, 1), '0.9'); assert.equal(at(mul(prem, d('2')), 1), '1.8'); assert.equal(at(mul(prem, d('3')), 1), '2.7');
  const rec = mul(d('60'), d('0.4')); assert.equal(at(rec, 0), '24'); assert.equal(at(sub(d('60'), rec), 0), '36');
  const shown = shownOf(itemFor('D015') as StudyCard);
  for (const t of ['₹0.9 crore', '₹1.8 crore', '₹24 crore', '₹36 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B5-B001 D048 to D053: numerical questions', () => {
  const q1 = numeric('D048'); assert.equal(at(mul(d('250'), d('0.012')), 1), '3.0'); assert.equal(q1.numeric_rule.expected_answer, '3.0'); wrongs(q1, ['30.0', '0.3', '2.5', '12.0']);
  const q2 = numeric('D049'); assert.equal(at(mrr('720', 48, false), 0), '72'); assert.equal(q2.numeric_rule.expected_answer, '72'); wrongs(q2, ['36', '144', '7.2', '720']);
  const q3 = numeric('D050'); assert.equal(at(sub(d('80'), mul(d('80'), d('0.35'))), 0), '52'); assert.equal(q3.numeric_rule.expected_answer, '52'); wrongs(q3, ['28', '80', '35', '48']);
  const q4 = numeric('D051'); assert.equal(at(mul(d('12000'), d('0.3')), 0), '3600'); assert.equal(q4.numeric_rule.expected_answer, '3600'); wrongs(q4, ['4800', '360', '1200', '12000']);
  const q5 = numeric('D052'); assert.equal(at(add(d('6.4'), sub(d('96.5'), d('100'))), 1), '2.9'); assert.equal(q5.numeric_rule.expected_answer, '2.9'); wrongs(q5, ['9.9', '3.5', '6.4', '-2.9']);
  const q6 = numeric('D053'); const def = 250 - 175 - 10 - 55; assert.equal(def, 10); assert.equal(at(mul(div(d('10'), d('250'), 6, 'HALF_UP'), d('100')), 0), '4'); assert.equal(q6.numeric_rule.expected_answer, '4'); wrongs(q6, ['10', '2', '22', '40']);
});

test('B5-B001: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 32; i++) {
    const id = 'D' + String(16 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
