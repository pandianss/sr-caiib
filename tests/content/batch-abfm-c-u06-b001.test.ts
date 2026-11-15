// Structure and calculation checks for batch ABFM-C-U06-B001 (deal structuring: goodwill, bargain purchase, NCI, step-up tax saving, cost of debt, EPS by financing, interest cover, proration, convertibles and earn-out items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-C-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => (Math.round(x * 100) / 100);

test('ABFM C U06 B001: deal structuring figures recompute', () => {
  check('An acquirer pays Rs 600 crore for a target', 600 + 150 - 700, '50');
  check('An acquirer pays Rs 480 crore', 650 - (480 + 100), '70');
  check('The acquirer reports profit of Rs 400 crore', 400 + 150 - 0.3 * 150, '505');
  check('A taxable asset purchase steps up', r1(300 / 10 * 0.25), '7.5');
  check('Debentures carry interest of 10 per cent', r1(10 * (1 - 0.25)), '7.5');
  check('The combined firm earns Rs 600 crore after tax', r2(600 / (100 + 400 / 200)), '5.88');
  check('For the same firm, Rs 400 crore is instead raised as debt', r2((600 - 400 * 0.1 * 0.75) / 100), '5.70');
  check('A combined firm has EBIT of Rs 300 crore', 300 / 60, '5');
  check('An offer allows target holders to elect cash', 120 / 300 * 100, '40');
  check('A convertible bond of face value Rs 1,000', 1000 / 125, '8');
  check('Using the same bond, what is its conversion value', (1000 / 125) * 150, '1200');
  check('A deal pays Rs 500 crore at closing', r1(0.2 * (130 - 100)), '6.0');
  check('The target holders receive 0.6 of an acquirer share', 0.6 * 250, '150');
});

test('ABFM C U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 52); assert.equal(b.items.length, 76);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 18, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
