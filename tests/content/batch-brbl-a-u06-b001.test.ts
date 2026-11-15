// Structure and arithmetic checks for batch BRBL-A-U06-B001 (non-banking financial companies: capital ratios, exposure limits, provisioning, glide path, unit conversion).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BRBL-A-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BRBL A U06 B001: numerical answers recompute', () => {
  check("An applicable NBFC has aggregate risk weighted assets of Rs 800", 0.15*800, "120");
  check("For the same NBFC, what is the minimum Tier I capital at 10", 0.10*800, "80");
  check("A gold-lending NBFC has risk weighted assets of Rs 500", 0.12*500, "60");
  check("An NBFC has Tier I capital of Rs 400 crore. What is the maximum single", 0.25*400, "100");
  check("For the same NBFC with Tier I capital of Rs 400 crore", 0.4*400, "160");
  check("An NBFC-UL has other standard loans of Rs 500 crore", 0.004*500, "2");
  check("An NBFC-UL has commercial real estate", 0.01*300, "3");
  check("A Base Layer NBFC follows the glide path", 150-90, "60");
  check("The statutory net owned fund range for an NBFC", 100*100, "10000");
});

test('BRBL A U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 51); assert.equal(b.items.length, 69);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 21, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
