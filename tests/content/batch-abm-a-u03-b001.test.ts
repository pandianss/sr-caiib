// Independent deterministic recomputation for batch ABM-A-U03-B001 (central tendency, dispersion, skewness, kurtosis).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0);

// grouped table used by D016 to D019
const marks = [2.5, 7.5, 12.5, 17.5, 22.5]; const freq = [12, 20, 40, 36, 12]; const N = sum(freq);
const cf = freq.map((_, i) => sum(freq.slice(0, i + 1)));
const quant = (target: number, lows = [0, 5, 10, 15, 20]) => { const i = cf.findIndex(c => c > target); const before = i ? cf[i - 1] ?? 0 : 0; return (lows[i] ?? 0) + ((target - before) / (freq[i] ?? 1)) * 5; };
const mean = sum(marks.map((m, i) => m * (freq[i] ?? 0))) / N;

test('ABM U03 D013: combined and corrected means', () => {
  const totals = [40 * 32000, 25 * 54000, 15 * 80000]; assert.deepEqual(totals, [1280000, 1350000, 1200000]);
  assert.equal(sum(totals), 3830000); assert.equal(sum(totals) / 80, 47875);
  assert.equal((sum(totals) - 80000 + 98000) / 80, 48100); near((32000 + 54000 + 80000) / 3, 55333.333333, 1e-3);
  const t = shown('D013'); for (const s of ['47,875', '48,100', '38,30,000', '38,48,000']) assert.ok(t.includes(s), s);
  assert.equal((2000 - 90 + 60) / 50, 39.4);
});

test('ABM U03 D014: missing frequency', () => {
  const x = (22 * 30 - 570) / (25 - 22); assert.equal(x, 30);
  assert.equal((8 * 5 + 12 * 15 + 30 * 25 + 10 * 35) / (8 + 12 + 30 + 10), 22); assert.equal(570 / 30, 19);
});

test('ABM U03 D015: geometric and harmonic means, AM x HM = GM squared', () => {
  near(1.0 * 1.1 * 1.21, 1.331); near(Math.cbrt(1.331), 1.1); near((0 + 10 + 21) / 3, 10.3333333, 1e-6);
  near(2 / (1 / 40 + 1 / 60), 48); assert.equal(50 * 48, 2400); assert.equal(40 * 60, 2400);
  near(Math.sqrt(1.2 * 1.05), 1.1224972, 1e-6);
  for (const xs of [[40, 60], [2, 4, 8], [1, 9, 3]]) {
    const am = sum(xs) / xs.length, gm = xs.reduce((a, c) => a * c, 1) ** (1 / xs.length), hm = xs.length / sum(xs.map(x => 1 / x));
    assert.ok(am > gm && gm > hm);
  }
  assert.equal(64 / 16, 4); // the courseware's AM 16, GM 8 example
});

test('ABM U03 D016 to D019: grouped median, quartiles, mode, mean, deviations, variance', () => {
  assert.equal(N, 120); assert.deepEqual(cf, [12, 32, 72, 108, 120]);
  near(quant(60), 13.5); near(quant(30), 9.5); near(quant(90), 17.5);
  const mode = 10 + ((40 - 20) / (2 * 40 - 20 - 36)) * 5; near(mode, 14.1666667, 1e-6);
  near(mean, 13.1666667, 1e-6); near(3 * 13.5 - 2 * mean, mode, 1e-9);
  assert.equal(sum(marks.map((m, i) => m * (freq[i] ?? 0))), 1580);
  near((17.5 - 9.5) / 2, 4); near(8 / 27, 0.296296, 1e-6);
  const dev = marks.map(m => Math.abs(m - mean)); const fd = dev.map((d, i) => d * (freq[i] ?? 0));
  near(sum(fd), 536, 1e-9); near(sum(fd) / N, 4.466667, 1e-6); near(sum(fd) / N / mean, 0.339241, 1e-6);
  const sq = sum(marks.map((m, i) => m * m * (freq[i] ?? 0))); assert.equal(sq, 24550);
  const variance = sq / N - mean * mean; near(variance, 31.22222, 1e-4); near(Math.sqrt(variance), 5.58769, 1e-4); near(Math.sqrt(variance) / mean * 100, 42.44, 5e-3);
  near(30 / 200 * 100, 15); near(20 / 80 * 100, 25);
  const expectations: [string, string[]][] = [['D016', ['12, 32, 72, 108, 120', '13.5', '9.5', '17.5']], ['D017', ['14.1667', '13.1667']], ['D018', ['4.0', '0.2963', '536', '4.4667', '0.3392']], ['D019', ['204.5833', '173.3611', '31.2222', '5.59', '42.44']]];
  for (const [id, parts] of expectations) { const t = shown(id); for (const p of parts) assert.ok(t.includes(p), `${id}: ${p}`); }
});

test('ABM U03 D020: central moments, skewness and kurtosis', () => {
  const xs = [2, 4, 6, 8, 20]; const m = sum(xs) / 5; assert.equal(m, 8);
  const mu = (k: number) => sum(xs.map(x => (x - m) ** k)) / 5;
  assert.equal(mu(2), 40); assert.equal(mu(3), 288); near(mu(4), 4460.8, 1e-9);
  near(mu(3) ** 2 / mu(2) ** 3, 1.296, 1e-9); near(mu(4) / mu(2) ** 2, 2.788, 1e-9);
  assert.equal(xs[2], 6); // median
  // courseware Example 32: the standard result is 2.5, not the printed 0.025
  const mk = [5, 15, 25, 35, 45], fr = [10, 20, 40, 20, 10]; const mm = sum(mk.map((x, i) => x * (fr[i] ?? 0))) / 100; assert.equal(mm, 25);
  const m2 = sum(mk.map((x, i) => (fr[i] ?? 0) * (x - mm) ** 2)) / 100, m4 = sum(mk.map((x, i) => (fr[i] ?? 0) * (x - mm) ** 4)) / 100;
  assert.equal(m2, 120); assert.equal(m4, 36000); assert.equal(m4 / m2 ** 2, 2.5); near(3600000 / 12000 ** 2, 0.025);
  const t = shown('D020'); for (const p of ['288', '4,460.8', '1.296; 2.788']) assert.ok(t.includes(p), p);
});

test('ABM U03 numerical questions: expected answers recomputed and graded', () => {
  const med = 20 + ((25 - 20) / 20) * 10; const mode = 20 + ((18 - 11) / (36 - 11 - 8)) * 10;
  const data = [3, 5, 5, 5, 6, 6, 8, 10]; const mu = sum(data) / 8; const sd = Math.sqrt(sum(data.map(x => (x - mu) ** 2)) / 8);
  const cases: [string, number, string][] = [
    ['D037', 8 * 50 - (45 + 52 + 38 + 60 + 41 + 55 + 47), '62'], ['D038', (60 * 18000 + 40 * 28000) / 100, '22000'], ['D039', Math.cbrt(2 * 4 * 8), '4'],
    ['D040', 2 / (1 / 30 + 1 / 45), '36'], ['D041', med, '22.50'], ['D042', mode, '24.12'], ['D043', 3 * 36 - 2 * 40, '28'],
    ['D044', (60 - 20) / (60 + 20), '0.50'], ['D045', sd, '2'], ['D046', 12 / 80 * 100, '15'], ['D047', (90 - 30) / (90 + 30), '0.50'],
  ];
  near(mode, 24.117647, 1e-6); // 24.1176 rounds to 24.12: not a tie at 2 decimals
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 5e-3); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  assert.equal(mu, 6);
});

test('ABM U03 choice questions: four distinct options, one correct; all drafts unreviewed', () => {
  for (let n = 21; n <= 36; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  near(18 / 120 * 100, 15); near(12 / 60 * 100, 20); // the CV comparison question
  assert.equal(b.items.length, 47);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
