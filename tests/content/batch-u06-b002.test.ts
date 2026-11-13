// Deterministic checks for batch BFM-A-U06-B002 (reporting of foreign investment).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U06-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const addDays = (s: string, n: number) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) + n * 86400000).toISOString().slice(0, 10);

test('U06-B002 D004: filing dates', () => {
  const card = itemFor('D004') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(addDays('2026-03-05', 30), '2026-04-04');
  assert.equal(addDays('2026-01-12', 60), '2026-03-13');
  assert.equal(addDays('2026-01-20', 60), '2026-03-21'); // self-check: counting from the transfer date instead
  assert.ok(addDays('2026-01-12', 60) < addDays('2026-01-20', 60));
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['4 April 2026', '13 March 2026', '15 July 2026']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U06-B002: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D006: 'B', D007: 'C', D008: 'D', D009: 'A', D010: 'C', D011: 'B', D012: 'D', D013: 'C', D014: 'B' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q14 = itemFor('D014') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q14.options.find(o => o.option_id === 'B')!.text_md === '4 April 2026');
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
