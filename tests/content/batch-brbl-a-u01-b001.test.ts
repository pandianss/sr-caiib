// Structure and arithmetic checks for batch BRBL-A-U01-B001 (legal framework of regulation of banks: disposal periods, board size, year arithmetic).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BRBL-A-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(computed, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BRBL A U01 B001: period and count arithmetic recomputes', () => {
  check('A bank acquires immovable property in satisfaction of a claim on 1 April 2020', 2020 + 7, '2027');
  check('The Reserve Bank grants the maximum extension', 2020 + 7 + 5, '2032');
  check('A deposit was last operated in 2015', 2015 + 10, '2025');
  check('The Central Board of the Reserve Bank has one Governor', 1 + 4 + 4 + 10 + 2, '21');
  check('Of the 21 maximum members', 4 + 10, '14');
  check('The seven associate banks merged', 2018 - 1955, '63');
  check('The Banking Companies Act came into force in 1949', 1966 - 1949, '17');
  check('The co-operative banks were brought under the Banking Regulation Act in 1965', 2020 - 1965, '55');
});

test('BRBL A U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 48); assert.equal(b.items.length, 65);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 18, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
