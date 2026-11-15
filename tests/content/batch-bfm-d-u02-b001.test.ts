// Structure and calculation checks for batch BFM-D-U02-B001 (capital adequacy and Basel: total RWA with the 12.5 factor, CRAR, required capital, surplus, Tier II cap, Pillar 2 buffer, stress ratio, risk aggregation).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-D-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BFM D U02 B001: capital adequacy figures recompute', () => {
  const rwa = 8000 + 12.5 * 40 + 12.5 * 60;
  check('A bank has credit RWA of Rs 8,000 crore', rwa, '9250');
  check('With regulatory capital of Rs 925 crore', 925 / rwa * 100, '10');
  check('Assume a minimum capital ratio of 9 per cent', 0.09 * rwa, '832.50');
  check('With capital of Rs 925 crore and the same requirement', 925 - 0.09 * rwa, '92.50');
  check('Tier I capital is Rs 600 crore and Tier II is Rs 450', Math.min(450, 600), '450');
  check('Tier I capital is Rs 400 crore and Tier II is Rs 700', 400 + Math.min(700, 400), '800');
  check('A bank holds capital of Rs 1,100 crore', 1100 / (10000 + 12.5 * 80 + 12.5 * 120) * 100, '8.80');
  check('A bank has total RWA of Rs 12,500 crore and a market', 12.5 * 80 / 12500 * 100, '8');
  check('Pillar 2 adds an assumed buffer', 0.105 * 10000, '1050');
  check('Under a stress scenario, losses of Rs 300 crore', (1200 - 300) / 10000 * 100, '9');
  check('A diversification assumption reduces the sum', 0.85 * (400 + 300 + 200), '765');
  check('With all correlations set to 1', 400 + 300 + 200, '900');
});

test('BFM D U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 32); assert.equal(b.items.length, 51);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 12, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
