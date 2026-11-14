// Structure and calculation checks for batch ABFM-B-U05-B001 (risk adjustment: sensitivity, scenario, Hillier, decision tree, RADR and certainty equivalent items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-B-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM B U05 B001: sensitivity, scenario, Hillier, decision tree, RADR and certainty equivalent recompute', () => {
  const af = 3.17; const npv = (inflow: number, inv: number) => inflow * af - inv; const base = npv(70000, 200000);
  check('A project costs Rs 2,00,000 and gives', Math.round(base), '21900');
  const down = npv(63000, 200000); assert.ok(down < 0);
  check('If the annual net cash inflow of the same project falls', Math.round(-down), '290');
  check('By what percentage does the NPV fall', Math.round((base - down) / base * 1000) / 10, '101.3');
  check('If the initial investment of the same project rises', Math.round(npv(70000, 220000)), '1900');
  const f3 = 2.487; const sc = [160000, 210000, 260000].map(c => c * f3 - 500000); const p = [0.25, 0.5, 0.25];
  check('A project costs Rs 5,00,000 and gives equal annual', Math.round(sc.reduce((s, v, i) => s + v * p[i]!, 0)), '22270');
  check('A project has uncorrelated annual cash flows', Math.round(Math.sqrt(1e8 / 1.1 ** 2 + 4e8 / 1.1 ** 4)), '18864');
  check('If the cash flows of the same project were perfectly', Math.round(1e4 / 1.1 + 2e4 / 1.1 ** 2), '25620');
  check('Project X can give an NPV', Math.round((8 * 0.5 + -2 * 0.5) * 10) / 10, '3.0');
  check('Project Y can give an NPV', Math.round((5 * 0.7 + 1 * 0.3) * 10) / 10, '3.8');
  check('The risk-free rate is 7 per cent, the firm', 7 + 2 + 3, '12');
  check("A project's risky cash inflow", Math.round(22500 / (20000 * 0.5 + 30000 * 0.5) * 10) / 10, '0.9');
  check('A project costs Rs 80,000. Expected', Math.round(45000 / 1.08 + 48000 / 1.08 ** 2 - 80000), '2819');
});

test('ABFM B U05 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 33); assert.equal(b.items.length, 57);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 14, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
