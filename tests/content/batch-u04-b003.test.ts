// Independent deterministic recomputation for batch BFM-A-U04-B003 (documents under a credit, evidence of import, safeguards, risks).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cmp, mul, sub, mustDec, round, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U04-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U04-B003 D008: invoice value and 110% insurance check', () => {
  const card = itemFor('D008') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.ok(cmp(d('198500'), d('200000')) <= 0);
  const minIns = mul(d('198500'), d('1.10')); assert.equal(at(minIns, 2), '218350.00');
  assert.equal(at(sub(minIns, d('215000')), 2), '3350.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['218,350.00', '3,350.00', 'Invoice passes']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(card.final_answer_with_unit.includes('218,350.00') && card.final_answer_with_unit.includes('3,350.00'));
});

test('U04-B003 D009: crystallisation at the bill selling rate and at a forward rate (held back)', () => {
  const card = itemFor('D009') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const spot = mul(d('60000'), d('84.2250')), fwd = mul(d('60000'), d('83.9000'));
  assert.equal(at(spot, 2), '5053500.00'); assert.equal(at(fwd, 2), '5034000.00'); assert.equal(at(sub(spot, fwd), 2), '19500.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of [formatIndian(spot, 2), formatIndian(fwd, 2), formatIndian(sub(spot, fwd), 2)]) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U04-B003 D013 and D021: numerical questions', () => {
  const q13 = itemFor('D013') as QuestionItem; if (q13.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('238500'), d('1.10')), 2), '262350.00'); assert.equal(q13.numeric_rule.expected_answer, '262350.00');
  assert.deepEqual(gradeNumeric('262350', q13.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '262350.00' });
  for (const wrong of ['238500', '261250', '286925']) { const g = gradeNumeric(wrong, q13.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q21 = itemFor('D021') as QuestionItem; if (q21.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('60000'), d('84.2250')), 2), '5053500.00'); assert.equal(q21.numeric_rule.expected_answer, '5053500.00');
  assert.deepEqual(gradeNumeric('5053500', q21.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '5053500.00' });
});

test('U04-B003: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D010: 'A', D011: 'D', D012: 'B', D014: 'C', D015: 'D', D016: 'B', D017: 'C', D018: 'D', D019: 'A', D020: 'B' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q11 = itemFor('D011') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q11.options.find(o => o.option_id === 'D')!.text_md.includes('148,900'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
