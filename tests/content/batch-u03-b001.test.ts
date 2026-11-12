// Independent deterministic recomputation for batch BFM-A-U03-B001.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U03-B001 D004: mirror account reconciliation', () => {
  const card = itemFor('D004') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const mirror = d('250000.00'), credit = d('20000.00'), charges = d('7500.00'), statement = d('262500.00');
  const withCredit = add(mirror, credit), expected = sub(withCredit, charges);
  assert.equal(at(withCredit, 2), '270000.00'); assert.equal(at(expected, 2), '262500.00');
  assert.equal(at(sub(expected, statement), 2), '0.00'); assert.equal(at(sub(statement, mirror), 2), '12500.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['250,000.00', '270,000.00', '262,500.00', '0.00']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('12,500.00'));
});

test('U03-B001 D007: expected statement balance', () => {
  const q = itemFor('D007') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const step1 = add(d('318400.00'), d('41250.00')), result = sub(step1, d('3150.00'));
  assert.equal(at(step1, 2), '359650.00'); assert.equal(at(result, 2), '356500.00'); assert.equal(q.numeric_rule.expected_answer, '356500.00');
  assert.deepEqual(gradeNumeric('356500', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '356500.00' });
  // Wrong readings: charges added, or charges ignored, or credit deducted.
  for (const wrong of [at(add(step1, d('3150.00')), 2), at(step1, 2), at(sub(sub(d('318400.00'), d('41250.00')), d('3150.00')), 2)]) {
    const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong);
  }
  const shown = (q.worked_solution_steps ?? []).map(s => s.intermediate_result).join(' | ');
  for (const t of ['359,650.00', '356,500.00']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U03-B001: choice questions well formed; all drafts', () => {
  const answers: Record<string, string> = { D005: 'A', D006: 'C', D008: 'A', D009: 'A' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
