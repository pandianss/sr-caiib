// Independent deterministic recomputation for batch BFM-A-U06-B003 (Non-Debt Instruments Rules).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, sub, mustDec, round, toPlain, cmp } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U06-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U06-B003 D009: headroom under the individual and aggregate limits', () => {
  const card = itemFor('D009') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const total = d('50000000');
  const held = mul(total, d('0.094')); assert.equal(at(held, 0), '4700000');
  const indivHead = sub(sub(mul(total, d('0.10')), d('1')), held); assert.equal(at(indivHead, 0), '299999');
  const aggHead = sub(mul(total, d('0.24')), d('10500000')); assert.equal(at(aggHead, 0), '1500000');
  assert.ok(cmp(indivHead, aggHead) < 0);
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['47,00,000', '2,99,999', '1,20,00,000', '15,00,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U06-B003 D010: trading day count', () => {
  const card = itemFor('D010') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const addTrading = (start: Date, n: number) => { const x = new Date(start); let k = 0; while (k < n) { x.setUTCDate(x.getUTCDate() + 1); const w = x.getUTCDay(); if (w !== 0 && w !== 6) k++; } return x.toISOString().slice(0, 10); };
  const settle = new Date(Date.UTC(2026, 6, 7));
  assert.equal(settle.getUTCDay(), 2); // Tuesday
  assert.equal(addTrading(settle, 5), '2026-07-14'); assert.equal(addTrading(settle, 7), '2026-07-16');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  assert.ok(shown.includes('14 July 2026') && shown.includes('16 July 2026'));
});

test('U06-B003 D025: further shares', () => {
  const q = itemFor('D025') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  const v = sub(sub(mul(d('80000000'), d('0.10')), d('1')), mul(d('80000000'), d('0.075')));
  assert.equal(at(v, 0), '1999999'); assert.equal(q.numeric_rule.expected_answer, '1999999');
  for (const wrong of ['2000000', '2000000.5', '2000001', '2000']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U06-B003: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D011: 'B', D012: 'C', D013: 'D', D014: 'A', D015: 'C', D016: 'B', D017: 'D', D018: 'A', D019: 'B', D020: 'C', D021: 'D', D022: 'B', D023: 'A', D024: 'C' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
