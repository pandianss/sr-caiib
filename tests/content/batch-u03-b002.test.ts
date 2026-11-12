// Deterministic checks for batch BFM-A-U03-B002 (RTGS, NEFT, CHAPS caution).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cmp, mustDec } from '../../src/core/decimal.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U03-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};

test('U03-B002 D003: RTGS eligibility against the 2,00,000 floor', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const floor = mustDec('200000');
  assert.ok(cmp(mustDec('150000'), floor) < 0); assert.ok(cmp(mustDec('200000'), floor) >= 0); assert.ok(cmp(mustDec('1240000'), floor) >= 0);
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['₹2,00,000', 'A is below the floor', 'B is eligible', 'C is eligible']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U03-B002: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D005: 'B', D006: 'C', D007: 'D', D008: 'C', D009: 'A' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
    const right = q.options.find(o => o.option_id === correct)!.text_md;
    if (id === 'D005') assert.ok(right.includes('2,00,000'));
    if (id === 'D007') assert.ok(right.includes('50,000'));
    if (id === 'D006') assert.ok(right.includes('half-hourly'));
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
