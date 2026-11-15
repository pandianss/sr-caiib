// Structure and calculation checks for batch ABFM-D-U05-B001 (business analytics: support, confidence, accuracy, aggregation, moving average, change, growth, flag counts, unit conversion, saving and return items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-D-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const rd = (x: number) => Math.round(x);

test('ABFM D U05 B001: business analytics figures recompute', () => {
  check('Of 200 transactions, 40 contain item A', rd(30 / 200 * 100), '15');
  check('For the same data, what is the confidence', rd(30 / 40 * 100), '75');
  check('Of 500 baskets, 100 contain bread', rd(60 / 100 * 100), '60');
  check('For the same baskets, what is the support', rd(60 / 500 * 100), '12');
  check('A classifier labels 800 loan applications', rd(728 / 800 * 100), '91');
  check('A network device reports the following traffic', (40 + 55 + 50 + 45 + 60) / 5, '50');
  check('Four devices each report an average load', (30 + 50 + 40 + 80) / 4, '50');
  check('A resource is polled once every 2 minutes', 10 / 2, '5');
  check('Monthly sales were Rs 100 lakh', (100 + 110 + 120) / 3, '110');
  check('Forecast sales were Rs 110 lakh and actual', 110 - 98, '12');
  check('Sales rose from Rs 80 lakh to Rs 92 lakh', rd((92 - 80) / 80 * 100), '15');
  check('Sales are Rs 200 lakh and the expected growth', rd(200 * 1.08), '216');
  check('A bank has 8 lakh transactions in a day', rd(0.0005 * 800000), '400');
  check('A data lake holds 2.5 petabytes', 2.5 * 1000, '2500');
  check('Storing data in the cloud lowers', rd((80 - 56) / 80 * 100), '30');
  check('An analytics project costs Rs 60 lakh', rd((75 - 60) / 60 * 100), '25');
});

test('ABFM D U05 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 51); assert.equal(b.items.length, 82);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 18, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
