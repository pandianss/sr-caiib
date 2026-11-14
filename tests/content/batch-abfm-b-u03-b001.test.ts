// Structure and calculation checks for batch ABFM-B-U03-B001 (capital investment: payback, CFAT, ARR, NPV, PI, IRR and MIRR items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-B-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM B U03 B001: payback, CFAT, ARR, NPV, PI, IRR interpolation and MIRR recompute', () => {
  const cf = [160000, 160000, 120000, 80000]; const inv = 400000;
  check('A project costs Rs 4,00,000 and gives net cash inflows', Math.round((2 + (inv - 320000) / 120000) * 100) / 100, '2.67');
  check('A project costing Rs 12,00,000', Math.round(1200000 / 250000 * 10) / 10, '4.8');
  const ebt = (1000000 - 550000) - 100000 - 150000; const eat = ebt * 0.7; check('A new product line', Math.round(eat + 150000), '290000');
  const dep = (600000 - 100000) / 4; const profit = 205000 - dep; assert.equal(profit, 80000);
  check('A machine costs Rs 6,00,000', Math.round(profit / ((600000 + 100000) / 2) * 1000) / 10, '22.9');
  check('For the same machine, what is the ARR on the initial', Math.round(profit / 600000 * 1000) / 10, '13.3');
  const f = [0.909, 0.826, 0.751, 0.683]; const pv = cf.reduce((s, c, i) => s + c * f[i]!, 0);
  check('A project needs an investment of Rs 4,00,000', Math.round(pv - inv), '22360');
  check('For the same project, what is the profitability index', Math.round(pv / inv * 100) / 100, '1.06');
  const npv = (r: number) => [50000, 50000, 50000].reduce((s, c, i) => s + c / (1 + r) ** (i + 1), 0) - 100000;
  assert.equal(Math.round(npv(0.20)), 5324); assert.equal(Math.round(npv(0.25)), -2400);
  check('A project costing Rs 1,00,000 gives inflows of Rs 50,000', Math.round((20 + 5324 / (5324 + 2400) * 5) * 10) / 10, '23.4');
  const tv = 40000 * 1.1 ** 2 + 50000 * 1.1 + 60000; assert.equal(Math.round(tv), 163400);
  check('A project costs Rs 1,00,000 now and gives inflows of Rs 40,000', Math.round(((tv / 100000) ** (1 / 3) - 1) * 1000) / 10, '17.8');
});

test('ABFM B U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 36); assert.equal(b.items.length, 54);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 14, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
