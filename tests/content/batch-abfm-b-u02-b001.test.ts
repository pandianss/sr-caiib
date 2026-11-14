// Structure and calculation checks for batch ABFM-B-U02-B001 (leverages: DOL, DFL and DTL items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-B-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM B U02 B001: contribution, leverages, break-even, EPS and coverage recompute', () => {
  const contribution = (75 - 45) * 8000; check('A firm sells 8,000 units', contribution, '240000');
  const ebit = contribution - 150000; const dol = contribution / ebit;
  check('For the same firm (8,000 units', Math.round(dol * 100) / 100, '2.67');
  check('How many units must the same firm', 150000 / (75 - 45), '5000');
  const newEbit = (7200 * 30) - 150000; check('Using the degree of operating leverage', Math.round(((ebit - newEbit) / ebit) * 1000) / 10, '26.7');
  check('A firm has EBIT of Rs 6,00,000', Math.round(600000 / 400000 * 10) / 10, '1.5');
  const eps0 = (600000 - 200000) * 0.6 / 60000; const eps1 = (720000 - 200000) * 0.6 / 60000;
  check('The same firm has 60,000 shares', Math.round(eps1 * 10) / 10, '5.2'); assert.equal(Math.round((eps1 / eps0 - 1) * 1000) / 10, 30);
  const c2 = 1500000, f2 = 900000, i2 = 100000; check('A firm has contribution of Rs 15,00,000', Math.round(c2 / (c2 - f2 - i2) * 10) / 10, '3.0');
  assert.equal(c2 / (c2 - f2) * ((c2 - f2) / (c2 - f2 - i2)), c2 / (c2 - f2 - i2));
  check('For the same firm (EBIT Rs 6,00,000', 600000 / 100000, '6');
});

test('ABFM B U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 23); assert.equal(b.items.length, 37);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 10, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
