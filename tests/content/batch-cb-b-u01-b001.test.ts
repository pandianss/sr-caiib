// Structure and arithmetic checks for batch CB-B-U01-B001 (Reserve Bank of India: year differences, Board counts, cash reserve and penal rate arithmetic).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-B-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB B U01 B001: numerical answers recompute', () => {
  check("The Reserve Bank commenced operations in 1935 and was nationalised", 1949-1935, "14");
  check("The Imperial Bank of India was formed in 1921", 1935-1921, "14");
  check("Fourteen banks were nationalised in 1969", 14+6, "20");
  check("The original Central Board had a Governor", 1+2+4+8+1, "16");
  check("The present Central Board has up to one Governor", 1+4+4+10+2, "21");
  check("A scheduled bank has demand and time liabilities of Rs 4,000", 0.045*4000, "180");
  check("The bank rate is 6.5 per cent. What is the penal", 6.5+3, "9.5");
  check("With a bank rate of 6.5 per cent, what is the penal", 6.5+5, "11.5");
  check("The First Supplemental Agreement covered", 1996-1994+1, "3");
  check("The Central Board must meet at least six times", 30/6, "5");
});

test('CB B U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 55); assert.equal(b.items.length, 72);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 23, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
