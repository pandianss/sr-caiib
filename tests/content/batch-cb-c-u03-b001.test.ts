// Structure and arithmetic checks for batch CB-C-U03-B001 (fiscal-monetary relations: WMA limit, deficit and borrowing limit arithmetic, period counts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-C-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB C U03 B001: numerical answers recompute', () => {
  check("The WMA limit of a state was Rs 5,000 crore", 5000*1.6, "8000");
  check("The Union expenditure rose from Rs 30.4", 34.5-30.4, "4.1");
  check("A state has a GSDP of Rs 20 lakh crore", 0.032*20, "0.64");
  check("A state has a GSDP of Rs 10 lakh crore. Using", 0.035*10, "0.35");
  check("For the same state, with the additional 0.5", 0.04*10, "0.40");
  check("The Fifteenth Finance Commission was constituted in 2017", 2026-2021, "5");
  check("Ad hoc Treasury Bills had a maturity of 3 months", 4*3, "12");
  check("FC-1 operated from 1952 to 1957", 2017-1952, "65");
});

test('CB C U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 28); assert.equal(b.items.length, 40);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 12, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
