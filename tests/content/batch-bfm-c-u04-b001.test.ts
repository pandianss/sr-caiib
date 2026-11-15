// Structure and calculation checks for batch BFM-C-U04-B001 (funding and regulatory aspects: CRR and SLR requirement, free funds, CRR cut release, daily floor, average balance, penal interest, repo interest, corridor, net and gross settlement, money multiplier items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-C-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('BFM C U04 B001: reserve, LAF and settlement figures recompute', () => {
  check('Assume a CRR of 4.0 per cent and an SLR of 18', rd(0.04 * 200000, 0), '8000');
  check('With the same assumptions, what is the SLR asset', rd(0.18 * 200000, 0), '36000');
  check('With the same assumptions, how much of NDTL is left', 200000 - 8000 - 36000, '156000');
  check('The central bank cuts the CRR by 0.50', rd(0.005 * 1700000, 0), '8500');
  check('A bank must keep a daily CRR balance of at least 90', rd(0.9 * 5400, 0), '4860');
  check('Over a 14-day fortnight a bank held Rs 5,300 crore', (7 * 5300 + 7 * 5500) / 14, '5400');
  check('A bank has a CRR shortfall of Rs 100 crore', rd(1e9 * 0.09 / 365 / 1e5, 2), '2.47');
  check('A bank borrows Rs 500 crore for 7 days', rd(5e9 * 0.0625 * 7 / 365 / 1e5, 2), '59.93');
  check('The repo rate is 6.50 per cent, the SDF rate', rd((6.75 - 6.25) * 100, 0), '50');
  check('Under the same corridor, the weighted average call', rd((6.60 - 6.50) * 100, 0), '10');
  check('Bank A sends payments of Rs 100 crore', 100 + 60 - 90, '70');
  check('Under gross settlement the same bank must fund', 100 + 60, '160');
  check('Broad money (M3) is Rs 2,100 lakh crore', 2100 / 300, '7');
  // courseware worked table recomputed
  assert.equal(120000 * 0.045, 5400); assert.equal(120000 * 0.18, 21600);
});

test('BFM C U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 40); assert.equal(b.items.length, 63);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 15, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
