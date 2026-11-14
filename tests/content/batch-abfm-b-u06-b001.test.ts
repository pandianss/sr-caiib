// Structure and calculation checks for batch ABFM-B-U06-B001 (decision making: activity based CVP, relevant cost and ABC items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-B-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM B U06 B001: activity based CVP, relevant costs and ABC recompute', () => {
  const contrib = 700 - 500; const setups = 6000 / 20; const fc = 360000 + setups * 400;
  check('A firm sells at Rs 700 a unit', setups, '300');
  check('For the same firm, what is the break-even point under activity', fc / contrib, '2400');
  const profit = 6000 * contrib - fc; check('For the same firm, what is the monthly profit', profit, '720000');
  const fc2 = 360000 + (6000 / 40) * 400 + 20000; check('The firm doubles the batch size', fc2 / contrib, '2200');
  check('By how much does monthly profit rise', (6000 * contrib - fc2) - profit, '40000');
  check('A customer orders 80 units of a material', 50 * 9 + 30 * 14, '870');
  check('A part can be bought at Rs 40', (14 + 12 + 6) * 10000 + 120000 - 40 * 10000, '40000');
  check('A special order for 2,000 units', (55 - 42) * 2000, '26000');
  check("A firm's assembly line costs", 1200000 / 10000, '120');
  check('A two-wheeler needs 15 assembly labour hours', 1200000 / 10000 * 15, '1800');
  const su = 240000 / 80, insp = 90000 / 300; const a1 = 50 * su + 120 * insp;
  check('Overheads are Rs 2,40,000 for set-ups', a1, '186000');
  const bOver = 30 * su + 180 * insp; check('Product B uses the remaining 30 set-ups', bOver / 3000, '48');
  assert.equal(a1 + bOver, 240000 + 90000);
});

test('ABFM B U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 25); assert.equal(b.items.length, 45);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 12, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
