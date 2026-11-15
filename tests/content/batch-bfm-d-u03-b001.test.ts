// Structure and calculation checks for batch BFM-D-U03-B001 (asset classification and provisioning: substandard, doubtful and loss provisions, standard asset provision, PCR, net NPA, gross NPA ratio, resolution provision items).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-D-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const check = (stemStart: string, computed: number, expected: string) => {
  const q = b.items.find(i => i.item_type === 'question' && (i as QuestionItem).stem_md.startsWith(stemStart)) as QuestionItem | undefined;
  assert.ok(q, stemStart); if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(q.numeric_rule.expected_answer, expected); assert.equal(Math.round(computed * 1e6) / 1e6, Number(expected));
  const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true);
};

test('BFM D U03 B001: provisioning figures recompute', () => {
  check('A substandard secured asset has an outstanding of Rs 200 lakh', 0.15 * 200, '30');
  check('The same account is unsecured ab initio', 0.25 * 200, '50');
  check('A doubtful asset (one to three years)', (100 - 60) + 0.4 * 60, '64');
  check('For a doubtful asset of more than three years', (80 - 50) + 1.0 * 50, '80');
  check('A loss asset of Rs 40 lakh remains', 40, '40');
  check('Assume a general provision of 0.40 per cent', 0.004 * 50000, '200');
  check('A bank has gross NPAs of Rs 1,000 crore and holds provisions', 720 / 1000 * 100, '72');
  check('With the same figures, what is the net NPA', 1000 - 720, '280');
  check('Gross NPAs are Rs 1,000 crore and gross advances', 1000 / 25000 * 100, '4');
  check('A security assessed at Rs 100 lakh', 0.5 * 100 - 45, '5');
  check('Interest of Rs 12 lakh was credited', 12, '12');
  check('A viable resolution plan is not implemented in time', 0.2 * 500, '100');
  check('If provisions already held are Rs 150 crore', 150 + 100, '250');
  check('A term loan instalment fell due on 1 January', 90 + 1, '91');
});

test('BFM D U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 43); assert.equal(b.items.length, 67);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id] = (counts[q.correct_option_id] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 16, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
