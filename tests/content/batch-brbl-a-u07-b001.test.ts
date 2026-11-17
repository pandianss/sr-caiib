// Structure and arithmetic checks for batch BRBL-A-U07-B001 (financial sector reforms and the FSDC: historical ratio differences, month and year counts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BRBL-A-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BRBL A U07 B001: numerical answers recompute', () => {
  check("At the time of the first Narasimham Committee the combined CRR and SLR was 53.5", 53.5-38.5, "15");
  check("The SLR was brought down from 38.5 per cent to about 28", 38.5-28, "10.5");
  check("The CRR was reduced from 14 per cent to 10 per cent. By", 14-10, "4");
  check("A bank has net demand and time liabilities of Rs 10,000", (0.385-0.28)*10000, "1050");
  check("Narasimham Committee II was set up in December 1997", 4, "4");
  check("The FSLRC was set up in March 2011", 2013-2011, "2");
  check("The FSDC was constituted in December 2010", 9, "9");
  check("Gross NPAs fell from a peak of about 12 per cent", 12-2, "10");
});

test('BRBL A U07 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 46); assert.equal(b.items.length, 61);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 19, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
