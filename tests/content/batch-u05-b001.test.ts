// Independent deterministic recomputation for batch BFM-A-U05-B001 (exporter rules: declarations, time limits, extensions, invoice reductions).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { div, mul, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const addDays = (s: string, n: number) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) + n * 86400000).toISOString().slice(0, 10);
const addMonths = (s: string, n: number) => { const y = +s.slice(0, 4), m = +s.slice(5, 7) - 1 + n, day = +s.slice(8, 10); const t = new Date(Date.UTC(y + Math.floor(m / 12), ((m % 12) + 12) % 12, day)); return t.toISOString().slice(0, 10); };

test('U05-B001 D007: dates of a late export bill', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(addDays('2026-01-10', 21), '2026-01-31');
  assert.equal(addMonths('2026-01-10', 9), '2026-10-10');
  assert.equal(addMonths('2026-10-10', 6), '2027-04-10');
  assert.equal(addMonths('2026-01-10', 12), '2027-01-10');
  assert.ok('2027-04-10' > '2027-01-10');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['31 January 2026', '10 October 2026', '10 April 2027', '10 January 2027']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B001 D008: cash discount on prepayment of a usance bill', () => {
  const q = itemFor('D008') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const discount = div(mul(mul(d('80000'), d('0.06')), d('45')), d('360'), 10);
  assert.equal(at(discount, 2), '600.00'); assert.equal(q.numeric_rule.expected_answer, '600.00');
  assert.deepEqual(gradeNumeric('600', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '600.00' });
  for (const wrong of ['4800', '608.22', '5400', '60']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  // 365-day basis would differ: the stem states 360.
  assert.equal(at(div(mul(mul(d('80000'), d('0.06')), d('45')), d('365'), 10), 2), '591.78');
});

test('U05-B001 D018: nine months from 10 January 2026', () => {
  assert.equal(addMonths('2026-01-10', 9), '2026-10-10');
  const q = itemFor('D018') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.equal(q.correct_option_id, 'B'); assert.ok(q.options.find(o => o.option_id === 'B')!.text_md.startsWith('10 October 2026'));
});

test('U05-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'B', D010: 'C', D011: 'D', D012: 'A', D013: 'B', D014: 'C', D015: 'D', D016: 'A', D017: 'C', D018: 'B' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
