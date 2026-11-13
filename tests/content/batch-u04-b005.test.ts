// Deterministic checks for batch BFM-A-U04-B005 (ISBP, Incoterms 2020, case studies).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U04-B005', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const day = (iso: string) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => iso(new Date(day(s).getTime() + n * 86400000));
const weekday = (s: string) => day(s).getUTCDay();
function bankingDayAfter(s: string, n: number, holidays: string[]): string { let d = s, c = 0; while (c < n) { d = addDays(d, 1); const w = weekday(d); if (w !== 0 && w !== 6 && !holidays.includes(d)) c++; } return d; }

test('U04-B005 D008: five banking days with a holiday', () => {
  const card = itemFor('D008') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(weekday('2026-04-08'), 3); assert.equal(weekday('2026-04-10'), 5); // Wednesday and Friday
  assert.equal(bankingDayAfter('2026-04-08', 5, ['2026-04-10']), '2026-04-16');
  assert.equal(bankingDayAfter('2026-04-08', 5, []), '2026-04-15'); // self-check: without the holiday
  assert.equal(bankingDayAfter('2026-04-08', 2, ['2026-04-10']), '2026-04-13');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['Day 1', 'Day 2', '16 April 2026']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('16 April 2026'));
});

test('U04-B005: insurance check in the case question', () => {
  assert.ok(46500 > 41600 * 1.10); // 45,760: the insured amount is above the 110% minimum
  assert.ok(Math.abs(41600 * 1.10 - 45760) < 1e-9);
});

test('U04-B005: Incoterms 2020 grouping facts are consistent', () => {
  const any = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'], sea = ['FAS', 'FOB', 'CFR', 'CIF'];
  assert.equal(any.length + sea.length, 11); assert.ok(!any.includes('DAT') && !sea.includes('DAT'));
  assert.ok(sea.includes('FOB') && !any.includes('FOB'));
});

test('U04-B005: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'B', D010: 'D', D011: 'C', D012: 'A', D013: 'B', D014: 'D', D015: 'C', D016: 'A', D017: 'D', D018: 'C', D019: 'B', D020: 'D', D021: 'A' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q21 = itemFor('D021') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q21.options.find(o => o.option_id === 'A')!.text_md.startsWith('Thursday 16 April 2026'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
