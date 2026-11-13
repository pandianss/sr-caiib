// Independent deterministic recomputation for batch BFM-A-U01-B009 (FEDAI Rules).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, sub, mustDec, round, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B009', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const day = (s: string) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)));
const addDays = (s: string, n: number) => new Date(day(s).getTime() + n * 86400000).toISOString().slice(0, 10);
function businessDayAfter(s: string, n: number): string { let x = s, c = 0; while (c < n) { x = addDays(x, 1); const w = day(x).getUTCDay(); if (w !== 0 && w !== 6) c++; } return x; }

test('U01-B009 D009: crystallisation arithmetic', () => {
  const card = itemFor('D009') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const crys = mul(d('60000'), d('84.2250')), real = mul(d('60000'), d('83.9500')), imp = mul(d('40000'), d('84.5500'));
  assert.equal(at(crys, 2), '5053500.00'); assert.equal(at(real, 2), '5037000.00'); assert.equal(at(sub(crys, real), 2), '16500.00'); assert.equal(at(imp, 2), '3382000.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const v of [crys, real, sub(crys, real), imp]) assert.ok(shown.includes(formatIndian(v, 2)), `${formatIndian(v, 2)} not in ${shown}`);
});

test('U01-B009 D010: cancellation difference and claim deadline', () => {
  const card = itemFor('D010') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const diff = sub(d('83.2000'), d('82.6500')); assert.equal(at(diff, 4), '0.5500'); assert.equal(at(mul(d('150000'), diff), 2), '82500.00');
  assert.equal(day('2026-08-10').getUTCDay(), 1);
  assert.equal(businessDayAfter('2026-08-10', 15), '2026-08-31');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['0.5500', '82,500.00', '31 August 2026']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U01-B009 D024 and D025: numerical questions', () => {
  const q24 = itemFor('D024') as QuestionItem; if (q24.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('90000'), sub(d('83.7500'), d('83.1000'))), 2), '58500.00'); assert.equal(q24.numeric_rule.expected_answer, '58500.00');
  assert.deepEqual(gradeNumeric('58500', q24.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '58500.00' });
  for (const wrong of ['5850', '7515000', '58000']) { const g = gradeNumeric(wrong, q24.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q25 = itemFor('D025') as QuestionItem; if (q25.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('45000'), d('84.3000')), 2), '3793500.00'); assert.equal(q25.numeric_rule.expected_answer, '3793500.00');
  assert.deepEqual(gradeNumeric('3793500', q25.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '3793500.00' });
});

test('U01-B009: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D011: 'B', D012: 'A', D013: 'C', D014: 'D', D015: 'B', D016: 'C', D017: 'D', D018: 'A', D019: 'C', D020: 'B', D021: 'D', D022: 'C', D023: 'B' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
