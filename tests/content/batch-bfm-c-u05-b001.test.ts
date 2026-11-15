// Structure and calculation checks for batch BFM-C-U05-B001 (treasury risk management: VaR worst rates and scaling, parametric VaR, current yield, YTM, bond price, Macaulay and modified duration, price change, portfolio duration, stop-loss and carry items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-C-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const rd = (x: number, d: number) => Math.round(x * 10 ** d + 1e-9) / 10 ** d;
const price = (cf: number[], y: number) => cf.reduce((a, c, i) => a + c / (1 + y) ** (i + 1), 0);
const dur = (cf: number[], y: number) => cf.reduce((a, c, i) => a + (i + 1) * c / (1 + y) ** (i + 1), 0) / price(cf, y);

test('BFM C U05 B001: risk figures recompute', () => {
  check('USD/INR spot is Rs 82.00. The overnight VaR at 95', rd(82 + 0.4, 2), '82.40');
  check('For an exporter selling dollars with the same VaR', rd(82 - 0.4, 2), '81.60');
  check('The overnight VaR of a position is Rs 2 crore', 2 * Math.sqrt(9), '6');
  check('A position of Rs 50 crore has daily volatility', rd(1.645 * 0.003 * 50, 3), '0.247');
  check('The overnight VaR on a government security yield', rd(7.5 + 0.3, 2), '7.80');
  check('A bond with a coupon of 6 per cent on par Rs 100', rd(6 / 96 * 100, 2), '6.25');
  let lo = 0, hi = 0.2; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (price([5, 105], m) > 98) lo = m; else hi = m; }
  check('A 2-year bond pays an annual coupon of 5 per cent', rd(lo * 100, 2), '6.09');
  const cf = [8, 8, 108];
  check('A 3-year bond with an 8 per cent annual coupon', rd(price(cf, 0.06), 2), '105.35');
  check('For that bond, what is the Macaulay duration', rd(dur(cf, 0.06), 2), '2.79');
  check('Macaulay duration is 2.79 years and the yield', rd(2.789 / 1.06, 2), '2.63');
  check('With a modified duration of 2.63', rd(2.63 * 0.5, 2), '1.32');
  check('A portfolio has bond A', rd(0.6 * 2 + 0.4 * 5, 1), '3.2');
  check('A dealer buys USD 1 million at Rs 82.50', rd(82.5 - 5000 / 1e6, 3), '82.495');
  check('A dealer holds an open long position of USD 3 million', Math.round(3e6 * 83 * 0.05 / 365), '34110');
  // courseware duration example: D 2.5, y 5% -> MD 2.38; 5 bp -> 12 bp
  assert.equal(rd(2.5 / 1.05, 2), 2.38); assert.equal(rd(2.38 * 0.05, 2), 0.12);
  assert.equal(rd(75 - 0.45, 2), 74.55);
});

test('BFM C U05 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 45); assert.equal(b.items.length, 70);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
