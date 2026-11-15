// Structure and calculation checks for batch ABFM-D-U06-B001 (green and sustainable financing: coupon, yield gap in basis points, extra interest, unutilised proceeds, allocation share, emission intensity, weighted ESG score and issuance share items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-D-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('ABFM D U06 B001: green finance figures recompute', () => {
  check('A company issues green bonds of face value Rs 500 crore', rd(0.072 * 500, 0), '36');
  check('A green bond yields 7.6 per cent', rd((7.6 - 7.4) * 100, 0), '20');
  check('On a green bond of Rs 800 crore', rd(0.002 * 800, 1), '1.6');
  check('A green bond raises Rs 1,000 crore. Rs 820 crore', 1000 - 820, '180');
  check('Of the Rs 1,000 crore raised', 820 / 1000 * 100, '82');
  check('A country emits 2,400 million tonnes', 2400 / 200, '12');
  check('Emission intensity falls from 12 to 9', (12 - 9) / 12 * 100, '25');
  check('Green bonds issued in a year were Rs 6,000 crore', rd(6000 / 800000 * 100, 2), '0.75');
  check('A simple ESG score gives environmental 70', rd(0.4 * 70 + 0.3 * 60 + 0.3 * 80, 0), '70');
  check('Of 34 surveyed banks, about one third', Math.round(34 / 3), '11');
  check('A project funded by a Rs 200 crore green bond', 0.08 * 200 * 5, '80');
});

test('ABFM D U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 50); assert.equal(b.items.length, 76);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 18, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
