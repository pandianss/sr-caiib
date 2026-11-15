// Structure and calculation checks for batch ABFM-D-U01-B001 (hybrid finance: conversion ratio and price, intrinsic value, Black-Scholes value, convertible value, preference arrears, cost and CRR, FCCB and collar items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-D-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const rd = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
// Standard normal CDF by the Abramowitz-Stegun erf approximation (error below 2e-7).
const erf = (x0: number) => { const s = Math.sign(x0); const x = Math.abs(x0); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
const N = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
const bs = (S: number, E: number, t: number, r: number, sg: number) => { const d1 = (Math.log(S / E) + (r + sg * sg / 2) * t) / (sg * Math.sqrt(t)); const d2 = d1 - sg * Math.sqrt(t); return { d1, d2, c: S * N(d1) - E * Math.exp(-r * t) * N(d2), pvE: E * Math.exp(-r * t) }; };

test('ABFM D U01 B001: hybrid finance figures recompute', () => {
  check('A convertible debenture of face value Rs 600', 600 / 40, '15');
  check('A Rs 100 debenture converts into 8 equity shares', rd(100 / 8, 1), '12.5');
  check('The conversion price of a debenture is Rs 30', (30 - 24) / 24 * 100, '25');
  check('A debenture converts into 15 shares', 15 * 52, '780');
  check('A warrant allows its holder to buy a share at Rs 65', Math.max(90 - 65, 0), '25');
  check('A warrant allows its holder to buy a share at Rs 55', Math.max(40 - 55, 0), '0');
  const w = bs(80, 75, 1, 0.06, 0.30);
  check('A warrant has S = Rs 80, E = Rs 75', rd(w.pvE, 2), '70.63');
  check('For the same warrant (S = Rs 80', rd(w.d1, 2), '0.57');
  check('Using Black-Scholes with the same inputs', rd(w.c, 2), '14.42');
  assert.ok(Math.abs(N(w.d1) - 0.7140) < 5e-4 && Math.abs(N(w.d2) - 0.6045) < 5e-4);
  // A published textbook-style cross-check of the model itself: S=125, E=100, t=0.5, r=8%, sigma=40% gives about 31.85.
  assert.ok(Math.abs(bs(125, 100, 0.5, 0.08, 0.40).c - 31.85) < 0.05);
  check('A company has Rs 50 crore of 8 per cent cumulative', 0.08 * 50 * 3, '12');
  check('A company issues preference shares at Rs 90', 9 / 90 * 100, '10');
  check('A company redeems preference shares of nominal value Rs 50', 50 - 20, '30');
  check('A company issued 2 lakh warrants', 2 * 120, '240');
  const annuity = (1 - 1.10 ** -3) / 0.10; check('A debenture pays interest of Rs 10 a year', rd(10 * annuity + 130 / 1.15 ** 3, 2), '110.35');
  check('A company issues a 5-year FCCB of USD 10 million', rd(10 * (83.5 - 82) / 10, 1), '1.5');
  check('A collared floating rate note has a floor', Math.min(Math.max(12, 7), 11), '11');
});

test('ABFM D U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 52); assert.equal(b.items.length, 82);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 18, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
