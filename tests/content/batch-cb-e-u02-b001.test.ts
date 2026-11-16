// Structure and arithmetic checks for batch CB-E-U02-B001 (scheduled commercial banks: CRAR with buffer, LCR relief, LTV change, CRR release, merger counts, risk weighted asset and GNPA ratio).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'CB-E-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('CB E U02 B001: numerical answers recompute', () => {
  check("The minimum CRAR is 9 per cent plus a capital", 9+1.875, "10.875");
  check("CRAR is 16.6 per cent against a minimum", 16.6-10.875, "5.725");
  check("A bank has a 30 day stressed net outflow", 400-0.8*400, "80");
  check("Gold loan LTV is raised from 75", 10*0.15, "1.5");
  check("The CRR is cut from 4 per cent to 3 per cent", 0.01*20000, "200");
  check("Ten public sector banks were merged into four", 10-4, "6");
  check("A MSME loan exposure limit for the regulatory", 7*0.75, "5.25");
  check("Fourteen banks were nationalised in 1969", 1980-1969, "11");
  check("A bank has GNPA of Rs 700 crore", 700/10000*100, "7");
});

test('CB E U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 34); assert.equal(b.items.length, 47);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 14, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
