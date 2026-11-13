// Independent deterministic recomputation for batch ABM-A-U07-B001 (estimation).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0);
const area = (z: number) => { const n = 2000, h = z / n, f = (t: number) => Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI); let s = f(0) + f(z); for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
const variance = (xs: number[], div: number) => { const m = sum(xs) / xs.length; return sum(xs.map(x => (x - m) ** 2)) / div; };

test('ABM U07 courseware examples and multipliers reproduce', () => {
  near(10 / Math.sqrt(200), 0.707, 5e-4); near(36 - 0.707, 35.293, 1e-3); near(36 + 2 * 0.707, 37.414, 1e-3); near(36 - 3 * 0.707, 33.879, 1e-3);
  near(2 * area(1), 0.683, 5e-4); near(2 * area(2), 0.955, 1e-3); near(2 * area(3), 0.997, 5e-4);
  near(2 * area(1.64), 0.90, 2e-3); near(2 * area(1.96), 0.95, 1e-3); near(2 * area(2.58), 0.99, 1e-3);
  near(6 / Math.sqrt(100), 0.6); near(21 - 1.96 * 0.6, 19.82, 5e-3); near(21 + 1.96 * 0.6, 22.18, 5e-3);
  near((950 / Math.sqrt(50)) * Math.sqrt(650 / 699), 129.57, 0.03); near(11800 - 1.64 * 129.57, 11587.5, 0.1); near(11800 + 1.64 * 129.57, 12012.5, 0.1);
  const se = Math.sqrt(0.4 * 0.6 / 75); near(se, 0.0566, 5e-4); near(0.4 - 2.58 * 0.057, 0.253, 5e-4); near(0.4 + 2.58 * 0.057, 0.547, 5e-4); near(0.4 - 2.58 * se, 0.2540, 5e-4); near(0.4 + 2.58 * se, 0.5460, 5e-4);
  const sample = [4.33, 4.37, 4.36, 4.32, 4.37]; near(sum(sample) / 5, 4.35, 1e-9); near(variance(sample, 4), 0.00055, 1e-9);
  near(Math.sqrt(1228 / 34), 6.01, 5e-3); assert.equal(3570 / 35, 102);
});

test('ABM U07 D009: six processing times, divisor n - 1 and divisor n', () => {
  const xs = [4, 6, 7, 9, 10, 12]; assert.equal(sum(xs) / 6, 8); assert.equal(sum(xs.map(x => (x - 8) ** 2)), 42);
  near(variance(xs, 5), 8.4); near(Math.sqrt(8.4), 2.898, 5e-4); near(variance(xs, 6), 7.0);
  const t = shown('D009'); for (const p of ['-4, -2, -1, 1, 2, 4', '42', '8.4', '2.90', '7.0']) assert.ok(t.includes(p), p);
});

test('ABM U07 D010: intervals at four confidence levels', () => {
  const se = 4 / Math.sqrt(64); near(se, 0.5);
  const fmt = (z: number) => `${(18 - z * se).toFixed(2)} to ${(18 + z * se).toFixed(2)}`;
  assert.equal(fmt(1.64), '17.18 to 18.82'); assert.equal(fmt(1.96), '17.02 to 18.98'); assert.equal(fmt(2.58), '16.71 to 19.29'); assert.equal(fmt(1), '17.50 to 18.50');
  const t = shown('D010'); for (const p of ['0.5 day', '17.5 to 18.5', '17.18 to 18.82', '17.02 to 18.98', '16.71 to 19.29']) assert.ok(t.includes(p), p);
});

test('ABM U07 D011: finite population, sigma unknown', () => {
  const se0 = 3000 / Math.sqrt(100); const fpm = Math.sqrt((800 - 100) / (800 - 1)); near(fpm, 0.93600, 5e-6); const se = se0 * fpm; near(se, 280.79, 0.01);
  const m = 1.64 * se; near(m, 460.5, 0.05); assert.ok(100 / 800 > 0.05);
  const t = shown('D011'); for (const p of ['300', '0.9360', se.toFixed(2), m.toFixed(2), `${(24000 - m).toFixed(2)} and ${(24000 + m).toFixed(2)}`]) assert.ok(t.includes(p), p);
});

test('ABM U07 D012 and D013: proportion interval and sample-size effect', () => {
  const pb = 18 / 200; near(pb, 0.09); near(200 * pb, 18); near(200 * (1 - pb), 182);
  const se = Math.sqrt(pb * (1 - pb) / 200); near(se, 0.020237, 5e-6); const m = 1.96 * se; near(m, 0.03967, 5e-5); near(pb - m, 0.0503, 5e-5); near(pb + m, 0.1297, 5e-5);
  const t = shown('D012'); for (const p of ['18 and 182', se.toFixed(4), m.toFixed(4), `${(pb - m).toFixed(4)} to ${(pb + m).toFixed(4)}`]) assert.ok(t.includes(p), p);
  assert.deepEqual([36, 144, 576].map(n => 12 / Math.sqrt(n)), [2, 1, 0.5]); assert.deepEqual([2, 1, 0.5].map(s => 1.96 * s), [3.92, 1.96, 0.98]);
  const u = shown('D013'); for (const p of ['2; 1; 0.5', '3.92; 1.96; 0.98']) assert.ok(u.includes(p), p);
});

test('ABM U07 numerical questions: expected answers recomputed and graded', () => {
  const f = [12, 15, 18, 21, 24];
  const cases: [string, number, string][] = [
    ['D026', sum(f) / 5, '18'], ['D027', variance(f, 4), '22.5'], ['D028', 9 / 60, '0.15'], ['D029', 12 / Math.sqrt(36), '2'], ['D030', 50 + 1.96 * 2, '53.92'], ['D031', 50 - 1.64 * 2, '46.72'],
    ['D032', (60 / Math.sqrt(25)) * Math.sqrt(75 / 99), '10.44'], ['D033', Math.sqrt(0.4 * 0.6 / 100), '0.0490'], ['D034', 0.3 + 2.58 * 0.04, '0.4032'], ['D035', 2 * 1.96 * 0.5, '1.96'], ['D036', 100 * 2 * area(2), '95.5'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), id === 'D036' ? 0.06 : id === 'D032' ? 5e-3 : 5e-5); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  near(Math.sqrt(0.0024), 0.04899, 5e-6); near((60 / 5) * Math.sqrt(75 / 99), 10.4446, 5e-4); // not ties at the asked precision
});

test('ABM U07 choice questions, card self-checks; all drafts unreviewed', () => {
  for (let n = 14; n <= 25; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  near(90 / 4, 22.5); near(Math.sqrt(0.4 * 0.6 / 100), 0.049, 1e-3); near(1.96 * 12 / 6, 3.92); near(50 - 3.92, 46.08); near(Math.sqrt(75 / 99), 0.8704, 5e-5); assert.equal(100 * 0.05 < 25, true);
  assert.equal(40 * 0.05, 2); assert.equal(Math.round(40 * 0.95), 38);
  assert.equal(b.items.length, 36);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
