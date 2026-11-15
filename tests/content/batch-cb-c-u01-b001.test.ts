// Structure and arithmetic checks for batch CB-C-U01-B001 (monetary policy: Taylor responses, LAF corridor, reserve ratios, multiplier, target band, phasing and majority).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-C-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB C U01 B001: numerical answers recompute', () => {
  check("Using the Taylor response with b = 0.5, if inflation rises", 1.5*2, "3");
  check("Using the Taylor illustration with a = 0.5", 0.5*3, "1.5");
  check("The policy repo rate is 6.00 per cent. The SDF is 25", 6+0.25, "6.25");
  check("With the repo rate at 6.00 per cent, what is the SDF", 6-0.25, "5.75");
  check("What is the width of the LAF corridor", 25+25, "50");
  check("A bank has net demand and time liabilities of Rs 6,000", (0.045+0.18)*6000, "1350");
  check("The daily minimum CRR is 95 per cent", 0.95*270, "256.5");
  check("The MSF allows borrowing against up to 2 per cent", 0.02*900, "18");
  check("The money multiplier is 4 and reserve money", 4*500, "2000");
  check("The inflation target is 4 per cent with a band of plus or minus 2 per cent. What is the upper", 4+2, "6");
  check("For the same target, what is the lower", 4-2, "2");
  check("A policy rate change of 100 basis points", 100/4, "25");
  check("How many votes are needed for a simple majority", 4, "4");
});

test('CB C U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 52); assert.equal(b.items.length, 70);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 21, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
