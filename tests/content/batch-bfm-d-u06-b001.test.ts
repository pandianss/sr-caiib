// Structure and calculation checks for batch BFM-D-U06-B001 (RAROC and profit planning: portfolio yield, risk-weighted assets, capital, NPA income loss, profit, VaR risk capital, RAPM, EVA, RAROC items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-D-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const rd = (x: number, d: number) => Math.round(x * 10 ** d + 1e-9) / 10 ** d;

test('BFM D U06 B001: profit planning and RAROC figures recompute', () => {
  check('A bank deploys Rs 1,000 crore: Rs 400 crore', 0.06 * 400 + 0.08 * 600, '72');
  check('What is the portfolio yield', 72 / 1000 * 100, '7.20');
  check('The Rs 600 crore of lending carries a risk weight', 0.2 * 600, '120');
  check('With a capital ratio of 9 per cent', rd(0.09 * 120, 2), '10.80');
  check('Another mix puts Rs 300 crore', 0.2 * 300 + 0.5 * 400, '260');
  check('For that mix, what is the portfolio yield', (0.06 * 300 + 0.08 * 300 + 0.10 * 400) / 1000 * 100, '8.20');
  check('A bank with capital of Rs 500 crore', rd(500 / 0.09 - 5000, 2), '555.56');
  check('How much additional lending at a 20 per cent', rd((500 / 0.09 - 5000) / 0.2, 2), '2777.78');
  check('A bank has non-performing advances of Rs 200 crore', 0.09 * 200, '18');
  check('A bank has interest income of Rs 900 crore, fee income', 900 + 120 + 80 - 540 - 200 - 100, '260');
  check('A trader deals USD 200 million with daily volatility', rd(200 * 0.04 * 2.33, 2), '18.64');
  check('The same trader earns a profit of USD 10 million', rd(10 / (200 * 0.04 * 2.33) * 100, 1), '53.6');
  check('A second trader deals USD 100 million', rd(100 * 0.12 * 2.33, 2), '27.96');
  check('What is that second trader RAPM', rd(10 / (100 * 0.12 * 2.33) * 100, 1), '35.8');
  check('A business line earns a profit of Rs 120 crore', 120 - 0.12 * 800, '24');
  check('A product earns Rs 60 crore on risk capital', 60 / 400 * 100, '15');
  // courseware Table 31.1 recomputed
  assert.equal(0.06 * 400 + 0.08 * 600, 72); assert.equal(0.06 * 300 + 0.08 * 300 + 0.10 * 400, 82); assert.equal(0.06 * 300 + 0.08 * 300 + 0.10 * 200 + 0.12 * 200, 86);
  assert.equal(rd(0.08 * 260, 2), 20.8); assert.equal(rd(0.115 * 360, 2), 41.4); assert.equal(rd(500 / 0.09 - 5000, 2) / 0.2 > 2777, true);
});

test('BFM D U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 23); assert.equal(b.items.length, 46);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 10, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
