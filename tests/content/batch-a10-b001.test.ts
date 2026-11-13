// Structural check for batch BFM-A-U10-B001 (technology in international banking; no calculations).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentItem, DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U10-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};

test('A10-B001: answers as intended, four distinct options, all drafts', () => {
  const answers: Record<string, string> = { D007: 'B', D008: 'C', D009: 'D', D010: 'A', D011: 'C', D012: 'B', D013: 'D', D014: 'A', D015: 'B', D016: 'C', D017: 'D', D018: 'A', D019: 'B', D020: 'C', D021: 'D', D022: 'A', D023: 'B', D024: 'C', D025: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  assert.equal(b.items.length, 25);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
