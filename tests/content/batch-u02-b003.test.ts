// Independent deterministic recomputation for batch BFM-A-U02-B003 (LRS: limit history, current account exits, capital routes, bank duties).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sub, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U02-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U02-B003 D006: studies estimate above the ceiling', () => {
  const card = itemFor('D006') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(at(sub(d('310000'), d('250000')), 0), '60000');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['250,000', '60,000', 'No RBI approval needed']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('60,000'));
});

test('U02-B003 D012: further release on the estimate', () => {
  const q = itemFor('D012') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const more = sub(d('345500'), d('250000'));
  assert.equal(at(more, 0), '95500'); assert.equal(q.numeric_rule.expected_answer, '95500');
  assert.deepEqual(gradeNumeric('95500', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '95500' });
  for (const wrong of ['345500', '250000', '96500']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U02-B003: limit history is monotone except the 2013 cut', () => {
  const steps = [25000, 50000, 100000, 200000, 75000, 125000, 250000];
  const falls = steps.filter((v, i) => i > 0 && v < steps[i - 1]!);
  assert.deepEqual(falls, [75000]);
  const card = itemFor('D001') as StudyCard;
  const text = (card as StudyCard & { core_explanation_md: string }).core_explanation_md;
  for (const v of ['25,000', '50,000', '1,00,000', '2,00,000', '75,000', '1,25,000', '2,50,000']) assert.ok(text.includes(v), `${v} missing`);
});

test('U02-B003: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D007: 'C', D008: 'B', D009: 'D', D010: 'A', D011: 'C', D013: 'D', D014: 'B', D015: 'C' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
