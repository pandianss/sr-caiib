// Deterministic checks for batch BFM-A-U04-B001 (letters of credit: history, parties, types, usance date).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const addDays = (iso: string, days: number) => { const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + days * 86400000; return new Date(t).toISOString().slice(0, 10); };

test('U04-B001 D007: usance due date and the day count', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(addDays('2026-01-18', 90), '2026-04-18');
  assert.equal(addDays('2026-01-25', 90), '2026-04-25'); // self-check: draft dated a week later
  assert.equal(31 - 18, 13); assert.equal(13 + 28, 41); assert.equal(41 + 31, 72); assert.equal(90 - 72, 18);
  assert.equal(addDays('2026-01-18', 90 - 1), '2026-04-17'); // the near-miss distractor
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['13 days', '41 days', '72 days', '18 April 2026']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('18 April 2026'));
});

test('U04-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D008: 'B', D009: 'C', D010: 'D', D011: 'A', D012: 'C', D013: 'B', D014: 'D', D015: 'A', D016: 'C', D017: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q17 = itemFor('D017') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q17.options.find(o => o.option_id === 'D')!.text_md.startsWith('18 April 2026'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
