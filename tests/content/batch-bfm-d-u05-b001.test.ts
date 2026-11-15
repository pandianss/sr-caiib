// Structure and calculation checks for batch BFM-D-U05-B001 (interest rate risk management: gap examples, basis risk, yield curve NII, cumulative gap effect, modified duration gap and equity sensitivity, FRA hedge examples).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-D-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const rd = (x: number, d: number) => Math.round(x * 10 ** d + 1e-9) / 10 ** d;

test('BFM D U05 B001: interest rate risk figures recompute', () => {
  check('A bank funds Rs 100 crore of two-year assets', 0.01 * 100, '1');
  check('In the second year the liabilities are rolled over', 0.01 * 100, '1');
  check('Rates fall by 1.0 per cent on Rs 50 crore', rd(50 * 0.01 + 40 * 0.007, 2), '0.78');
  check('Rates on Rs 50 crore of savings deposits', rd(50 * 0.005 + 50 * 0.004, 2), '0.45');
  check('Using the answers above, what is the net change', rd(0.78 - 0.45, 2), '0.33');
  check('A 90-day loan at 10 per cent funded by a 90-day CD', (9 - 8) * 100, '100');
  check('In a yield curve example, loans earn', ((13 + 3) - (12.5 + 1)) * 100, '250');
  check('The curve inverts', ((13 + 3) - (14 + 1)) * 100, '100');
  check('Using the courseware gap table', 1050 - 850, '200');
  check('The cumulative gap up to one year is Rs 550 crore', 550 * 0.01, '5.50');
  check('Rate sensitive assets are Rs 18,251 crore and rate', rd(18590 / 18251, 2), '1.02');
  check('With DA = 1.96, DL = 1.25 and W = 1.02', rd(1.96 - 1.02 * 1.25, 2), '0.69');
  check('Rate sensitive assets of Rs 18,251 crore are held', rd(18251 / 1350, 2), '13.52');
  check('With a duration gap of 0.69 and leverage of 13.52', rd(0.69 * 13.52, 2), '9.33');
  check('Using the courseware modified duration of equity', rd(9.34 * 2, 2), '18.68');
  check('A bank places USD 1 million for one year at 1.50', 1e6 * 0.015, '15000');
  check('The deposit costs 1.45 per cent a year', 1e6 * 0.015 - 1e6 * 0.0145, '500');
  // courseware gap table cumulative: -50,-250,-350,-550,-850,-650,0
  const gaps = [500 - 550, 400 - 600, 700 - 800, 850 - 1050, 1200 - 1500, 1500 - 1300, 2500 - 1850]; let c = 0; const cum = gaps.map(g => (c += g));
  assert.deepEqual(cum, [-50, -250, -350, -550, -850, -650, 0]);
});

test('BFM D U05 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 43); assert.equal(b.items.length, 73);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
