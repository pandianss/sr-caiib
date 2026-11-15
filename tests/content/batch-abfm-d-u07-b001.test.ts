// Structure and calculation checks for batch ABFM-D-U07-B001 (special purpose acquisition companies: founder share, stake, value, approval threshold, redemption, trust, target size, fee, net-settled warrants and loss items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABFM-D-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const numericAt = (stemStart: string): QuestionItem => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); return q;
};
const check = (stemStart: string, computed: number, expected: string) => {
  const q = numericAt(stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('ABFM D U07 B001: SPAC figures recompute', () => {
  const founders = 0.25 * 40;
  check('A SPAC has 40 million public shares and the sponsor', founders, '10');
  check('With 40 million public shares and 10 million founder', founders / (founders + 40) * 100, '20');
  check('The founders hold 10 million shares and the shares trade', 10 * 800 / 10, '800');
  const total = founders + 40; check('Founders hold 10 million shares and there are 40', ((total / 2 - founders) / 40) * 100, '37.5');
  check('A SPAC raises Rs 2,000 crore in its IPO', 0.3 * 2000, '600');
  check('After that redemption, how much remains', 2000 - 600, '1400');
  check('A SPAC with a trust of Rs 1,500 crore', 0.8 * 1500, '1200');
  check('An investment bank charges 10 per cent', 0.1 * 2000, '200');
  check('A holder has 1 million founder warrants', 1000000 * (1000 - 800) / 1000 / 1000, '200');
  check('A unit contains one share and half a warrant', 0.5 * 40, '20');
  check('A SPAC has a 24-month deadline', 24 - 14, '10');
  check('A sponsor spends Rs 70 crore', 70, '70');
  assert.equal(0.25 / 1.25, 0.2);
});

test('ABFM D U07 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 45); assert.equal(b.items.length, 68);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 7 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
