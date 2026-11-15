// Structure and calculation checks for batch ABFM-C-U05-B001 (mergers, acquisitions and restructuring: merger NPV under cash and stock, exchange ratios, EPS illusion, HHI, control, VOP and buyout items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-C-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => (Math.round(x * 100) / 100);

test('ABFM C U05 B001: merger and restructuring figures recompute', () => {
  // cash compensation
  check('Firm A is worth Rs 200 crore and firm B Rs 50 crore', (290 - (200 + 50)) - (70 - 50), '20');
  check('A cash offer of Rs 65 crore', 65 - 50, '15');
  check('Firm A is worth Rs 300 crore, firm B Rs 120 crore', 470 - (300 + 120), '50');
  // stock compensation
  const alpha = 10 / (40 + 10); check('Acquirer M has 40 lakh shares', alpha * 100, '20');
  const benefit = 6; const pvab = 60 + 10 + benefit; const cost = alpha * pvab - 10;
  check('M is worth Rs 60 crore (40 lakh shares at Rs 150)', r1(cost), '5.2');
  check('Using the same data (benefit Rs 6 crore', r1(benefit - cost), '0.8');
  check('M issues 10 lakh shares priced at Rs 150', 10 * 150 / 100 - 10, '5');
  // exchange ratios
  assert.equal(r2(40 / 80), 0.5); check('The book value per share is Rs 80', r2(40 / 80), '0.50');
  check('The earnings per share are Rs 12', r2(9 / 12), '0.75');
  check('The market price is Rs 200', r2(50 / 200), '0.25');
  check('The acquirer has a DCF firm value of Rs 900 crore', r2(((240 - 40) / 4) / ((900 - 100) / 8)), '0.50');
  check('The agreed exchange ratio is 0.75', 0.75 * 20, '15');
  // EPS illusion
  const newShares = 0.5 * 10; const totShares = 20 + newShares;
  check('A has earnings of Rs 2 crore and 20 lakh shares', (3 * 100) / totShares, '12');
  check('Using the same merger (A worth Rs 200 a share', (20 * 200 + 10 * 100) / totShares, '200');
  // concentration
  check('Two firms hold 30 per cent each', 2 * 30 ** 2 + 5 * 8 ** 2, '2120');
  check('One firm holds 40 per cent of a market', 40 ** 2 + 6 * 10 ** 2, '2200');
  assert.equal(50 ** 2 + 5 * 10 ** 2, 3000);
  // valuation of purchases and sell-offs
  check('A business is worth Rs 500 crore under optimal', 500 - 380, '120');
  check('Combined firm value is Rs 1,500 crore', 1500 - (900 + 450), '150');
  check('A target has a pre-acquisition market value of Rs 800', 800 * 1.3, '1040');
  check('The after-tax cash flows of a division', 340 - 90, '250');
  check('The offered divestiture proceeds are Rs 230', 250 - 230, '20');
  // buyouts
  check('A buyout costs Rs 300 crore', (300 - 210) / 300 * 100, '30');
  check('Using the courseware indication of debt', 4 * 45, '180');
});

test('ABFM C U05 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 78); assert.equal(b.items.length, 120);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 10 && counts[k]! <= 28, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
