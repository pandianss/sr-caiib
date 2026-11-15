// Structure and arithmetic checks for batch BRBL-A-U05-B001 (public sector, private sector, regional rural, differentiated, co-operative and local area banks: voting caps, shareholding, quorum, liquid assets, counts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BRBL-A-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BRBL A U05 B001: numerical answers recompute', () => {
  check("A nationalised bank has 400 crore total voting rights", 0.01*400, "4");
  check("In the State Bank of India, shares carry 500 crore", 0.1*500, "50");
  check("A nationalised bank has issued share capital of Rs 2,000 crore", 0.51*2000, "1020");
  check("A Regional Rural Bank has issued capital of Rs 200 crore. Using", 0.35*200, "70");
  check("For the same Regional Rural Bank with issued capital", (0.5+0.15)*200, "130");
  check("A nationalised bank board has the Chairman and Managing Director", 1+4+1+1+1+1+1+6, "16");
  check("A nationalised bank board has 12 directors", 12/3, "4");
  check("A nationalised bank must hold at least six board meetings", 6-4, "2");
  check("A co-operative bank has demand and time liabilities in India of Rs 3,000", 0.25*3000, "750");
  check("For the same co-operative bank, what is the maximum", 0.4*3000, "1200");
  check("The 2020 Amendment Act was enacted on 29 September 2020", (30-26)+31+31+29, "95");
  check("Of about 227 applications", 227-10, "217");
});

test('BRBL A U05 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 66); assert.equal(b.items.length, 88);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 27, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
