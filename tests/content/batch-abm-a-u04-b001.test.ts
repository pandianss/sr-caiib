// Independent deterministic recomputation for batch ABM-A-U04-B001 (correlation and regression).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0);
const stats = (x: number[], y: number[]) => {
  const n = x.length, sx = sum(x), sy = sum(y), sxy = sum(x.map((v, i) => v * (y[i] ?? 0))), sxx = sum(x.map(v => v * v)), syy = sum(y.map(v => v * v));
  const r = (n * sxy - sx * sy) / (Math.sqrt(n * sxx - sx * sx) * Math.sqrt(n * syy - sy * sy));
  const bb = (n * sxy - sx * sy) / (n * sxx - sx * sx); const aa = sy / n - bb * sx / n;
  const resid = sum(x.map((v, i) => ((y[i] ?? 0) - (aa + bb * v)) ** 2));
  return { n, sx, sy, sxy, sxx, syy, r, b: bb, a: aa, resid, se: Math.sqrt(resid / (n - 2)) };
};

test('ABM U04 courseware example 4.1: the printed total of x squared is mis-added; corrected values', () => {
  const xs = [42, 44, 58, 55, 89, 98, 66]; const s = stats(xs, [56, 59, 53, 58, 65, 78, 58]);
  assert.deepEqual([s.sx, s.sy, s.syy, s.sxy], [452, 427, 26463, 28469]);
  assert.equal(s.sxx, 31970); assert.notEqual(s.sxx, 31940); // the courseware prints 31,940
  near(s.r, 0.8336, 5e-5); near(s.b, 0.3222, 5e-5); near(s.a, 40.19, 5e-3); near(s.a + s.b * 70, 62.75, 5e-3); near(s.se, 5.04, 5e-3);
  // what the printed total gives
  const rPrinted = (7 * 28469 - 452 * 427) / (Math.sqrt(7 * 31940 - 452 ** 2) * Math.sqrt(7 * 26463 - 427 ** 2)); near(rPrinted, 0.8383, 5e-4);
  near(740 / 20, 37); near(37 / (Math.sqrt(204) * Math.sqrt(506)), 0.115, 1e-3);
});

test('ABM U04 D007: advertising and new accounts', () => {
  const s = stats([2, 4, 6, 8, 10], [3, 5, 6, 9, 12]);
  assert.deepEqual([s.sx, s.sy, s.sxy, s.sxx, s.syy], [30, 35, 254, 220, 295]);
  near(s.r, 0.98387, 5e-5); near(s.b, 1.1); near(s.a, 0.4); near(s.a + s.b * 7, 8.1); near(s.resid, 1.6); near(295 - 0.4 * 35 - 1.1 * 254, 1.6, 1e-9);
  near(s.se, 0.7303, 5e-4); near(Math.sqrt(50000), 223.607, 5e-4);
  const t = shown('D007'); for (const p of ['30, 35, 254, 220, 295', '220', '223.61', '0.9839', 'b = 1.1, a = 0.4', '8.1', '1.6', '0.73']) assert.ok(t.includes(p), p);
});

test('ABM U04 D008: covariance, r and slope from summary figures', () => {
  const cov = 360 / 20; near(cov, 18); near(cov / (10 * 15), 0.12); near(cov / 100, 0.18);
  const t = shown('D008'); for (const p of ['18', '10 and 15', '0.12', '0.18']) assert.ok(t.includes(p), p);
});

test('ABM U04 numerical questions: expected answers recomputed and graded', () => {
  const s = stats([2, 4, 6, 8], [3, 7, 8, 12]);
  assert.deepEqual([s.sx, s.sy, s.sxy, s.sxx, s.syy], [20, 30, 178, 120, 266]);
  near(s.r, 0.9778, 5e-5); near(s.b, 1.4); near(Math.sqrt(13120), 114.54, 5e-3);
  assert.notEqual((s.r * 10000) % 1, 0.5); // no tie at 4 decimals
  const cases: [string, number, string][] = [
    ['D020', 24 / (4 * 10), '0.60'], ['D021', 30 / 25, '1.20'], ['D022', 50 - 1.2 * 20, '26'], ['D023', 10 + 2.5 * 8, '30'],
    ['D024', s.r, '0.9778'], ['D025', s.b, '1.40'], ['D026', Math.sqrt(36 / (11 - 2)), '2'], ['D027', 40 + 2 * 3, '46'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 5e-5); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM U04 card self-checks and choice questions', () => {
  near(12 / (3 * 5), 0.8); assert.equal(70 - 2 * 20, 30); assert.equal(30 + 2 * 25, 80); near(Math.sqrt(36 / 9), 2);
  // the courseware's reading of a circular pattern: points on a circle give r of zero
  const pts = Array.from({ length: 8 }, (_, k) => [Math.cos(k * Math.PI / 4), Math.sin(k * Math.PI / 4)] as [number, number]);
  const c = stats(pts.map(p => p[0]), pts.map(p => p[1])); near(c.r, 0, 1e-9);
  for (let n = 9; n <= 19; n++) {
    const q = itemFor(`D0${String(n).padStart(2, '0')}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  assert.equal(b.items.length, 27);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
