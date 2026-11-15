// Structure and calculation checks for batch BFM-D-U04-B001 (liquidity management: liquidity ratios, maturity ladder net flows and cumulative gaps, scenario shortfalls, limits, short-term gap).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-D-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BFM D U04 B001: liquidity figures recompute', () => {
  check('A bank has gross loans of Rs 800 crore', (800 - 30 - 10) / 1000 * 100, '76');
  check('Core deposits are Rs 600 crore', 600 / 1200 * 100, '50');
  check('Liquid assets are Rs 240 crore and total assets', 240 / 1200 * 100, '20');
  check('Short-term liabilities are Rs 300 crore and liquid', 300 / 240, '1.25');
  check('Volatile liabilities are Rs 180 crore', 180 / 1200 * 100, '15');
  check('On Day 1 a bank expects inflows', 100 + 80 + 50 + 10, '240');
  check('Day 1 outflows are maturing liabilities 50', 240 - (50 + 10 + 30 + 10), '140');
  check('Day 2 shows inflows of 250', 140 + (250 - 240), '150');
  check('The Day 3 to 15 bucket has inflows of 320', 150 + (320 - 350), '120');
  check('Under an institution-specific crisis', 250 - 240, '10');
  check('Under a general market crisis', 170 - 145, '25');
  check('Assume a tolerance limit that the cumulative negative', 0.15 * 2000, '300');
  check('A bank has short-term liabilities of Rs 900 crore', 900 - 700, '200');
  // courseware scenario table recomputed: normal 240-100=140; institution crisis 240-250=-10; market crisis 145-170=-25
  assert.equal(100 + 80 + 50 + 10 - (50 + 10 + 30 + 10), 140);
  assert.equal(100 + 80 + 60 + 0 - (50 + 10 + 140 + 50), -10);
  assert.equal(80 + 60 + 0 + 5 - (50 + 10 + 60 + 50), -25);
});

test('BFM D U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 45); assert.equal(b.items.length, 70);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
