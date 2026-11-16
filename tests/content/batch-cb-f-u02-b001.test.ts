// Structure and arithmetic checks for batch CB-F-U02-B001 (Central Banking unit 18 numerical checks).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-F-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB F U02 B001: numerical answers recompute', () => {
  check("Total liquidity support is Rs 600", 600/2/6, "50");
  check("A PD holds Rs 100 crore of the support for 30 days beyond", Math.round(10000*0.115*30/360*100)/100, "95.83");
  check("A PD has a bidding commitment of Rs 2,000", 900/2000*100, "45");
  check("A PD has an average month-end stock of Rs 500 crore in dated securities. What minimum annual total", 5*500, "2500");
  check("A PD has an average month-end stock of Rs 500 crore in dated securities. What minimum annual outright", 3*500, "1500");
  check("A PD has total purchases of Rs 4,000", (4000+3500)/600, "12.50");
  check("A Government dated security issue has a notified amount of Rs 10,000", 0.5*10000, "5000");
  check("The MUC of Rs 5,000 crore is shared", 5000/20, "250");
  check("For an issue with a notified amount of Rs 8,000", 0.30*8000, "2400");
  check("An SPD has audited NOF of Rs 700", 700, "700");
  check("An SPD has total financial investments", 0.5*3000, "1500");
});

test('CB F U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 39); assert.equal(b.items.length, 54);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
