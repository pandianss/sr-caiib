// Structure and arithmetic checks for batch CB-A-U01-B001 (evolution of central banking: historical year differences, FOMC counts and currency ratios).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-A-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB A U01 B001: numerical answers recompute', () => {
  check("The Riksbank was founded in 1668 and the Bank of England", 1694-1668, "26");
  check("The Bank of England was nationalised in 1946", 1997-1946, "51");
  check("Members of the Federal Reserve Board serve fourteen year", 14/2, "7");
  check("The FOMC has seven Governors and twelve regional presidents", 7+5, "12");
  check("Presidents of the twelve regional Federal Reserve Banks do not", 12-5, "7");
  check("Germany established its central bank in 1876", 1893-1876, "17");
  check("The courseware counts about a dozen central", 160-12, "148");
  check("The currency to deposit ratio is 80 per cent", 0.8*500, "400");
  check("In a developed market the currency to deposit ratio is 10", 0.1*500, "50");
});

test('CB A U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 41); assert.equal(b.items.length, 55);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 17, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
