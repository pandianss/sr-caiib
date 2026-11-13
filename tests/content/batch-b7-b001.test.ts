// Independent deterministic recomputation for batch BFM-B-U07-B001 (liquidity risk).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sub, mul, div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const pct = (n: string, m: string, places = 2) => at(mul(div(d(n), d(m), 8, 'HALF_UP'), d('100')), places);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const numeric = (id: string) => { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric'); return q; };
const wrongs = (q: QuestionItem, vals: string[]) => { if (q.question_type !== 'numeric_input') throw new Error('numeric'); for (const w of vals) { const g = gradeNumeric(w, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, w); } };

test('B7-B001 D010: stock ratios', () => {
  assert.equal(at(mul(div(sub(d('300'), d('150')), sub(d('850'), d('150')), 8, 'HALF_UP'), d('100')), 2), '21.43');
  assert.equal(pct('500', '1000'), '50.00'); assert.equal(pct('700', '1000'), '70.00'); assert.equal(pct('700', '500'), '140.00'); assert.equal(pct('150', '300'), '50.00');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['21.43%', '50.00%', '70.00%', '140.00%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B7-B001 D011: mismatch limits', () => {
  assert.equal(pct('12', '200'), '6.00'); assert.equal(at(mul(d('200'), d('0.05')), 0), '10'); assert.ok(12 > 10);
  assert.equal(pct('130', '800'), '16.25'); assert.equal(at(mul(d('800'), d('0.2')), 0), '160'); assert.ok(130 <= 160);
  const shown = shownOf(itemFor('D011') as StudyCard);
  for (const t of ['6.00%', '₹10 crore', '16.25%', '₹160 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B7-B001 D012: overseas norms', () => {
  assert.equal(pct('400', '600'), '66.67'); assert.equal(at(mul(d('600'), d('0.7')), 0), '420'); assert.equal(420 - 400, 20);
  assert.equal(pct('1250', '1500'), '83.33'); assert.equal(at(mul(d('1500'), d('0.8')), 0), '1200'); assert.equal(1250 - 1200, 50);
  const shown = shownOf(itemFor('D012') as StudyCard);
  for (const t of ['66.67%', '₹420 crore', '₹20 crore', '83.33%', '₹1,200 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B7-B001 D038 to D043: numerical questions', () => {
  const q1 = numeric('D038'); assert.equal(pct('420', '1200'), '35.00'); assert.equal(q1.numeric_rule.expected_answer, '35.00'); wrongs(q1, ['3.50', '350.00', '28.57', '65.00']);
  const q2 = numeric('D039'); assert.equal(at(mul(div(sub(d('360'), d('120')), sub(d('900'), d('120')), 8, 'HALF_UP'), d('100')), 2), '30.77'); assert.equal(q2.numeric_rule.expected_answer, '30.77'); wrongs(q2, ['40.00', '26.67', '66.67', '13.33']);
  const q3 = numeric('D040'); assert.equal(at(mul(d('650'), d('0.1')), 0), '65'); assert.equal(q3.numeric_rule.expected_answer, '65'); wrongs(q3, ['32', '130', '6.5', '650']);
  const q4 = numeric('D041'); assert.equal(at(mul(d('900'), d('0.7')), 0), '630'); assert.equal(q4.numeric_rule.expected_answer, '630'); wrongs(q4, ['720', '270', '900', '540']);
  const q5 = numeric('D042'); assert.equal(pct('850', '1700'), '50.00'); assert.equal(q5.numeric_rule.expected_answer, '50.00'); wrongs(q5, ['41.18', '25.00', '12.50', '60.00']);
  const q6 = numeric('D043'); assert.equal(40 + 25 + 35 + 60 + 90 + 10, 260); assert.equal(q6.numeric_rule.expected_answer, '260'); wrongs(q6, ['250', '170', '300', '26']);
});

test('B7-B001: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 25; i++) {
    const id = 'D' + String(13 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
