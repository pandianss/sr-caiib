// Structure and calculation checks for batch ABFM-B-U04-B001 (international capital budgeting: CAPM, APT, parity and home and foreign currency approaches).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-B-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM B U04 B001: CAPM, APT, parity, discount rate and both currency approaches recompute', () => {
  check('The risk-free rate is 7 per cent, the market', Math.round((7 + 1.2 * (13 - 7)) * 10) / 10, '14.2');
  check('Under arbitrage pricing theory', Math.round((4 + 0.5 * 3 - 0.4 * 2 + 0.8 * 4) * 10) / 10, '7.9');
  const s0 = 84, rh = 0.06, rf = 0.03; const S = (t: number) => s0 * ((1 + rh) / (1 + rf)) ** t;
  check('The current spot rate is Rs 84', Math.round(S(1) * 100) / 100, '86.45');
  check('For the same data, what is the expected spot rate after two', Math.round(S(2) * 100) / 100, '88.96');
  const ra = (1 + rf) * (1.12 / 1.06) - 1; check('A company requires 12 per cent on a similar', Math.round(ra * 10000) / 100, '8.83');
  const home = 20 * S(1) / 1.12 + 40 * S(2) / 1.12 ** 2; const inv = 50 * s0;
  check('A foreign project needs US$ 50 lakh now', Math.round(home - inv), '181');
  const fc = 20 / (1 + ra) + 40 / (1 + ra) ** 2; check('For the same project, find the present value of the inflows in US$', Math.round(fc * 100) / 100, '52.15');
  assert.ok(Math.abs(fc * s0 - home) < 1e-6);
  check('For the same project, what is the profitability index', Math.round(home / inv * 100) / 100, '1.04');
  check('For the same project, what is the payback period by the foreign', 1 + 30 / 40, '1.75');
  check('For the same project, what is the payback period by the home', Math.round((1 + (inv - 20 * S(1)) / (40 * S(2))) * 100) / 100, '1.69');
});

test('ABFM B U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 23); assert.equal(b.items.length, 40);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 10, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
