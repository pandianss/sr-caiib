// Deterministic checks for batch BFM-A-U04-B004 (URR 725; held standby safeguards).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U04-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const day = (iso: string) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => iso(new Date(day(s).getTime() + n * 86400000));
const weekday = (s: string) => day(s).getUTCDay();
function bankingDayAfter(s: string, n: number): string { let d = s, c = 0; while (c < n) { d = addDays(d, 1); const w = weekday(d); if (w !== 0 && w !== 6) c++; } return d; }

test('U04-B004 D005: earliest claim and processing deadline', () => {
  const card = itemFor('D005') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(weekday('2026-07-30'), 4); assert.equal(weekday('2026-06-11'), 4); // both Thursdays
  assert.equal(addDays('2026-07-30', -10), '2026-07-20');
  assert.equal(bankingDayAfter('2026-06-11', 3), '2026-06-16');
  assert.equal(bankingDayAfter('2026-06-12', 3), '2026-06-17'); // self-check: Friday receipt
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['20 July 2026', '16 June 2026']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('20 July 2026') && card.final_answer_with_unit.includes('16 June 2026'));
});

test('U04-B004: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D007: 'C', D008: 'D', D009: 'B', D010: 'A', D011: 'D', D012: 'C', D013: 'B', D014: 'D', D015: 'A', D016: 'C' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q13 = itemFor('D013') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q13.options.find(o => o.option_id === 'B')!.text_md.startsWith('20 July 2026'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
