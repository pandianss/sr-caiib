// Independent deterministic recomputation for batch ABM-A-U06-B002 (binomial, Poisson, normal, credit risk, VaR, options).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U06-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
// Independent route: probabilities through log-factorials and by repeated Bernoulli enumeration.
const lf = (n: number) => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
const binom = (n: number, p: number, x: number) => Math.exp(lf(n) - lf(x) - lf(n - x) + x * Math.log(p) + (n - x) * Math.log(1 - p));
const binomEnum = (n: number, p: number, x: number) => { let tot = 0; for (let m = 0; m < 2 ** n; m++) { let ones = 0, pr = 1; for (let i = 0; i < n; i++) { const s = (m >> i) & 1; ones += s; pr *= s ? p : 1 - p; } if (ones === x) tot += pr; } return tot; };
const pois = (l: number, x: number) => Math.exp(-l + x * Math.log(l) - lf(x));
const area = (z: number) => { const n = 2000, h = z / n, f = (t: number) => Math.exp(-t * t / 2) / Math.sqrt(2 * Math.PI); let s = f(0) + f(z); for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2); return s * h / 3; };

test('ABM U06 courseware examples (binomial, Poisson, normal, credit risk, VaR) reproduce', () => {
  let k = 0; for (let x = 2; x <= 6; x++) k += binomEnum(8, 0.5, x); near(k, 119 / 128);
  const m = 60 * 0.7, v = 60 * 0.7 * 0.3; near(m, 42); near(v, 12.6); near(Math.sqrt(v), 3.55, 5e-3); assert.equal(Math.floor(61 * 0.7), 42);
  near((1 - 1.4) ** 2 / (60 * 0.7 * 0.3), 0.0127, 5e-4); near(3 + (1 - 6 * 0.21) / 12.6, 2.98, 5e-3);
  near(pois(1.8, 4), 0.0723, 5e-5); near(1 - pois(1.8, 0) - pois(1.8, 1), 0.5372, 5e-5); // the courseware prints 0.538
  near(pois(0.5, 0) + pois(0.5, 1), 0.9098, 5e-5); near(1 - pois(0.5, 0) - pois(0.5, 1) - pois(0.5, 2), 0.0144, 5e-5); near(pois(0.5, 0) ** 3, 0.223, 5e-4);
  near(pois(1.2, 2), 0.217, 5e-4); near(pois(12, 5), 0.0127, 5e-5);
  near(area(2.5) + area(1), 0.8351, 5e-4); near(0.5 + area(2), 0.9772, 5e-4); near(0.5 - area(1), 0.1587, 5e-5); near(area(5 / 3) - area(1), 0.1112, 5e-4);
  assert.equal(0.2 * 3_500_000 / 100 * 0.43, 3010); near(0.002 * 3_500_000 * 0.57, 3990); near(1.0 * 2_000_000 * (1 - 0.5), 1_000_000);
  near((0.1 - 1.65 * 0.12) * 30000, -2940); near((0.15 - 2.33 * 0.1) * 250000, -20750);
});

test('ABM U06 D012: ten loans, binomial (enumeration cross-check)', () => {
  near(binom(10, 0.2, 2), binomEnum(10, 0.2, 2), 1e-12); near(binom(10, 0.2, 2), 0.30199, 5e-5);
  const p01 = binom(10, 0.2, 0) + binom(10, 0.2, 1); near(p01, 0.37581, 5e-5);
  near(10 * 0.2, 2); near(10 * 0.2 * 0.8, 1.6); assert.equal(Math.floor(11 * 0.2), 2);
  const t = shown('D012'); for (const s of ['45', '0.3020', '0.1074; 0.2684', '0.3758', '2; 1.6', '2']) assert.ok(t.includes(s), s);
});

test('ABM U06 D013: weekly failed transactions, Poisson', () => {
  const p0 = pois(2.5, 0), p1 = pois(2.5, 1), p2 = pois(2.5, 2);
  near(p0, 0.082085, 1e-6); near(p0 + p1, 0.287297, 1e-6); near(1 - p0 - p1 - p2, 0.456187, 1e-5); assert.equal(Math.floor(2.5), 2);
  const t = shown('D013'); for (const s of ['0.0821', '0.2873', '0.4562', '0.2565']) assert.ok(t.includes(s), s);
});

test('ABM U06 D014: cash demand, normal', () => {
  near(area(1.5), 0.4332, 5e-5); near(area(1), 0.3413, 5e-5); near(area(2), 0.4772, 5e-5);
  near(0.3413 + 0.4332, 0.7745); near(0.5 - 0.4772, 0.0228); near(250 * 0.0228, 5.7);
  assert.deepEqual([160, 260, 280].map(x => (x - 200) / 40), [-1, 1.5, 2]);
  const t = shown('D014'); for (const s of ['-1; 1.5; 2', '0.7745', '0.0228', '5.7']) assert.ok(t.includes(s), s);
});

test('ABM U06 D015 to D017: expected loss, VaR, option bounds', () => {
  near(0.02 * (1 - 0.55) * 4_000_000, 36000); near(0.45 * 4_000_000, 1_800_000); near(0.04 * 0.45 * 4_000_000, 72000);
  near((0.01 - 1.65 * 0.04) * 500000, -28000); near((0.01 - 2.33 * 0.04) * 500000, -41600);
  near(100 / 1.05, 95.2381, 5e-4); near(Math.max(0, 120 - 100 / 1.05), 24.7619, 5e-4); assert.equal(Math.max(0, 100 / 1.05 - 120), 0);
  for (const [id, parts] of [['D015', ['0.45', 'Rs 36,000', 'Rs 18,00,000']], ['D016', ['-0.056', '28,000', '-0.0832', '41,600']], ['D017', ['95.24', '24.76', '0']]] as [string, string[]][]) { const t = shown(id); for (const s of parts) assert.ok(t.includes(s), `${id}: ${s}`); }
});

test('ABM U06 numerical questions: expected answers recomputed and graded', () => {
  const cases: [string, number, string][] = [
    ['D032', binomEnum(5, 0.5, 3), '0.3125'], ['D033', 40 * 0.15, '6'], ['D034', 40 * 0.15 * 0.85, '5.1'], ['D035', 0.9 ** 4, '0.6561'], ['D036', Math.floor(16 * 0.3), '4'],
    ['D037', pois(3, 0), '0.0498'], ['D038', pois(2, 2), '0.2707'], ['D039', 1 - pois(0.5, 0), '0.3935'], ['D040', (260 - 200) / 40, '1.50'], ['D041', 0.5 - 0.4772, '0.0228'],
    ['D042', 0.015 * 0.4 * 2_000_000, '12000'], ['D043', 0.05 * (1 - 0.75) * 1_000_000, '12500'], ['D044', -((0.06 - 1.65 * 0.05) * 200000), '4500'], ['D045', Math.max(0, 70 - 62), '8'], ['D046', Math.max(0, 100 - 88), '12'],
  ];
  near(area(2), 0.4772, 5e-5);
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 5e-5 + (Number(expected) > 100 ? 1e-6 * Number(expected) : 0)); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  // none of the 4-decimal answers is a rounding tie
  for (const v of [pois(3, 0), pois(2, 2), 1 - pois(0.5, 0)]) assert.ok(Math.abs((v * 1e4) % 1 - 0.5) > 1e-3, String(v));
  assert.equal(Math.floor(2.5), 2); near(2 * 0.0498, 0.0996, 1e-3); assert.equal(1.5 * 40 + 200, 260);
});

test('ABM U06 choice questions and card self-checks; all drafts unreviewed', () => {
  for (let n = 18; n <= 31; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  assert.equal(Math.floor(11 * 0.2), 2); near(10 * 0.2 * 0.8, 1.6); assert.equal(10 * 0.5, 5); near(0.05 * 0.25 * 1_000_000, 12500);
  near((0.06 - 1.65 * 0.05) * 200000, -4500); near(120 - 100 / 1.05, 24.76, 5e-3); near(2 * 2.5, 5);
  // the binomial with n = 9, p = 0.5 has two modes, 4 and 5
  const pm = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => binom(9, 0.5, x)); near(pm[4] ?? 0, pm[5] ?? 1, 1e-12); assert.ok((pm[4] ?? 0) > (pm[3] ?? 1));
  // negative skew when p > 0.5: third central moment of the binomial n = 60, p = 0.7 is n p q (q - p) < 0
  assert.ok(60 * 0.7 * 0.3 * (0.3 - 0.7) < 0);
  assert.equal(b.items.length, 46);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
