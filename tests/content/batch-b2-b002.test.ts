// Structural checks for batch BFM-B-U02-B002 (climate risk and green deposits). No calculations.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U02-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string) => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};

test('B2-B002: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 15; i++) {
    const q = itemFor('D' + String(4 + i).padStart(3, '0')) as QuestionItem;
    assert.equal(q.question_type, 'single_choice');
    if (q.question_type !== 'single_choice') continue;
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  assert.equal(b.items.length, 18);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});

test('B2-B002: every item maps to the climate risk objective', () => {
  for (const m of b.draft_item_map) assert.ok(JSON.stringify(m).includes('BFM::MOD_B::U02::LO_08') || b.items.some(i => i.id === m.item_id && JSON.stringify(i).includes('BFM::MOD_B::U02::LO_08')));
});
