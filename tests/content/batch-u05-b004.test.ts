// Independent deterministic recomputation for batch BFM-A-U05-B004 (EDPMS, follow-up, factoring and forfaiting).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { div, mul, sub, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U05-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U05-B004 D007: factoring balance and forfaiting proceeds', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const adv = mul(d('250000'), d('0.80')), fee = mul(d('250000'), d('0.012')), bal = sub(sub(d('250000'), adv), fee);
  assert.equal(at(adv, 2), '200000.00'); assert.equal(at(fee, 2), '3000.00'); assert.equal(at(bal, 2), '47000.00');
  const disc = div(mul(mul(d('500000'), d('0.06')), d('180')), d('360'), 10), commit = div(mul(mul(d('500000'), d('0.01')), d('90')), d('360'), 10);
  assert.equal(at(disc, 2), '15000.00'); assert.equal(at(commit, 2), '1250.00'); assert.equal(at(sub(sub(d('500000'), disc), commit), 2), '483750.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['200,000.00', '3,000.00', '47,000.00', '15,000.00', '1,250.00', '483,750.00']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B004 D008: forfaiting discount', () => {
  const q = itemFor('D008') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  const disc = div(mul(mul(d('800000'), d('0.054')), d('120')), d('360'), 10);
  assert.equal(at(disc, 2), '14400.00'); assert.equal(q.numeric_rule.expected_answer, '14400.00');
  assert.deepEqual(gradeNumeric('14400', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '14400.00' });
  for (const wrong of ['43200', '785600', '14597.26']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U05-B004: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'C', D010: 'D', D011: 'B', D012: 'A', D013: 'C', D014: 'D', D015: 'B', D016: 'A', D017: 'C' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
