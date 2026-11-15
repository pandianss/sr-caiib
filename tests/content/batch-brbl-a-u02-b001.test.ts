// Structure and arithmetic checks for batch BRBL-A-U02-B001 (control over organisation of banks: director proportions, voting caps, commission, subsidiary ceiling, fines, terms).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BRBL-A-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BRBL A U02 B001: proportions, caps and period arithmetic recompute', () => {
  check('A bank has a board of 12 directors', Math.ceil(0.51 * 12), '7');
  check('A bank has 400 crore total voting rights', 0.10 * 400, '40');
  check('If the Reserve Bank has raised the voting cap', Math.round(0.26 * 400), '104');
  check('Shares of a bank are issued at Rs 200 each', 0.025 * 200, '5');
  check('A company has paid-up share capital of Rs 500 crore', Math.min(0.3 * 500, 0.3 * 1200), '150');
  check('A person removed under Section 36AA breaches the order', 12 * 250, '3000');
  check('The Reserve Bank supersedes a bank board', 12 - 6, '6');
  check('A whole-time chairman is appointed for five years', 2021 + 5, '2026');
  check('A director other than the chairman has served continuously', 2018 + 8, '2026');
});

test('BRBL A U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 55); assert.equal(b.items.length, 74);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 8 && counts[k]! <= 20, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
