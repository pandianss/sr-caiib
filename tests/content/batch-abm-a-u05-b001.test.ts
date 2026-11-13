// Independent deterministic recomputation for batch ABM-A-U05-B001 (time series).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0);
const r1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);

test('ABM U05 courseware ship and watch examples (as printed) reproduce', () => {
  const ships = [98, 105, 116, 119, 135, 156, 177, 208]; const x = [-7, -5, -3, -1, 1, 3, 5, 7];
  assert.equal(sum(ships), 1114); assert.equal(sum(x.map((v, i) => v * (ships[i] ?? 0))), 1266); assert.equal(sum(x.map(v => v * v)), 168);
  near(1266 / 168, 7.536, 5e-4); near(1114 / 8, 139.25); near(139.25 + (1266 / 168) * 13, 237.22, 0.01); assert.equal(2 * (2024 - 2017.5), 13);
  const w = [13, 24, 39, 65, 106]; const cx = [-2, -1, 0, 1, 2];
  assert.deepEqual([sum(w), sum(cx.map((v, i) => v * (w[i] ?? 0))), sum(cx.map(v => v * v)), sum(cx.map(v => v ** 4)), sum(cx.map((v, i) => v * v * (w[i] ?? 0)))], [247, 227, 10, 34, 565]);
  const c = (565 - 2 * 247) / (34 - 20) * 1; // from 565 = 10a + 34c and 2 x 247 = 10a + 20c
  near(c, 71 / 14); near((247 - 10 * (71 / 14)) / 5, 39.257, 1e-3);
});

test('ABM U05 D009: six-year linear trend and forecast', () => {
  const y = [40, 46, 55, 61, 70, 76]; const x = [-5, -3, -1, 1, 3, 5];
  assert.deepEqual([2019, 2020, 2021, 2022, 2023, 2024].map(v => 2 * (v - 2021.5)), x);
  const sxy = sum(x.map((v, i) => v * (y[i] ?? 0))), sxx = sum(x.map(v => v * v)); assert.equal(sum(y), 348); assert.equal(sxy, 258); assert.equal(sxx, 70);
  const a = 348 / 6, bs = sxy / sxx; near(a, 58); near(bs, 3.685714, 1e-6); near(a + bs * 9, 91.1714, 1e-4); near(2 * bs, 7.371, 1e-3);
  const t = shown('D009'); for (const p of ['-5, -3, -1, 1, 3, 5', '348; 58', '258; 70', 'b = 3.69, a = 58', '9', '91.17']) assert.ok(t.includes(p), p);
});

test('ABM U05 D010: parabola for digital payments', () => {
  const y = [10, 12, 18, 28, 42]; const x = [-2, -1, 0, 1, 2];
  assert.deepEqual([sum(y), sum(x.map((v, i) => v * (y[i] ?? 0))), sum(x.map(v => v * v)), sum(x.map(v => v ** 4)), sum(x.map((v, i) => v * v * (y[i] ?? 0)))], [110, 80, 10, 34, 248]);
  const c = (248 - 2 * 110) / (34 - 20); const a = (110 - 10 * c) / 5; const bb = 80 / 10; assert.equal(c, 2); assert.equal(a, 18); assert.equal(bb, 8);
  assert.deepEqual(x.map(v => a + bb * v + c * v * v), y); assert.equal(a + bb * 3 + c * 9, 60);
  const t = shown('D010'); for (const p of ['110; 80; 10; 34; 248', 'b = 8', 'c = 2', 'a = 18', '10; 42', '60']) assert.ok(t.includes(p), p);
});

test('ABM U05 D011: per cent of trend and residual', () => {
  const act = [50, 54, 57, 62], tr = [50, 53, 58, 60];
  assert.deepEqual(act.map((v, i) => r1(100 * v / (tr[i] ?? 1))), ['100.0', '101.9', '98.3', '103.3']);
  assert.deepEqual(act.map((v, i) => r1(100 * (v - (tr[i] ?? 0)) / (tr[i] ?? 1))), ['0.0', '1.9', '-1.7', '3.3']);
  const t = shown('D011'); for (const p of ['100.0; 101.9; 98.3; 103.3', '0.0; 1.9; -1.7; 3.3']) assert.ok(t.includes(p), p);
});

test('ABM U05 D012 and D013: seasonal indices by ratio to centred moving average (independent route)', () => {
  const v = [62, 78, 96, 84, 66, 82, 100, 88, 70, 88, 106, 92, 74, 92, 110, 98];
  // centred four-quarter moving average at position i = (v[i-2] + 2 v[i-1] + 2 v[i] + 2 v[i+1] + v[i+2]) / 8
  const cma = (i: number) => ((v[i - 2] ?? 0) + 2 * (v[i - 1] ?? 0) + 2 * (v[i] ?? 0) + 2 * (v[i + 1] ?? 0) + (v[i + 2] ?? 0)) / 8;
  const ratios: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [] };
  for (let i = 2; i <= 13; i++) ratios[i % 4]?.push(100 * (v[i] ?? 0) / cma(i));
  assert.equal(Object.values(ratios).every(a => a.length === 3), true);
  const modified = [0, 1, 2, 3].map(q => { const a = [...(ratios[q] ?? [])].sort((x, y) => x - y); return a[1] ?? 0; });
  const total = sum(modified); const k = 400 / total; const idx = modified.map(m => m * k);
  near(sum(idx), 400, 1e-9); near(total, 400.48, 5e-3); near(k, 0.9988, 5e-5);
  assert.deepEqual(idx.map(r1), ['80.1', '99.1', '118.3', '102.5']);
  assert.equal(cma(2), 80.5); near(cma(7), 85.75);
  const t = shown('D012'); for (const p of ['320, 324, 328, 332, 336, 340, 346, 352, 356, 360, 364, 368, 374', '80.50, 81.50', '80.23, 99.19, 118.44, 102.62', '400.48', '0.9988', 'Q1 80.1, Q2 99.1, Q3 118.3, Q4 102.5']) assert.ok(t.includes(p), p);
  const q3 = idx[2] ?? 0; near(100 / (q3 / 100), 84.5, 0.05); near(105 * q3 / 100, 124.2, 0.05);
  const u = shown('D013'); assert.ok(u.includes(r1(100 / (q3 / 100))) && u.includes(r1(105 * q3 / 100)));
});

test('ABM U05 numerical questions: expected answers recomputed and graded', () => {
  const cases: [string, number, string][] = [
    ['D027', 147 + 13.6 * 4, '201.4'], ['D028', 2 * (2026 - 2020.5), '11'], ['D029', 100 * 84 / 80, '105.0'], ['D030', 100 * (55 - 50) / 50, '10.0'], ['D031', 2000 * 90 / 100, '1800'],
    ['D032', 1134 / 1.26, '900'], ['D033', 400 / 404, '0.9901'], ['D034', (2100 + 2110) / 2, '2105'], ['D035', 100 * 2415 / 2000, '120.75'], ['D036', 18 + 8 * 3 + 2 * 9, '60'],
  ];
  assert.equal(sum([120, 132, 150, 158, 175]), 735); assert.equal(sum([-2, -1, 0, 1, 2].map((x, i) => x * ([120, 132, 150, 158, 175][i] ?? 0))), 136); assert.equal(2026 - 2022, 4);
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 5e-5); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  near(400 / 404, 0.990099, 1e-6); // not a tie at 4 decimals
});

test('ABM U05 choice questions: four distinct options, one correct; all drafts unreviewed', () => {
  for (let n = 14; n <= 26; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  near(258 / 70, 3.6857, 1e-4); near(2 * 258 / 70, 7.3714, 1e-4); near(6 / 60 * 100, 10);
  assert.equal(b.items.length, 36);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
