// Independent deterministic recomputation for batch BFM-A-U05-B002 (write-off, set-off, EEFC, export finance).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, mustDec, round, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U05-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U05-B002 D007: write-off limits for two exporters', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const a = d('360000000'), s = d('240000000');
  const selfOrd = mul(a, d('0.05')), bankOrd = mul(a, d('0.10')), selfSh = mul(s, d('0.10')), bankSh = mul(s, d('0.10'));
  assert.equal(at(selfOrd, 2), '18000000.00'); assert.equal(at(bankOrd, 2), '36000000.00'); assert.equal(at(selfSh, 2), '24000000.00'); assert.equal(at(bankSh, 2), '24000000.00');
  const shown = card.worked_steps.map(x => x.intermediate_result).join(' | ');
  for (const v of [selfOrd, bankOrd, selfSh, bankSh]) assert.ok(shown.includes(formatIndian(v, 2)), `${formatIndian(v, 2)} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('1,80,00,000.00') && card.final_answer_with_unit.includes('3,60,00,000.00'));
});

test('U05-B002 D008: status holder self-write-off', () => {
  const q = itemFor('D008') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('240000000'), d('0.10')), 2), '24000000.00'); assert.equal(q.numeric_rule.expected_answer, '24000000.00');
  assert.deepEqual(gradeNumeric('24000000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '24000000.00' });
  for (const wrong of ['12000000', '2400000', '240000000']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U05-B002: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'C', D010: 'D', D011: 'B', D012: 'A', D013: 'C', D014: 'D', D015: 'B', D016: 'C', D017: 'A' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
