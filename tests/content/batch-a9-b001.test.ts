// Independent deterministic recomputation for batch BFM-A-U09-B001 (IFSC and GIFT City).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sub, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U09-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('A9-B001 D008: capital shortfall for a banking unit', () => {
  const card = itemFor('D008') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(at(sub(d('20'), d('14.5')), 1), '5.5'); assert.equal(at(sub(d('50'), d('14.5')), 1), '35.5');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['5.5 million', '35.5 million']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('A9-B001 D027: numerical question', () => {
  const q = itemFor('D029') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(sub(d('20'), d('11.75')), 2), '8.25'); assert.equal(q.numeric_rule.expected_answer, '8.25');
  assert.deepEqual(gradeNumeric('8.25', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '8.25' });
  for (const wrong of ['38.25', '11.75', '8.75', '31.75']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('A9-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'B', D010: 'C', D011: 'D', D012: 'A', D013: 'C', D014: 'B', D015: 'D', D016: 'A', D017: 'B', D018: 'C', D019: 'D', D020: 'A', D021: 'B', D022: 'C', D023: 'D', D024: 'A', D025: 'B', D026: 'C', D027: 'D', D028: 'A' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
