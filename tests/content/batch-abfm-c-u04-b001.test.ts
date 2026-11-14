// Structure and calculation checks for batch ABFM-C-U04-B001 (special cases of valuation: reinvestment, survival, payout, loan value, option payoff and normalised earnings items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-C-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM C U04 B001: special case valuation figures recompute', () => {
  check('A young firm expects its revenue to rise', 60 / 2.5, '24');
  check("A start-up's DCF value if it survives", 0.7 * 900 + 0.3 * 100, '660');
  check('The equity value of a young firm is Rs 1,200', (1200 - 100) / 10, '110');
  check('A bank has a retention ratio of 0.6', Math.round(0.6 * 15), '9');
  check('In stable growth a financial firm expects', Math.round((1 - 0.05 / 0.12) * 1000) / 10, '58.3');
  check('A bank earned Rs 1,000 crore, paid dividends', (300 + 200) / 1000 * 100, '50');
  const a = (1 - 1.06 ** -5) / 0.06; check('A bank holds loans of face value Rs 4,000', Math.round(300 * a + 4000 / 1.06 ** 5), '4253');
  check('A distressed firm has a liquidation value of Rs 800', Math.max(800 - 600, 0), '200');
  check('If the liquidation value of the same firm falls', Math.max(500 - 600, 0), '0');
  check('The operating assets of a company are valued separately', 900 + 100, '1000');
  check("A cyclical firm's earnings over a five-year cycle", (80 - 20 + 140 + 100 + 60) / 5, '72');
  check('A cyclical firm had an average return on capital', 0.10 * 1500, '150');
});

test('ABFM C U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 46); assert.equal(b.items.length, 68);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 18, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
