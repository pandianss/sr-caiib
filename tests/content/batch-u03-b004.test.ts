// Deterministic checks for batch BFM-A-U03-B004 (facilities to NRIs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cmp, mustDec, sub, toPlain, round } from '../../src/core/decimal.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U03-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};

test('U03-B004 D005: two-residential-property cap', () => {
  const card = itemFor('D005') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const flats = mustDec('3'), cap = mustDec('2');
  const repatriable = cmp(flats, cap) < 0 ? flats : cap;
  assert.equal(toPlain(round(repatriable, 0, 'HALF_UP'), 0), '2');
  assert.equal(toPlain(round(sub(flats, repatriable), 0, 'HALF_UP'), 0), '1');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['2 flats', '1 flat whose proceeds stay in India']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U03-B004: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D006: 'C', D007: 'A', D008: 'D', D009: 'B', D010: 'C', D011: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
    const right = q.options.find(o => o.option_id === correct)!.text_md;
    if (id === 'D006') assert.ok(right.includes('NRO'));
    if (id === 'D008') assert.ok(right.includes('farm house'));
    if (id === 'D010') assert.ok(right.includes('two'));
    if (id === 'D011') assert.ok(right.includes('Any individual'));
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
