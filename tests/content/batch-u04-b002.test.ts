// Deterministic checks for batch BFM-A-U04-B002 (UCP 600: articles, amendments, examination, parties).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U04-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const day = (iso: string) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const weekday = (isoDate: string) => day(isoDate).getUTCDay(); // 0 Sunday
const addDays = (isoDate: string, n: number) => iso(new Date(day(isoDate).getTime() + n * 86400000));
/** nth banking day (Mon-Fri, no holidays) following the given date. */
function bankingDayAfter(isoDate: string, n: number): string {
  let d = isoDate, count = 0;
  while (count < n) { d = addDays(d, 1); const w = weekday(d); if (w !== 0 && w !== 6) count++; }
  return d;
}

test('U04-B002 D007: presentation deadline and the five-banking-day refusal deadline', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(weekday('2026-06-04'), 4); // Thursday
  assert.equal(weekday('2026-06-24'), 3); // Wednesday
  assert.equal(addDays('2026-06-04', 21), '2026-06-25');
  assert.ok('2026-06-25' < '2026-06-30');
  assert.equal(bankingDayAfter('2026-06-24', 5), '2026-07-01');
  assert.equal(bankingDayAfter('2026-06-24', 1), '2026-06-25');
  assert.equal(bankingDayAfter('2026-06-24', 4), '2026-06-30');
  const shown = card.worked_steps.map(s => s.intermediate_result + ' ' + s.formula_or_substitution).join(' | ');
  for (const t of ['25 June 2026', '1 July 2026', '25, 26, 29, 30 June, 1 July']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('1 July 2026'));
  assert.ok('2026-06-26' > '2026-06-25'); // self-check: a 26 June presentation is late
});

test('U04-B002: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D008: 'B', D009: 'D', D010: 'C', D011: 'A', D012: 'C', D013: 'B', D014: 'D', D015: 'A', D016: 'B', D017: 'C', D018: 'D', D019: 'C' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q19 = itemFor('D019') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q19.options.find(o => o.option_id === 'C')!.text_md.startsWith('25 June 2026'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
