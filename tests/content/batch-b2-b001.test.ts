// Independent deterministic recomputation for batch BFM-B-U02-B001 (risks in banking business).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const margin = (repo: string, spread: string, dep: string) => sub(add(d(repo), d(spread)), d(dep));

test('B2-B001 D010: basis risk margins', () => {
  assert.equal(at(margin('6.50', '3.00', '7.00'), 2), '2.50'); assert.equal(at(margin('6.15', '3.00', '7.00'), 2), '2.15'); assert.equal(at(margin('6.85', '3.00', '7.00'), 2), '2.85');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['9.50%', '2.50%', '2.15%', '2.85%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B2-B001 D011: repricing gap effect', () => {
  const gap = sub(d('900'), d('650')); assert.equal(at(gap, 0), '250'); assert.equal(at(mul(gap, d('0.01')), 1), '2.5');
  const shown = shownOf(itemFor('D011') as StudyCard);
  for (const t of ['250', '+₹2.5 crore', '−₹2.5 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B2-B001 D040 and D041: numerical questions', () => {
  const q1 = itemFor('D040') as QuestionItem; if (q1.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(margin('5.50', '3.25', '6.75'), 2), '2.00'); assert.equal(q1.numeric_rule.expected_answer, '2.00');
  for (const wrong of ['2.50', '2.25', '1.50', '8.75']) { const g = gradeNumeric(wrong, q1.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q2 = itemFor('D041') as QuestionItem; if (q2.question_type !== 'numeric_input') throw new Error('numeric');
  const gap = sub(d('1240'), d('1515')); assert.equal(at(gap, 0), '-275'); assert.equal(at(mul(gap, d('0.005')), 3), '-1.375');
  assert.equal(q2.numeric_rule.expected_answer, '1.375');
  assert.deepEqual(gradeNumeric('1.375', q2.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '1.375' });
  for (const wrong of ['2.750', '1.376', '13.750', '1.275']) { const g = gradeNumeric(wrong, q2.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('B2-B001: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 28; i++) {
    const id = 'D' + String(12 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
