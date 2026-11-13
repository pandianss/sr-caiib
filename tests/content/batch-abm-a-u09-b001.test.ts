// Independent deterministic recomputation for batch ABM-A-U09-B001 (simulation).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U09-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0);

type Dist = [value: number, prob: number][];
/** Intervals from cumulative probabilities, in integer hundredths to avoid float error. */
const intervals = (d: Dist) => { let lo = 0; return d.map(([v, p]) => { const n = Math.round(p * 100); const iv = { value: v, lo, hi: lo + n - 1 }; lo += n; return iv; }); };
const lookup = (iv: ReturnType<typeof intervals>, r: number) => iv.find(x => r >= x.lo && r <= x.hi)!.value;

test('ABM U09 courseware milk example: intervals and mean demand', () => {
  const d: Dist = [[35, 0.1], [45, 0.3], [55, 0.2], [65, 0.3], [75, 0.1]];
  assert.deepEqual(intervals(d).map(x => `${x.lo}-${x.hi}`), ['0-9', '10-39', '40-59', '60-89', '90-99']);
  near(sum(d.map(([v, p]) => v * p)), 55); assert.equal(36 * 35 - 32 * 55, -500); assert.equal(36 * 35 - 32 * 65, -820); // day 1 and day 13 old-rule profits in the courseware table
});

test('ABM U09 D006: intervals for the kiosk', () => {
  const d: Dist = [[20, 0.2], [30, 0.3], [40, 0.4], [50, 0.1]]; const iv = intervals(d);
  assert.deepEqual(iv.map(x => [x.lo, x.hi]), [[0, 19], [20, 49], [50, 89], [90, 99]]); assert.equal(sum(iv.map(x => x.hi - x.lo + 1)), 100);
  assert.equal(lookup(iv, 49), 30); assert.equal(lookup(iv, 50), 40); assert.equal(lookup(iv, 57), 40);
  const t = shown('D006');
  assert.ok(t.includes('0.2, 0.5, 0.9, 1.0') && t.includes('20 numbers') && t.includes('10 numbers') && t.includes('100 numbers'));
});

test('ABM U09 D007 and D008: ten simulated days and the exact expected profits', () => {
  const d: Dist = [[20, 0.2], [30, 0.3], [40, 0.4], [50, 0.1]]; const iv = intervals(d);
  const rn = [12, 47, 83, 25, 64, 91, 38, 5, 14, 71]; const demand = rn.map(r => lookup(iv, r));
  assert.deepEqual(demand, [20, 30, 40, 30, 40, 50, 30, 20, 20, 40]);
  const profit = (q: number, x: number) => 30 * Math.min(x, q) - 20 * q;
  const a = demand.map(x => profit(40, x)), bb = demand.map(x => profit(30, x));
  assert.deepEqual(a, [-200, 100, 400, 100, 400, 400, 100, -200, -200, 400]); assert.deepEqual(bb, [0, 300, 300, 300, 300, 300, 300, 0, 0, 300]);
  assert.equal(sum(a) / 10, 130); assert.equal(sum(bb) / 10, 210);
  // exact expectation by summing over the distribution
  const ev = (q: number) => sum(d.map(([x, p]) => p * profit(q, x))); near(ev(40), 190); near(ev(30), 240); near(sum(d.map(([x, p]) => x * p)), 34);
  const t = shown('D007'); for (const p of ['20, 30, 40, 30, 40, 50, 30, 20, 20, 40', '-200, 100, 400, 100, 400, 400, 100, -200, -200, 400', '130', '0, 300, 300, 300, 300, 300, 300, 0, 0, 300', '210']) assert.ok(t.includes(p), p);
  const u = shown('D008'); for (const p of ['34', '33', '190', '28', '240']) assert.ok(u.includes(p), p);
});

test('ABM U09 numerical questions: expected answers recomputed and graded', () => {
  const d: Dist = [[20, 0.2], [30, 0.3], [40, 0.4], [50, 0.1]]; const iv = intervals(d);
  const cases: [string, number, string][] = [
    ['D021', Math.round(0.35 * 100), '35'], ['D022', 0.4 * 100, '40'], ['D023', lookup(iv, 57), '40'], ['D024', Math.min(50, 40), '40'], ['D025', 30 * 30 - 20 * 40, '100'],
    ['D026', sum(d.map(([v, p]) => v * p)), '34'], ['D027', sum([-200, 100, 400, 100]) / 4, '100'], ['D028', 190 * 20, '3800'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-9); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  const quarter = intervals([[1, 0.4], [2, 0.25]]); assert.deepEqual([quarter[1]!.lo, quarter[1]!.hi], [40, 64]); // card self-check
  assert.deepEqual(intervals([[1, 0.1], [2, 0.3]]).map(x => [x.lo, x.hi]), [[0, 9], [10, 39]]);
});

test('ABM U09 choice questions; all drafts unreviewed', () => {
  for (let n = 9; n <= 20; n++) {
    const q = itemFor(n < 10 ? `D00${n}` : `D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  assert.equal(b.items.length, 28);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
