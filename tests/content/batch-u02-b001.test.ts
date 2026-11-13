// Independent deterministic recomputation for batch BFM-A-U02-B001 (LRS).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const limit = d('250000');

test('U02-B001 D008: headroom with a sole proprietorship', () => {
  const card = itemFor('D008') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const used = add(add(d('80000'), d('55000')), d('40000')), left = sub(limit, used), over = sub(d('90000'), left);
  assert.equal(at(used, 0), '175000'); assert.equal(at(left, 0), '75000'); assert.equal(at(over, 0), '15000');
  assert.equal(at(add(used, d('75000')), 0), '250000'); // self-check: earlier USD 75,000 from the firm still counts
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['175,000', '75,000', '15,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('75,000') && card.final_answer_with_unit.includes('15,000'));
});

test('U02-B001 D012: remaining limit', () => {
  const q = itemFor('D012') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const used = add(add(d('65000'), d('48000')), d('72000')), left = sub(limit, used);
  assert.equal(at(used, 0), '185000'); assert.equal(at(left, 0), '65000'); assert.equal(q.numeric_rule.expected_answer, '65000');
  assert.deepEqual(gradeNumeric('65000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '65000' });
  for (const wrong of [at(used, 0), at(sub(limit, d('65000')), 0), at(sub(limit, add(d('65000'), d('72000'))), 0)]) {
    const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong);
  }
});

test('U02-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'B', D010: 'A', D011: 'D', D013: 'C', D014: 'B', D015: 'D', D016: 'A', D017: 'C', D018: 'B', D019: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  assert.ok((itemFor('D019') as QuestionItem & { options: { option_id: string; text_md: string }[] }).options.find(o => o.option_id === 'D')!.text_md.includes('180'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
