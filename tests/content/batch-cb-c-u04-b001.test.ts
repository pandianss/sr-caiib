// Structure and arithmetic checks for batch CB-C-U04-B001 (liquidity management: BSL arithmetic, corridor widths, reserve maintenance and HTM room).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-C-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB C U04 B001: numerical answers recompute', () => {
  check("Net borrowings of banks under LAF are Rs 40,000", 40000-15000, "25000");
  check("Total borrowings under LAF are Rs 90,000", 90000-30000, "60000");
  check("Actual reserves of banks are Rs 8.5 lakh", 8.5-8.0, "0.5");
  check("With the repo rate at 6.00 per cent, the 2011", 6+0.5, "6.5");
  check("For the same repo rate of 6.00 per cent, what", 6-1, "5");
  check("The banking system has NDTL of Rs 150", 0.005*150, "0.75");
  check("The minimum daily CRR maintenance is 90", 0.9*9, "8.1");
  check("The SDF is at 3.75 per cent and the MSF", (4.25-3.75)*100, "50");
  check("The corridor width was narrowed from 65", 65-50, "15");
  check("The held-to-maturity limit was raised from 22", 0.01*100, "1");
  check("TLTRO 2.0 required at least 50 per cent", 0.5*800, "400");
});

test('CB C U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 31); assert.equal(b.items.length, 45);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 13, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
