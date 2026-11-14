// Structure and calculation checks for batch ABFM-C-U03-B001 (relative valuation: equity and enterprise value multiples and NAV items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-C-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM C U03 B001: equity and enterprise value multiples, NAV and stock and debt recompute', () => {
  const r1 = (x: number) => Math.round(x * 10) / 10; const r2 = (x: number) => Math.round(x * 100) / 100;
  check('A company has a return on equity of 15', r1(0.4 / (0.14 - 0.15 * 0.6)), '8.0');
  check('A company has ROE of 20 per cent, a payout', r1(0.2 * 0.5 / (0.15 - 0.10)), '2.0');
  check('A company has a net profit margin of 8', r2(0.08 * 1.1 * 0.5 / (0.16 - 0.10)), '0.73');
  check('A stock has a P/E of 18', r1(18 / 12), '1.5');
  check("A company's P/E is 15", r2(15 / 20), '0.75');
  check('A company has equity of Rs 600 crore', 600 + 250 - 50, '800');
  check('A company has ROIC of 18 per cent, growth of 8', r2((0.18 - 0.08) * 0.9 * 0.7 / (0.18 * (0.12 - 0.08))), '8.75');
  check('A company has a tax rate of 25 per cent', r1(0.75 * 0.6 / (0.13 - 0.07)), '7.5');
  check('A company has a WACC of 15 per cent and stable', r1(1 / (0.15 - 0.09)), '16.7');
  check('A company has ROIC of 16 per cent, growth', r1((0.16 - 0.08) / (0.12 - 0.08)), '2.0');
  check('Two comparable firms trade at EV/EBITDA', (7 * 200 + 1.2 * 900) / 2, '1240');
  check("A company's assets at replacement", (400 + 300 + 50 - 100) / 5, '130');
  check('A listed company has 20 crore shares', 20 * 150 + 800, '3800');
  assert.equal(r2(0.063 / 0.0072), 8.75); assert.equal(Math.round(0.3 / (0.15 - 0.20 * 0.7)), 30);
});

test('ABFM C U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 37); assert.equal(b.items.length, 57);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 14, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
