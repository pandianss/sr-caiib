// Independent deterministic recomputation for batch ABM-A-U06-B001 (probability foundations).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0);
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const comb = (n: number, r: number) => fact(n) / (fact(r) * fact(n - r));
const perm = (n: number, r: number) => fact(n) / fact(n - r);
/** All r-element subsets of 0..n-1 (independent of the closed formula). */
const subsets = (n: number, r: number): number[][] => { const out: number[][] = []; const rec = (start: number, cur: number[]) => { if (cur.length === r) { out.push([...cur]); return; } for (let i = start; i < n; i++) rec(i + 1, [...cur, i]); }; rec(0, []); return out; };
const permutations = <T,>(xs: T[]): T[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p])));

test('ABM U06 counting facts and the courseware examples', () => {
  assert.equal(comb(5, 3), 10); assert.equal(comb(7, 3) * comb(6, 4), 525); assert.equal(perm(8, 3), 336); assert.equal(perm(8, 3), fact(3) * comb(8, 3));
  assert.equal(subsets(8, 3).length, comb(8, 3)); assert.equal(comb(8, 3), 56); assert.equal(perm(6, 2), 30);
  near(comb(10, 2) / comb(21, 2), 0.2143, 5e-5); assert.equal(comb(21, 2), 210);
  assert.equal(fact(6), 720); assert.equal(fact(5) * 2, 240); assert.equal(720 - 240, 480); assert.equal(fact(4) * 2, 48);
  near(26 / 52 + 12 / 52 - 6 / 52, 8 / 13); near(0.2 * 0.4, 0.08); near(0.2 + 0.4 - 0.08, 0.52); near(1 - 0.52, 0.48); near(1 / 3, 1 / (2 + 1)); near(0.6 / 0.8, 0.75);
  const k = (1 - 0.1) / 3; near(k, 0.3); const f = [k, k, k + 0.1]; const e = f[1]! + 2 * f[2]!; near(e, 1.1); near(f[1]! + 4 * f[2]! - e * e, 0.69);
  const g = [0.3, 0.5, 0.2]; const e2 = sum(g.map((p, i) => (i + 1) * p)); near(e2, 1.9); near(sum(g.map((p, i) => (i + 1) ** 2 * p)), 4.1); near(Math.sqrt(4.1 - e2 * e2), 0.7); near(2 * e2 + 3, 6.8);
  assert.equal(36, 6 * 6);
});

test('ABM U06 D009: panel of 3 from 5 officers and 4 clerks, by enumeration', () => {
  const people = [0, 0, 0, 0, 0, 1, 1, 1, 1]; // 1 = clerk
  const all = subsets(9, 3); const fav = all.filter(s => s.filter(i => people[i] === 1).length === 2);
  assert.equal(all.length, 84); assert.equal(fav.length, 30); near(fav.length / all.length, 5 / 14); assert.equal((fav.length / all.length).toFixed(4), '0.3571');
  const t = shown('D009'); for (const p of ['84', '30', '0.3571']) assert.ok(t.includes(p), p);
});

test('ABM U06 D010: two loan files adjacent among five, by enumeration', () => {
  const perms = permutations([0, 1, 2, 3, 4]); const adjacent = perms.filter(p => Math.abs(p.indexOf(0) - p.indexOf(1)) === 1);
  assert.equal(perms.length, 120); assert.equal(adjacent.length, 48); near(adjacent.length / 120, 0.4); near(1 - 0.4, 0.6);
  const t = shown('D010'); for (const p of ['120', '24 x 2 = 48', '0.4', '0.6']) assert.ok(t.includes(p), p);
});

test('ABM U06 D011: savings and loans', () => {
  near(0.6 + 0.3 - 0.2, 0.7); near(1 - 0.7, 0.3); near(0.2 / 0.6, 1 / 3); near(0.6 * 0.3, 0.18); assert.notEqual(0.18, 0.2);
  const t = shown('D011'); for (const p of ['0.7', '0.3', '0.3333', '0.18 is not 0.20']) assert.ok(t.includes(p), p);
});

test('ABM U06 D012: total probability of rejection', () => {
  near(0.6 * 0.1 + 0.4 * 0.2, 0.14); near((0.1 + 0.2) / 2, 0.15);
  const t = shown('D012'); for (const p of ['0.06', '0.08', '0.14']) assert.ok(t.includes(p), p);
});

test('ABM U06 D013: expectation, variance, linear payoff, missing k and CDF', () => {
  const p = [0.4, 0.3, 0.2, 0.1]; const e = sum(p.map((q, x) => x * q)); const e2 = sum(p.map((q, x) => x * x * q));
  near(e, 1.0); near(e2, 2.0); near(e2 - e * e, 1.0); near(500 * e + 100, 600); near(500 * Math.sqrt(1), 500); near(500 ** 2 * 1, 250000);
  const k = (1 - 0.5) / 5; near(k, 0.1); const q = [2 * k, 3 * k, 0.5]; near(sum(q), 1); const m = sum(q.map((v, x) => x * v)); near(m, 1.3);
  near(sum(q.map((v, x) => x * x * v)), 2.3); near(2.3 - m * m, 0.61); let c = 0; assert.deepEqual(q.map(v => Math.round((c += v) * 10) / 10), [0.2, 0.5, 1]);
  const t = shown('D013'); for (const s of ['1.0', '2.0', 'Rs 600; Rs 500', 'k = 0.1', '1.3; 2.3; 0.61', '0.2, 0.5, 1.0']) assert.ok(t.includes(s), s);
});

test('ABM U06 numerical questions: expected answers recomputed and graded', () => {
  let sevens = 0; for (let a = 1; a <= 6; a++) for (let d = 1; d <= 6; d++) if (a + d === 7) sevens++;
  let atLeastOneHead = 0; for (let m = 0; m < 8; m++) if (m !== 0) atLeastOneHead++;
  const x = [10, 20, 30], pr = [0.2, 0.5, 0.3]; const ex = sum(x.map((v, i) => v * (pr[i] ?? 0))); const ex2 = sum(x.map((v, i) => v * v * (pr[i] ?? 0)));
  const cases: [string, number, string][] = [
    ['D026', comb(8, 3), '56'], ['D027', perm(6, 2), '30'], ['D028', sevens / 36, '0.1667'], ['D029', atLeastOneHead / 8, '0.875'], ['D030', 0.5 + 0.4 - 0.2, '0.70'],
    ['D031', 0.3 / 0.5, '0.60'], ['D032', 0.3 + 0.5 - 0.3 * 0.5, '0.65'], ['D033', 2 / (3 + 2), '0.40'], ['D034', ex, '21'], ['D035', ex2 - ex * ex, '49'], ['D036', 2 * ex + 3, '45'], ['D037', 9 * (ex2 - ex * ex), '441'],
  ];
  assert.equal(sevens, 6); near(ex2, 490);
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 5e-5); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  near(1 / 6, 0.16667, 1e-5); // 0.1667 is not a tie at 4 decimals
});

test('ABM U06 choice questions: four distinct options, one correct; card self-checks; all drafts', () => {
  for (let n = 14; n <= 25; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  const probTable = (t: number[]) => t.every(v => v >= 0) && Math.abs(sum(t) - 1) < 1e-9;
  assert.deepEqual([[0.2, 0.3, 0.4, 0.3], [0.5, 0.3, 0.4, -0.2], [0.1, 0.4, 0.3, 0.1], [0.1, 0.4, 0.3, 0.2]].map(probTable), [false, false, false, true]);
  assert.equal(sum([0.5, 0.4, 0.3]) > 1, true); near(2 / 5, 0.4);
  const monotone = (t: number[]) => t.every((v, i) => i === 0 || v >= (t[i - 1] ?? 0)) && (t.at(-1) ?? 0) === 1 && t.every(v => v >= 0 && v <= 1);
  assert.deepEqual([[0.2, 0.6, 0.5, 1.0], [0.2, 0.5, 0.8, 1.0], [0.3, 0.6, 0.9, 1.2], [0.5, 0.5, 0.5, 0.4]].map(monotone), [false, true, false, false]);
  assert.equal(subsets(2, 1).length, 2); assert.equal(perm(3, 3), 6); assert.equal(fact(0), 1);
  assert.equal(b.items.length, 37);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
