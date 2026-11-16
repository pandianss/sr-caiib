// Structure and arithmetic checks for batch CB-F-U01-B001 (Central Banking unit 17 numerical checks).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-F-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB F U01 B001: numerical answers recompute', () => {
  check("An NBFC has risk weighted assets of Rs 800", 0.15*800, "120");
  check("An NBFC-UL has RWA of Rs 2,000", 0.09*2000, "180");
  check("An NBFC-ML has Tier 1 capital of Rs 400 crore. What is the single", 0.25*400, "100");
  check("An NBFC-ML has Tier 1 capital of Rs 400 crore. What is the group", 0.40*400, "160");
  check("An NBFC sector has assets of Rs 100 lakh", 100*1.186, "118.6");
  check("The growth rate of NBFCs was 18.6", 18.6-10.7, "7.9");
  check("A company has a financial flow of Rs 60", 60/100*100, "60");
  check("The NOF requirement for HFCs rose", 20-10, "10");
  check("An NBFC has net NPA of Rs 6 crore", 6/200*100, "3");
});

test('CB F U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 41); assert.equal(b.items.length, 54);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 17, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
