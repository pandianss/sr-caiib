// Structure and arithmetic checks for batch CB-A-U02-B001 (functions of central banks: money multiplier, reserve arithmetic, exchange rate bands and principle counts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-A-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB A U02 B001: numerical answers recompute', () => {
  check("The money multiplier is 1.8 and base money increases", 1.8*2000, "3600");
  check("Money supply is Rs 15,000 crore and base money", 15000/6000, "2.5");
  check("The money multiplier is 2.5. By how many crore", 1500/2.5, "600");
  check("A bank has loaned Rs 100 crore", 0.9*100, "90");
  check("In a developing country the currency to deposit ratio", 0.8*2500, "2000");
  check("Under Bretton Woods a currency has a par value", 100*1.01, "101");
  check("Under the Smithsonian Agreement a currency has a central rate", 100*(1-0.0225), "97.75");
  check("Under the Smithsonian Agreement the permissible band", 2.25+2.25, "4.5");
  check("The Basel Core Principles of 2012 define 29", 29-13, "16");
  check("A bank has net demand and time liabilities of Rs 8,000", 0.18*8000, "1440");
});

test('CB A U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 64); assert.equal(b.items.length, 85);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 26, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
