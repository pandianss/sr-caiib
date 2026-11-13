// Independent deterministic recomputation for batch ABM-A-U08-B001 (linear programming).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U08-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);

type Constraint = { a: number; b: number; rhs: number; kind: '<=' | '>=' };
/** Vertex enumeration: intersect every pair of boundary lines (including the axes), keep feasible points. */
function vertices(cs: Constraint[]): [number, number][] {
  const lines: Constraint[] = [...cs, { a: 1, b: 0, rhs: 0, kind: '>=' }, { a: 0, b: 1, rhs: 0, kind: '>=' }];
  const out: [number, number][] = [];
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const p = lines[i]!, q = lines[j]!; const det = p.a * q.b - q.a * p.b; if (Math.abs(det) < 1e-12) continue;
    const x = (p.rhs * q.b - q.rhs * p.b) / det, y = (p.a * q.rhs - q.a * p.rhs) / det;
    if (x < -1e-9 || y < -1e-9) continue;
    if (cs.every(c => (c.kind === '<=' ? c.a * x + c.b * y <= c.rhs + 1e-9 : c.a * x + c.b * y >= c.rhs - 1e-9))) out.push([x, y]);
  }
  return out;
}
/** A plain tableau simplex for max c.x subject to A x <= b, b >= 0 (independent of the batch). Returns tableaux per iteration. */
function simplex(c: number[], A: number[][], rhs: number[]) {
  const m = A.length, n = c.length; const T: number[][] = [];
  T.push([...c.map(v => -v), ...Array(m).fill(0), 0]);
  for (let i = 0; i < m; i++) T.push([...A[i]!, ...Array.from({ length: m }, (_, k) => (k === i ? 1 : 0)), rhs[i]!]);
  const history: number[][][] = [T.map(r => [...r])]; const basis = Array.from({ length: m }, (_, i) => n + i);
  for (let guard = 0; guard < 20; guard++) {
    const z = T[0]!; let col = -1, best = -1e-12; for (let j = 0; j < n + m; j++) if (z[j]! < best) { best = z[j]!; col = j; }
    if (col < 0) break;
    let row = -1, br = Infinity; for (let i = 1; i <= m; i++) { const e = T[i]![col]!; if (e > 1e-12) { const r = T[i]![n + m]! / e; if (r < br - 1e-12) { br = r; row = i; } } }
    const piv = T[row]![col]!; T[row] = T[row]!.map(v => v / piv);
    for (let i = 0; i <= m; i++) if (i !== row) { const f = T[i]![col]!; T[i] = T[i]!.map((v, k) => v - f * T[row]![k]!); }
    basis[row - 1] = col; history.push(T.map(r => [...r]));
  }
  return { T, basis, history };
}

test('ABM U08 formulation, corner points and optimum of the loan problem', () => {
  const cs: Constraint[] = [{ a: 3, b: 2, rhs: 120, kind: '<=' }, { a: 1, b: 2, rhs: 60, kind: '<=' }];
  const vs = vertices(cs); assert.equal(vs.length, 4);
  const z = (v: [number, number]) => 4 * v[0] + 3 * v[1]; const values = vs.map(z).sort((p, q) => p - q);
  assert.deepEqual(values.map(v => Math.round(v)), [0, 90, 160, 165]);
  const best = vs.reduce((p, q) => (z(q) > z(p) ? q : p)); near(best[0], 30); near(best[1], 15); near(z(best), 165);
  assert.equal(3 * 30 + 2 * 15, 120); assert.equal(30 + 2 * 15, 60);
  const t = shown('D009'); for (const p of ['(0, 0), (40, 0), (0, 30)', '2x = 60, x = 30, y = 15', '120; 60', '0; 160; 90; 165']) assert.ok(t.includes(p), p);
});

test('ABM U08 D010: simplex tableaux and shadow prices match an independent solver', () => {
  const { T, basis, history } = simplex([4, 3], [[3, 2], [1, 2]], [120, 60]);
  assert.equal(history.length, 3); near(history[1]![0]![4]!, 160); near(history[2]![0]![4]!, 165);
  const rowOf = (j: number) => T[basis.indexOf(j) + 1]!; near(rowOf(0)[4]!, 30); near(rowOf(1)[4]!, 15);
  near(T[0]![2]!, 1.25); near(T[0]![3]!, 0.25); // shadow prices of the two constraints
  near(history[1]![0]![1]!, -1 / 3); near(history[1]![0]![2]!, 4 / 3); near(history[1]![2]![1]!, 4 / 3);
  near(history[2]![1]![2]!, 0.5); near(history[2]![1]![3]!, -0.5);
  // dual check: 120 u + 60 v = 165 with 3u + v = 4 and 2u + 2v = 3
  near(120 * 1.25 + 60 * 0.25, 165); near(3 * 1.25 + 0.25, 4); near(2 * 1.25 + 2 * 0.25, 3);
  const t = shown('D010'); for (const p of ['s1 = 120, s2 = 60, Z = 0', '40; 60, so s1 leaves', 'Z = 160', '60; 15, so s2 leaves', 'Z = 165', 'x = 30, y = 15, Z = 165']) assert.ok(t.includes(p), p);
});

test('ABM U08 D011: slack, shadow prices and capacity change', () => {
  near(120 - (3 * 30 + 2 * 15), 0); near(60 - (30 + 2 * 15), 0); near(40 - 15, 25); near(8 * 1.25, 10);
  // add 8 officer-hours: the same two constraints stay binding, so profit rises by exactly 10
  const vs = vertices([{ a: 3, b: 2, rhs: 128, kind: '<=' }, { a: 1, b: 2, rhs: 60, kind: '<=' }, { a: 0, b: 1, rhs: 40, kind: '<=' }]);
  near(Math.max(...vs.map(v => 4 * v[0] + 3 * v[1])), 175);
  // the cap on vehicle loans does not bind: raising it changes nothing
  const vs2 = vertices([{ a: 3, b: 2, rhs: 120, kind: '<=' }, { a: 1, b: 2, rhs: 60, kind: '<=' }, { a: 0, b: 1, rhs: 50, kind: '<=' }]); near(Math.max(...vs2.map(v => 4 * v[0] + 3 * v[1])), 165);
  const t = shown('D011'); for (const p of ['0, scarce', '25, abundant', '5/4 = 1.25; 1/4 = 0.25; 0', 'Z rises by 10']) assert.ok(t.includes(p), p);
});

test('ABM U08 courseware examples: graphical (as corrected) and bats and chess sets', () => {
  const cs: Constraint[] = [{ a: 3, b: 1, rhs: 10, kind: '<=' }, { a: 1, b: 1, rhs: 4, kind: '<=' }, { a: 1, b: 4, rhs: 12, kind: '<=' }];
  const vs = vertices(cs); const z = (v: [number, number]) => 1000 * v[0] + 2000 * v[1]; const best = vs.reduce((p, q) => (z(q) > z(p) ? q : p));
  near(best[0], 4 / 3); near(best[1], 8 / 3); near(z(best), 6666.667, 1e-3); assert.equal(vs.length, 5);
  const s = simplex([2, 4], [[4, 6], [2, 6], [0, 1]], [120, 72, 10]);
  assert.deepEqual(s.history.map(h => Math.round(h[0]![5]! * 1e6) / 1e6), [0, 40, 52, 64]); // three iterations: Z = 40, 52, 64
  near(s.T[s.basis.indexOf(0) + 1]![5]!, 24); near(s.T[s.basis.indexOf(1) + 1]![5]!, 4);
  const slacks = [2, 3, 4].map(j => (s.basis.includes(j) ? s.T[s.basis.indexOf(j) + 1]![5]! : 0)); assert.deepEqual(slacks, [0, 0, 6]); // m = 0, n = 0, p = 6: the unused capacity is the third workshop
});

test('ABM U08 numerical questions: expected answers recomputed and graded', () => {
  const min = vertices([{ a: 1, b: 1, rhs: 8, kind: '>=' }, { a: 1, b: 0, rhs: 2, kind: '>=' }, { a: 0, b: 1, rhs: 1, kind: '>=' }]);
  assert.deepEqual(min.map(v => v.map(Math.round)).sort(), [[2, 6], [7, 1]]); const mc = Math.min(...min.map(v => 5 * v[0] + 4 * v[1]));
  const cases: [string, number, string][] = [
    ['D025', 4 * 20 + 3 * 20, '140'], ['D026', 30, '30'], ['D027', 165, '165'], ['D028', 120 - (3 * 20 + 2 * 20), '20'], ['D029', Math.min(120 / 3, 60 / 1), '40'],
    ['D030', 4 * 40, '160'], ['D031', mc, '34'], ['D032', 8 * 1.25, '10'], ['D033', 3, '3'],
  ];
  near(((3 * 30 + 2 * 15) - 120) + 0, 0);
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-9); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM U08 choice questions; card self-checks; all drafts unreviewed', () => {
  for (let n = 12; n <= 24; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  near(120 / 3, 40); near(60 / 1, 60); assert.equal(Math.min(120 / 3, 60 / 1), 40);
  assert.equal(b.items.length, 33);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
