// Structure and calculation checks for batch BFM-C-U06-B001 (derivative products: forward rate and premium, opportunity cost, option intrinsic and time value and payoff, futures gain and hedge, T-bill futures, swap saving and net payment, FRA settlement, currency swap items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-C-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('BFM C U06 B001: derivative figures recompute', () => {
  const fwd = 83 * (1 + 0.075 * 180 / 365) / (1 + 0.05 * 180 / 365);
  check('USD/INR spot is 83.00. The rupee interest rate is 7.50', rd(fwd, 2), '84.00');
  check('For the same data, what is the annualised forward premium', rd((fwd - 83) / 83 * 365 / 180 * 100, 2), '2.44');
  check('An exporter sells USD 2 million forward', rd(2e6 * (84.6 - 83.8) / 1e5, 0), '16');
  check('A call option on USD has a strike of Rs 83.00', rd(Math.max(84.5 - 83, 0), 2), '1.50');
  check('A put option on USD has a strike of Rs 83.00', Math.max(83 - 84.5, 0), '0');
  check('The premium of the call (strike 83.00)', rd(2.1 - 1.5, 2), '0.60');
  check('An importer buys a USD call at strike 83.00', rd((85 - 83 - 0.8) * 1e6 / 1e5, 0), '12');
  check('For the same option, what is the break-even', rd(83 + 0.8, 2), '83.80');
  check('The importer instead sees spot at Rs 82.00', rd(0.8 * 1e6 / 1e5, 0), '8');
  check('A futures contract on GBP 25,000 was bought', rd((1.4 - 1.37) * 25000, 0), '750');
  check('An exposure of USD 245,600 is hedged', Math.round(245600 / 1000), '246');
  check('With 246 contracts of USD 1,000', 246000 - 245600, '400');
  check('The expected interest rate at the end of the period is 6.5', rd(100 - 6.5, 1), '93.5');
  check('A corporate sold Treasury bill futures at 93.50', Math.round((93.5 - 92.8) / 0.01) * 25, '1750');
  check('A company pays a fixed 7.00 per cent on a Rs 200 crore', (7 - (4 + 2)) / 100 * 200, '2');
  check('If the T-bill rises to 6.00 per cent', (8 - 7) / 100 * 200, '2');
  check('A swap has a notional of Rs 50 crore', rd(5e8 * (0.076 - 0.07) * 91 / 365 / 1e5, 2), '7.48');
  check('A buyer of a 6/12 FRA on Rs 100 crore', rd(100 * 0.01 * 182 / 365 / (1 + 0.08 * 182 / 365), 3), '0.480');
  check('A currency swap exchanges USD 50 million', 50 * 82 / 10, '410');
  check('The customer pays fixed rupee interest of 7.00', rd(410 * 0.07 / 2, 2), '14.35');
  check('At final exchange the spot rate is Rs 88.00', 50 * 88 / 10 - 410, '30');
  // courseware examples recomputed
  assert.equal(rd((1.4 - 1.37) * 25000, 0), 750); assert.equal(561 * 1000 - 560700, 300); assert.equal(4400 * 0.065 / 2, 143);
});

test('BFM C U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 54); assert.equal(b.items.length, 93);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 19, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
