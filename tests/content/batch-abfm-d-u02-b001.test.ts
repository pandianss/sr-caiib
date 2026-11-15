// Structure and calculation checks for batch ABFM-D-U02-B001 (start-up finance: post-money, stake, pre-money, dilution, price per share, new shares, burn, runway, interest, convertible note, instalment, fund share and guarantee items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-D-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('ABFM D U02 B001: start-up financing figures recompute', () => {
  check('A company with a pre-money value of Rs 8 crore raises', 8 + 2, '10');
  check('An investor puts Rs 2 crore into a company with a pre-money value of Rs 8 crore. What stake', 2 / (8 + 2) * 100, '20');
  check('An investor puts Rs 3 crore into a company for a 25', 3 / 0.25 - 3, '9');
  check('Founders hold 100 per cent. They sell 20 per cent', 100 * 0.8 * 0.85, '68');
  check('A company has 8 lakh shares and a pre-money value', 800 / 8, '100');
  check('At a round price of Rs 100 a share', 200 / 100, '2');
  check('A start-up spends Rs 40 lakh a month', 40 - 15, '25');
  check('The start-up has Rs 3 crore in cash', 300 / 25, '12');
  check('A start-up borrows Rs 50 lakh from a bank', 0.12 * 50, '6');
  check('An investor puts Rs 1 crore into a convertible note', rd(100 / (100 * 0.8), 2), '1.25');
  check('An incubator pays a Rs 60 lakh grant', 0.4 * 60, '24');
  check('A fund of funds commits Rs 20 crore', 20 / 80 * 100, '25');
  check('A lender gives a start-up a loan of Rs 80 lakh', 0.75 * 80, '60');
  assert.equal(rd(100 * 0.8 * 0.9, 0), 72);
});

test('ABFM D U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 44); assert.equal(b.items.length, 70);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
