// Structure and calculation checks for batch BFM-C-U01-B001 (introduction to treasury management: swap arbitrage yield and gain, spread profit, open position, transfer pricing spread, return on capital and share items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-C-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('BFM C U01 B001: treasury figures recompute', () => {
  const y = (0.08 / 82) * (365 / 7) * 100; const total = y + 0.2; const gain = total - 4;
  check('A bank does a 7-day buy/sell USD/INR swap', rd(y, 2), '5.09');
  check('The dollars from that swap are placed abroad', rd(total, 2), '5.29');
  check('The domestic rupee money market rate for 7 days', rd(gain, 2), '1.29');
  check('On a rupee amount of Rs 100 crore', rd(1e9 * 0.0129 * 7 / 365 / 1e5, 1), '2.5');
  check('A bank buys USD 2 million from an exporter', rd(2e6 * (82.55 - 82.40) / 1e5, 0), '3');
  check('A bank ends the day with an open long position', rd(5e6 * (82.70 - 82.50) / 1e5, 0), '10');
  check('Funds raised from branches cost 5.5 per cent', rd(0.013 * 400, 2), '5.20');
  check('Treasury earns Rs 120 crore on an allocated capital', 120 / 800 * 100, '15');
  check('A treasury product earns a buy-sell spread', rd(0.001 * 500 * 100, 0), '50');
  check('Treasury income is Rs 3,200 crore', 3200 / 16000 * 100, '20');
  check('A bank has a USD 10 million cash flow due', rd(10e6 * 83.2 / 1e7, 1), '83.2');
  // courseware example recomputed: 0.06/75 x 365/7 = 4.17 per cent; +0.15 = 4.32; less 3.50 = 0.82
  assert.equal(rd((0.06 / 75) * (365 / 7) * 100, 2), 4.17); assert.equal(rd(4.17 + 0.15 - 3.5, 2), 0.82);
});

test('BFM C U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 44); assert.equal(b.items.length, 65);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
