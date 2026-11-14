// Structure and calculation checks for batch ABFM-C-U01-B001 (corporate valuation: multiples, NOPLAT, FCF, WACC and terminal value items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-C-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM C U01 B001: valuation approaches, NOPLAT, FCF, WACC and terminal value recompute', () => {
  const r1 = (x: number) => Math.round(x * 10) / 10;
  check('A company has 5 lakh shares trading', 500000 * 120 / 1e7 + 4, '10');
  check('A balance sheet shows total assets of Rs 150', 150 - 30, '120'); assert.equal(40 + 30 + 50, 120);
  check('Peer companies trade at a price-earnings', 12 * 8, '96');
  check('Peers trade at an enterprise value of 7', 7 * 60 - 100, '320');
  check('A comparable flat sold for Rs 5 crore', r1(5 * (1 + 0.05 + 0.05 + 0.02)), '5.6');
  const noplat = 200 - 0.3 * 200; check('A firm has EBIT of Rs 200 crore', noplat, '140');
  check("The firm's operating invested capital", noplat / 700 * 100, '20');
  check('Net fixed assets plus net current assets', 820 - 790, '30');
  check('Using the NOPLAT of Rs 140 crore', noplat - 30, '110');
  const wacc = 0.4 * 10 * 0.7 + 0.6 * 15; check('A firm is financed 40 per cent by debt', r1(wacc), '11.8');
  check('Free cash flow in the first year after', r1(105 / (0.118 - 0.05)), '1544.1');
  check('By the value driver method', r1(140 * (1 - 0.05 / 0.20) / (0.118 - 0.05)), '1544.1');
  const w = 0.118; const pv = [100, 110, 120].reduce((s, f, i) => s + f / (1 + w) ** (i + 1), 0); const tv = 126 / (w - 0.05);
  check('Free cash flows for the three years of the explicit', Math.round(pv + tv / (1 + w) ** 3 + 50), '1639');
});

test('ABFM C U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 35); assert.equal(b.items.length, 57);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 14, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
