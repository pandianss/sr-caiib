// Structure and calculation checks for batch BFM-D-U01-B001 (balance sheet components and ALM: NII, NIM, operating profit, profit identity, equity ratio, gap effect, one-year shortfall, shares).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-D-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BFM D U01 B001: balance sheet and ALM figures recompute', () => {
  check('A bank has interest income of Rs 900 crore and interest expended', 900 - 540, '360');
  check('With average total assets of Rs 9,000 crore', 360 / 9000 * 100, '4.0');
  check('Interest income is Rs 900 crore, other income', 900 + 120 - 540 - 300, '180');
  check('Provisions and contingencies are Rs 110 crore', 180 - 110, '70');
  check('Interest income is 1,200, interest expense 700', 1200 - 700 - 90 + 260 - 400 - 70, '200');
  check('Shareholders funds are Rs 1,200 crore', 1200 / 15000 * 100, '8');
  check('A bank has rate sensitive assets of Rs 500 crore', (500 - 450) * 0.01, '0.5');
  check('A bank has liabilities of Rs 10,000 crore', 0.5 * 10000 - 0.1 * 12000, '3800');
  check('Term loans of Rs 12,000 crore and cash credit', 12000 / 20000 * 100, '60');
  check('Deposits are Rs 80,000 crore', 80000 / 100000 * 100, '80');
});

test('BFM D U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 31); assert.equal(b.items.length, 51);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 12, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
