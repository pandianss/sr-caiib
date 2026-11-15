// Structure and calculation checks for batch ABFM-D-U04-B001 (artificial intelligence: expected utility, classifier accuracy, chatbot saving, false alert rate, fuzzy negation and data split items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-D-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('ABFM D U04 B001: artificial intelligence figures recompute', () => {
  check('An action has two possible outcomes', rd(0.7 * 10 - 0.3 * 4, 1), '5.8');
  const eu = 0.5 * 20 + 0.5 * 0; check('Action A gives a 50 per cent chance of utility 20', eu, '10'); assert.ok(eu > 8);
  check('A spam classifier labels 1,000 emails', 940 / 1000 * 100, '94');
  check('A bank handles 200,000 routine customer queries', 0.6 * 200000 * 25 / 100000, '30');
  check('A fraud model raises 500 alerts', (500 - 400) / 500 * 100, '20');
  check('A chatbot project costs Rs 90 lakh', 30 * 12 - 90, '270');
  check('Fuzzy logic gives a statement the truth degree 0.7', rd(1 - 0.7, 1), '0.3');
  check('A data set of 12,000 observations is split', Math.round((100 - 60 - 20) / 100 * 12000), '2400');
});

test('ABFM D U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 47); assert.equal(b.items.length, 70);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 17, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
