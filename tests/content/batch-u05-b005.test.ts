// Deterministic checks for batch BFM-A-U05-B005 (importer rules, advances, import finance, trade credit).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, sub, mustDec, round, toPlain, cmp } from '../../src/core/decimal.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U05-B005', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const addMonths = (s: string, n: number) => { const y = +s.slice(0, 4), m = +s.slice(5, 7) - 1 + n, day = +s.slice(8, 10); return new Date(Date.UTC(y + Math.floor(m / 12), ((m % 12) + 12) % 12, day)).toISOString().slice(0, 10); };
const lower = (a: ReturnType<typeof mustDec>, c: ReturnType<typeof mustDec>) => (cmp(a, c) <= 0 ? a : c);

test('U05-B005 D007: import extension test uses the lower of the two limits', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(addMonths('2026-03-15', 6), '2026-09-15');
  const tenPct = mul(d('18000000'), d('0.10')); assert.equal(at(tenPct, 2), '1800000.00');
  const limit = lower(d('1000000'), tenPct); assert.equal(at(limit, 0), '1000000');
  assert.equal(at(sub(d('1400000'), limit), 0), '400000');
  assert.equal(at(lower(d('1000000'), mul(d('8000000'), d('0.10'))), 0), '800000'); // self-check
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['15 September 2026', '1,800,000.00', '1,000,000', '400,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B005: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'B', D010: 'C', D011: 'D', D012: 'A', D013: 'C', D014: 'B', D015: 'D', D016: 'A', D017: 'C', D018: 'B', D019: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q18 = itemFor('D018') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q18.options.find(o => o.option_id === 'B')!.text_md.startsWith('15 September 2026'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
