// Independent deterministic recomputation for batch BFM-B-U01-B001 (risk and the basic risk management framework).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const negCarry = (crr: string, mc: string) => div(mul(d(crr), d(mc)), sub(d('1'), d(crr)), 8, 'HALF_UP');
const pstats = (xs: number[]) => { const m = xs.reduce((a, c) => a + c, 0) / xs.length; const v = xs.reduce((a, c) => a + (c - m) ** 2, 0) / xs.length; return { m, v }; };

test('B1-B001 D011: square root of time rule', () => {
  const shown = shownOf(itemFor('D011') as StudyCard);
  assert.equal(at(mul(d('0.8'), d('5')), 1), '4.0'); assert.equal(at(div(d('9'), d('6'), 1, 'HALF_UP'), 1), '1.5');
  for (const t of ['5', '4%', '6', '1.5%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B1-B001 D012: diversification example', () => {
  const p = [2, 4, 4, 4, 5, 5, 7, 9], q = [8, 6, 6, 6, 5, 5, 3, 1], sum = p.map((x, i) => x + q[i]!);
  const ps = pstats(p), qs = pstats(q), ss = pstats(sum);
  assert.deepEqual([ps.m, ps.v], [5, 4]); assert.deepEqual([qs.m, qs.v], [5, 4]); assert.deepEqual([ss.m, ss.v], [10, 0]);
  assert.equal(Math.sqrt(ps.v) / ps.m, 0.4);
  const shown = shownOf(itemFor('D012') as StudyCard);
  for (const t of ['5 and 5', '40%', '10 every year']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B1-B001 D013: negative carry on CRR example', () => {
  assert.equal(at(mul(d('0.04'), d('6.5')), 2), '0.26'); assert.equal(at(negCarry('0.04', '6.5'), 6), '0.270833');
  assert.equal(at(negCarry('0.04', '6.5'), 4), '0.2708');
  const shown = shownOf(itemFor('D013') as StudyCard);
  for (const t of ['0.26', '0.270833', '0.2708%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B1-B001 D040 to D042: numerical questions', () => {
  const q1 = itemFor('D040') as QuestionItem; if (q1.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('1.2'), d('5')), 0), '6'); assert.equal(q1.numeric_rule.expected_answer, '6');
  for (const wrong of ['30', '1.2', '5', '0.24']) { const g = gradeNumeric(wrong, q1.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q2 = itemFor('D041') as QuestionItem; if (q2.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(negCarry('0.045', '7.2'), 4), '0.3393'); assert.equal(q2.numeric_rule.expected_answer, '0.3393');
  assert.deepEqual(gradeNumeric('0.3393', q2.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '0.3393' });
  for (const wrong of ['0.324', '0.3240', '0.3392', '0.3394']) { const g = gradeNumeric(wrong, q2.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q3 = itemFor('D042') as QuestionItem; if (q3.question_type !== 'numeric_input') throw new Error('numeric');
  const total = ['6.80', '1.25', '0.90', '0.75', '1.30'].map(d).reduce((a, c) => add(a, c));
  assert.equal(at(total, 2), '11.00'); assert.equal(q3.numeric_rule.expected_answer, '11.00');
  for (const wrong of ['9.70', '10.00', '12.00', '8.95']) { const g = gradeNumeric(wrong, q3.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('B1-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = {};
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 26; i++) answers['D' + String(14 + i).padStart(3, '0')] = letters[i % 4]!;
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
