// Structure and calculation checks for batch BFM-C-U02-B001 (treasury products: T-bill and CP yield, repo cash and interest, corridor, SDF interest, forward rate and premium, mark-to-market, current yield, conversion value items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-C-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('BFM C U02 B001: treasury product figures recompute', () => {
  check('A 91-day treasury bill is priced at 98.80', rd((100 - 98.8) / 98.8 * 365 / 91 * 100, 2), '4.87');
  check('A 182-day treasury bill is priced at 97.00', rd(3 / 97 * 365 / 182 * 100, 2), '6.20');
  check('A bank buys Rs 50 crore face value', rd(50 * 98.9 / 100, 2), '49.45');
  check('A company issues commercial paper of face value Rs 10 crore', rd(10 * 98.5 / 100, 2), '9.85');
  check('For that commercial paper, what is the effective', rd(1.5 / 98.5 * 365 / 90 * 100, 2), '6.18');
  check('A bank repos government securities', 200 * 0.95, '190');
  const interest = 190 * 0.065 * 7 / 365;
  check('The Rs 190 crore is borrowed for 7 days', rd(interest, 3), '0.237');
  check('What is the repurchase price in that repo', rd(190 + interest, 3), '190.237');
  check('The policy repo rate is 6.00 per cent', rd((6.25 - 5.75) * 100, 0), '50');
  check('A bank places Rs 400 crore with the central bank', rd(4e9 * 0.0575 / 365 / 1e5, 2), '6.30');
  const fwd = 83 * (1 + 0.07 * 90 / 365) / (1 + 0.05 * 90 / 365);
  check('Spot USD/INR is 83.00. Interest rates are 7.00', rd(fwd, 2), '83.40');
  check('Spot USD/INR is 83.00 and the 90-day forward', rd((83.4 - 83) / 83 * 365 / 90 * 100, 2), '1.95');
  check('Rs 100 crore of government securities with a coupon', 100 * 2 / 100, '2');
  check('A bond with a 6 per cent coupon on face value', rd(6 / 95 * 100, 2), '6.32');
  check('A convertible bond of face value Rs 1,000', (1000 / 50) * 60, '1200');
  check('A bank has capital funds of Rs 12,000 crore', 0.4 * 12000, '4800');
  // courseware 91-day example recomputed
  assert.equal(rd((100 - 99.26) / 99.26 * 365 / 91 * 100, 2), 2.99);
});

test('BFM C U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 56); assert.equal(b.items.length, 87);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 9 && counts[k]! <= 19, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
