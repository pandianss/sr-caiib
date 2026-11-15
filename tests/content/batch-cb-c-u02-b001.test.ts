// Structure and arithmetic checks for batch CB-C-U02-B001 (credit policy: sector credit coefficients, real credit, margins, ceilings and lending rate build-up).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-C-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB C U02 B001: numerical answers recompute', () => {
  check("A sector has planned output of Rs 400 crore", 0.25*400+0.5*100, "150");
  check("Nominal credit is Rs 1,100 crore and the price", 1100/1.1, "1000");
  check("Nominal credit grows by 15 per cent", 15-5, "10");
  check("The margin on loans against shares was cut", 200*0.5-200*0.25, "50");
  check("A bank may lend against stock of Rs 500 lakh", 500*0.7, "350");
  check("A credit ceiling is 100 per cent of the peak", 80*1.15, "92");
  check("A bank has a one-year MCLR of 7.60", 7.6+1.4, "9");
  check("A bank has a marginal cost of funds of 6.50", 6.5+0.1+0.4+0.2, "7.2");
  check("The base rate was introduced in July 2010", 2016-2010, "6");
  check("A Study Group examined 13 external benchmarks", 13-3, "10");
});

test('CB C U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 29); assert.equal(b.items.length, 43);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 12, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
