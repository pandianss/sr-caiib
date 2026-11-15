// Structure and calculation checks for batch ABFM-D-U03-B001 (private equity and venture capital: multiples, required growth, joint probability, power-law portfolio, fees, carry, hurdle, buyout equity, exit return, post-money, preference and funnel items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-D-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const rd = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

test('ABFM D U03 B001: private equity and venture capital figures recompute', () => {
  check('A venture fund invests Rs 50 crore and its investments', 500 / 50, '10');
  check('A fund wants its assets to grow ten times', rd((10 ** 0.1 - 1) * 100, 1), '25.9');
  check('A venture needs eight independent events', Math.round(0.8 ** 8 * 100), '17');
  check('If one of the eight events has only a 50 per cent chance', Math.round(0.8 ** 7 * 0.5 * 100), '10');
  const total = 12 * 2 * 2 + 2 * 230; check('A fund invests Rs 2 crore in each of 25 companies', total, '508');
  check('For the same fund (Rs 50 crore invested', rd(total / 50, 2), '10.16');
  check('A fund of Rs 400 crore charges a management fee', 0.025 * 400, '10');
  check('Over a ten-year fund life the same fee', 10 * 10, '100');
  check('A fund earns a profit of Rs 200 crore after returning', 0.2 * 200, '40');
  check('For the same fund, how much of the Rs 200 crore profit', 200 - 0.2 * 200, '160');
  check('A fund must earn a hurdle return of 12 per cent', rd(100 * 1.12 ** 3, 2), '140.49');
  check('A private equity fund of Rs 200 crore has limited partners', rd(0.01 * 200, 0), '2');
  check('A buyout costs Rs 500 crore', 500 - 0.9 * 500, '50');
  check('A private equity fund sells its investment after 5 years', rd((3 ** 0.2 - 1) * 100, 1), '24.6');
  check('A venture capital firm invests Rs 15 crore for a 20 per cent', 15 / 0.2, '75');
  check('A venture-backed company is sold for Rs 30 crore', 30 - 20, '10');
  check('A venture firm sources 2,000 deals', rd(0.015 * 2000, 0), '30');
  assert.equal(rd(1.25 ** 10, 1), 9.3);
});

test('ABFM D U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 55); assert.equal(b.items.length, 88);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 9 && counts[k]! <= 20, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
