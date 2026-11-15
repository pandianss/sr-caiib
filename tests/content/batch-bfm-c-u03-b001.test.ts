// Structure and calculation checks for batch BFM-C-U03-B001 (international equity and debt products: GDR shares and parity, fully diluted holding, ECB exchange loss and hedge, trade credit interest and eligible amount items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-C-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('BFM C U03 B001: international product figures recompute', () => {
  check('A GDR represents 5 equity shares', 40000 * 5, '200000');
  check('The shares underlying a GDR trade at Rs 600', rd(5 * 600 / 80, 1), '37.5');
  check('A company pays a dividend of Rs 4 per share', 200000 * 4 / 100000, '8');
  check('For this exercise assume the FDI threshold', 9 / (80 + 20) * 100, '9');
  check('Using the same assumed threshold, how many additional', 0.1 * 100 - 9, '1');
  check('A borrower draws an ECB of USD 20 million', 20 * 82 / 10, '164');
  check('The ECB is repaid when the rate is Rs 86.00', 20 * (86 - 82) / 10, '8');
  check('If 70 per cent of the USD 20 million was hedged', rd(0.3 * 20 * (86 - 82) / 10, 1), '2.4');
  check('An ECB of USD 10 million carries an all-in-cost', rd(0.09 * 10 * 80 / 10, 1), '7.2');
  check('A buyers credit of USD 5 million', 5000 * 0.06 * 2, '600');
  check('For a bank, 1.5 per cent of risk weighted assets', Math.max(0.015 * 80000, 1500), '1500');
  check('Not more than 49 per cent of an eligible amount', rd(0.49 * 1500, 0), '735');
});

test('BFM C U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 40); assert.equal(b.items.length, 61);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 15, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
