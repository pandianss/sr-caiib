// Independent deterministic recomputation for batch BFM-A-U04-B006 (guarantees and the credit flow).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, mul, div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U04-B006', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
/** Regulation 8: 7,500 + 0.025% x A x n, rounded upwards to the nearest hundred. */
const lateFee = (amount: string, months: string) => {
  const n = div(d(months), d('12'), 2, 'CEILING');
  const raw = add(d('7500'), mul(mul(d('0.00025'), d(amount)), n));
  return { n, raw, fee: mul(div(raw, d('100'), 0, 'CEILING'), d('100')) };
};

test('U04-B006 D006: late submission fee example', () => {
  const card = itemFor('D006') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const r = lateFee('13570000', '6');
  assert.equal(toPlain(r.n, 2), '0.50'); assert.equal(toPlain(r.raw, 2), '9196.25'); assert.equal(at(r.fee, 0), '9200');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['0.50', '1,696.25', '9,196.25', '9,200']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U04-B006 D018: late submission fee numerical question', () => {
  const q = itemFor('D018') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  const r = lateFee('8240000', '3');
  assert.equal(toPlain(r.n, 2), '0.25'); assert.equal(toPlain(r.raw, 2), '8015.00'); assert.equal(at(r.fee, 0), '8100');
  assert.equal(q.numeric_rule.expected_answer, '8100');
  for (const wrong of ['8015', '8000', '8200', '7500']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U04-B006: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D007: 'B', D008: 'C', D009: 'D', D010: 'A', D011: 'C', D012: 'B', D013: 'D', D014: 'A', D015: 'B', D016: 'C', D017: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
