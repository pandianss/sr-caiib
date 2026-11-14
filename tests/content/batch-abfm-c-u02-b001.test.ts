// Structure and calculation checks for batch ABFM-C-U02-B001 (DCF valuation: constant growth, two-stage, H model, FCFF and APV items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-C-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM C U02 B001: dividend discount models, FCFF and APV recompute', () => {
  const r2 = (x: number) => Math.round(x * 100) / 100;
  check('A company is expected to pay a dividend of Rs 5', r2(5 / (0.14 - 0.06)), '62.50');
  check('A company has just paid a dividend of Rs 4', r2(4 * 1.08 / (0.16 - 0.08)), '54.00');
  check('A share pays a constant dividend of Rs 6', r2(6 / 0.12), '50.00');
  const d = [2.4, 2.88, 3.456]; const pv1 = d.reduce((s, x, i) => s + x / 1.15 ** (i + 1), 0); const p3 = d[2]! * 1.08 / (0.15 - 0.08);
  check('A share has D0 = Rs 2. Dividends grow at 20', r2(pv1 + p3 / 1.15 ** 3), '41.60');
  check('A share has D0 = Rs 2. Its growth rate', r2((2 * 1.08 + 2 * 3 * (0.20 - 0.08)) / (0.14 - 0.08)), '48.00');
  check('A firm expects free cash flow to the firm', Math.round(120 / (0.12 - 0.04)), '1500');
  check('The firm above has debt of Rs 400 crore', Math.round(120 / (0.12 - 0.04) - 400), '1100');
  check('An unlevered firm is worth Rs 800 crore', 800 + 90, '890');
});

test('ABFM C U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 30); assert.equal(b.items.length, 47);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 12, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
