// Structure and arithmetic checks for batch BRBL-A-U04-B001 (returns, inspection, winding up, mergers and acquisitions: periods, thresholds, majorities and fines).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BRBL-A-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BRBL A U04 B001: numerical answers recompute', () => {
  check("A bank submits its accounts to the Reserve Bank within three months", 3+3, "6");
  check("A bank has a financial year ending 31 March", 3+6, "9");
  check("A customer makes four cash deposits of Rs 2.8 lakh", 4*2.8-10, "1.2");
  check("A bank must keep a record of a transaction made in 2021", 2021+5, "2026");
  check("The Board for Financial Supervision has the Governor as chairman", 1+1+4, "6");
  check("The Board for Financial Supervision meets once every month", 12, "12");
  check("Shareholders of a bank present in person or by proxy hold shares", 90*2/3, "60");
  check("A court has stayed proceedings against a bank for four months", 6-4, "2");
  check("A bank accepted Rs 40 lakh of deposits", 2*40, "80");
});

test('BRBL A U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 62); assert.equal(b.items.length, 81);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 25, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
