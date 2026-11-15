// Structure and arithmetic checks for batch BRBL-A-U03-B001 (regulation of banking business: assets in India, penal rates, reserve fund, cash reserve, SLR, unclaimed deposit year).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BRBL-A-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BRBL A U03 B001: numerical answers recompute', () => {
  check("A bank has demand and time liabilities in India of Rs 800 crore", 0.75*800, "600");
  check("The bank rate is 6.25 per cent. A scheduled bank has a CRR", 6.25+3, "9.25");
  check("With the same bank rate of 6.25 per cent", 6.25+5, "11.25");
  check("A bank has a CRR shortfall of Rs 365 crore", 365*0.095/365*100, "9.5");
  check("A bank has a profit of Rs 250 crore", 0.2*250, "50");
  check("A non-scheduled bank has demand and time liabilities of Rs 2,000", 0.03*2000, "60");
  check("A bank has net demand and time liabilities of Rs 1,500 crore", 0.4*1500, "600");
  check("A fixed deposit matured in 2013", 2013+10, "2023");
});

test('BRBL A U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 63); assert.equal(b.items.length, 82);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 26, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
