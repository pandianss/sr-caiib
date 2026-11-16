// Structure and arithmetic checks for batch CB-E-U03-B001 (co-operative banks: CRAR capital by tier, FSWM threshold, net worth glide, net NPA ratio, board majority).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-E-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB E U03 B001: numerical answers recompute', () => {
  check("A UCB has risk weighted assets of Rs 500 crore and is in Tier 2", 0.12*500, "60");
  check("A Tier 1 UCB has risk weighted assets", 0.09*500, "45");
  check("A UCB in Tier 2 has risk weighted assets of Rs 800", 80/800*100, "10");
  check("The applicable CRAR is 12 per cent. For the FSWM", 12+1, "13");
  check("A UCB must reach at least 50 per cent", 0.5*5, "2.5");
  check("A UCB has deposits of Rs 1,500 crore", 3, "3");
  check("A UCB has net NPA of Rs 24 crore", 24/600*100, "4");
  check("A UCB board has 12 members", 12*2/3, "8");
  check("The RRBs were set up in 1975 and NABARD", 1982-1975, "7");
});

test('CB E U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 26); assert.equal(b.items.length, 38);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 11, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
