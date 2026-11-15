// Structure and calculation checks for batch BFM-C-U07-B001 (treasury and ALM: repricing gap, NII effect, hedged spread, CDS premium and loss, transfer pricing spread items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-C-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('BFM C U07 B001: ALM figures recompute', () => {
  check('In the 6-month bucket a bank has rate sensitive assets', 800 - 600, '200');
  check('For the same bucket, what is the sensitivity ratio', rd(600 / 800, 2), '0.75');
  check('Interest rates rise by 1 per cent. By how much', 200 * 0.01, '2');
  check('Deposits of Rs 100 crore costing 5 per cent', rd(7 - 6.5, 1), '0.5');
  check('A bank borrows USD at 3.00 per cent', rd(6.5 - 3 - 1.5, 0), '2');
  check('A deposit is priced at T-bill plus 1 per cent', 3 - 1, '2');
  check('A 3-year loan is funded by 3-month deposits', 3 * 4, '12');
  check('A bank buys credit protection on Rs 200 crore', rd(0.0125 * 200, 2), '2.50');
  check('The reference entity defaults and recovery is 40', 200 * 0.6, '120');
  check('A branch lends at 10.50 per cent', rd(10.5 - 7.25, 2), '3.25');
  check('A branch raises deposits at 7.00 per cent', rd(0.01 * 300, 0), '3');
  check('In the 8-14 day bucket, cash outflows', 900 - 780, '120');
  check('Assume the net cumulative negative mismatch limit', 0.1 * 3000, '300');
});

test('BFM C U07 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 34); assert.equal(b.items.length, 58);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 13, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
