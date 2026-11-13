// Independent deterministic recomputation for batch BFM-A-U03-B003 (NRI accounts, loans).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U03-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const limit = d('1000000');

test('U03-B003 D007: remaining NRO allowance in January', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const used = add(d('420000'), d('310000')), left = sub(limit, used), over = sub(d('350000'), left);
  assert.equal(at(used, 0), '730000'); assert.equal(at(left, 0), '270000'); assert.equal(at(over, 0), '80000');
  assert.equal(at(sub(left, d('100000')), 0), '170000'); // self-check: NRE transfer of 100,000 leaves 170,000
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['730,000', '270,000', '80,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('270,000') && card.final_answer_with_unit.includes('80,000'));
});

test('U03-B003 D008: remaining allowance counts the NRE transfer', () => {
  const q = itemFor('D008') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const used = add(d('640000'), d('90000')), left = sub(limit, used);
  assert.equal(at(used, 0), '730000'); assert.equal(at(left, 0), '270000'); assert.equal(q.numeric_rule.expected_answer, '270000');
  assert.deepEqual(gradeNumeric('270000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '270000' });
  // Wrong readings: ignoring the NRE transfer, or adding it to the limit.
  for (const wrong of [at(sub(limit, d('640000')), 0), at(sub(limit, d('90000')), 0), at(sub(limit, d('730000')).n < 0n ? d('0') : add(limit, d('90000')), 0)]) {
    const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong);
  }
});

test('U03-B003: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'B', D010: 'D', D011: 'A', D012: 'B', D013: 'C', D014: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  assert.ok((itemFor('D014') as QuestionItem & { options: { option_id: string; text_md: string }[] }).options.find(o => o.option_id === 'D')!.text_md.includes('1 million'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
