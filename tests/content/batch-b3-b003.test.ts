// Independent deterministic recomputation for batch BFM-B-U03-B003 (Pillars 2 and 3, buffers, leverage ratio, D-SIBs, RBS).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U03-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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
/** Table 46: conservation ratio for a CET1 ratio (per cent). */
const conservation = (cet1: number) => (cet1 <= 6.125 ? 1 : cet1 <= 6.75 ? 0.8 : cet1 <= 7.375 ? 0.6 : cet1 <= 8.0 ? 0.4 : 0);

test('B3-B003 D008: conservation of earnings', () => {
  assert.equal(conservation(7.0), 0.6); assert.equal(at(mul(d('800'), d('0.6')), 0), '480'); assert.equal(at(sub(d('800'), d('480')), 0), '320'); assert.equal(conservation(8.2), 0);
  const shown = shownOf(itemFor('D008') as StudyCard);
  for (const t of ['60% conserved', '₹480 crore', '₹320 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B003 D009: D-SIB CET1 requirement', () => {
  const ratio = add(add(d('5.5'), d('2.5')), d('0.40')); assert.equal(at(ratio, 1), '8.4'); assert.equal(at(mul(d('250000'), div(ratio, d('100'), 6, 'HALF_UP')), 0), '21000');
  assert.equal(at(add(add(d('5.5'), d('2.5')), d('1.00')), 1), '9.0');
  const shown = shownOf(itemFor('D009') as StudyCard);
  for (const t of ['8.0%', '8.4%', '₹21,000 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B003 D010: leverage ratio', () => {
  const lr = mul(div(d('9000'), d('240000'), 6, 'HALF_UP'), d('100')); assert.equal(at(lr, 2), '3.75');
  assert.ok(Number(at(lr, 2)) >= 3.5 && Number(at(lr, 2)) < 4);
  assert.equal(at(sub(mul(d('240000'), d('0.04')), d('9000')), 0), '600');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['3.75%', 'Meets', 'Falls short']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B003 D033 to D036: numerical questions', () => {
  const q1 = numeric('D033'); assert.equal(conservation(6.4), 0.8); assert.equal(at(mul(d('500'), d('0.2')), 0), '100'); assert.equal(q1.numeric_rule.expected_answer, '100'); wrongs(q1, ['400', '500', '200', '300']);
  const q2 = numeric('D034'); assert.equal(at(mul(d('300000'), div(add(add(d('5.5'), d('2.5')), d('0.80')), d('100'), 6, 'HALF_UP')), 0), '26400'); assert.equal(q2.numeric_rule.expected_answer, '26400'); wrongs(q2, ['24000', '25200', '27000', '300000']);
  const q3 = numeric('D035'); assert.equal(at(mul(div(d('6300'), d('180000'), 6, 'HALF_UP'), d('100')), 2), '3.50'); assert.equal(q3.numeric_rule.expected_answer, '3.50'); wrongs(q3, ['3.00', '4.00', '35.00', '3.60']);
  const q4 = numeric('D036'); assert.equal(at(add(add(d('5.5'), d('0.625')), d('0.25')), 3), '6.375'); assert.equal(q4.numeric_rule.expected_answer, '6.375'); wrongs(q4, ['6.125', '6.750', '6.625', '5.875']);
});

test('B3-B003: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 22; i++) {
    const id = 'D' + String(11 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
