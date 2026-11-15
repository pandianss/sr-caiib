// Structure and arithmetic checks for batch CB-D-U02-B001 (Indian financial markets: ceiling cuts, carry spread, SLR change and holding, maturity rise, LERMS conversion, turnover growth).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-D-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB D U02 B001: numerical answers recompute', () => {
  check("The call money ceiling was 15 per cent in December 1973", 15-8.5, "6.5");
  check("A bank borrows Rs 200 crore in the call market", 200*0.015*30/360*100, "25");
  check("The SLR was 38.5 per cent in September 1990", 38.5-18, "20.5");
  check("A bank has NDTL of Rs 10,000 crore. At an SLR", 0.18*10000, "1800");
  check("The average maturity of Government securities issued rose", 14.1-5.7, "8.4");
  check("Of 111 outstanding central government securities", 111-20, "91");
  check("Under LERMS an exporter receives USD 100,000", (60000*30+40000*25)/100000, "28");
  check("The average daily forex turnover rose from", 55-16, "39");
  check("LERMS was introduced on 1 March 1992", 12, "12");
  check("The Reference Rate for USD/INR is Rs 82", 81.98+0.04, "82.02");
});

test('CB D U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 35); assert.equal(b.items.length, 49);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 15, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
