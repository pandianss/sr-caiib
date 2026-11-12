// Independent deterministic recomputation for batch BFM-A-U01-B004.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, mustDec, round, sub, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
/** Western digit grouping for dollar amounts (rupee amounts use formatIndian). */
const western = (x: ReturnType<typeof mustDec>) => at(x, 2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

test('B004 D003: settlement exposure against replacement cost', () => {
  const card = itemFor('D003') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const due = mul(d('800000'), d('1.0840')), replaced = mul(d('800000'), d('1.0790')), loss = sub(due, replaced);
  assert.equal(at(due, 2), '867200.00'); assert.equal(at(replaced, 2), '863200.00'); assert.equal(at(loss, 2), '4000.00');
  assert.equal(at(mul(d('800000'), sub(d('1.0840'), d('1.0790'))), 2), '4000.00'); // same loss by the rate difference
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of [western(due), western(replaced), western(loss)]) assert.ok(shown.includes(expected), `${expected} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('867,200.00') && card.final_answer_with_unit.includes('4,000.00'));
});

test('B004 D006: replacement cost of a failed forward purchase', () => {
  const q = itemFor('D006') as QuestionItem;
  if (q.question_type !== 'numeric_input') throw new Error('expected numeric');
  const extra = mul(d('500000'), sub(d('84.1250'), d('83.9000')));
  assert.equal(at(extra, 2), '112500.00'); assert.equal(q.numeric_rule.expected_answer, '112500.00');
  assert.deepEqual(gradeNumeric('112500', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '112500.00' });
  for (const wrong of [at(mul(d('500000'), d('84.1250')), 2), at(mul(d('500000'), d('83.9000')), 2), at(sub(d('84.1250'), d('83.9000')), 2)]) {
    const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong);
  }
  assert.ok(q.correct_explanation_md.includes(formatIndian(extra, 2)));
  assert.equal(at(mul(d('500000'), d('83.9000')), 0), '41950000'); // "about 4.2 crore" in the explanation
});

test('B004: source arithmetic slip noted in F011 is real, and choice questions are well formed', () => {
  assert.equal(at(mul(d('1000000'), d('1.1550')), 2), '1155000.00'); // not 1,550,000
  for (const id of ['D004', 'D005']) { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice'); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
