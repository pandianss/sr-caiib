// Independent deterministic recomputation for batch BFM-A-U01-B010 (FEMA Act, dealing room controls, exposure limits).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, mul, sub, mustDec, round, toPlain, cmp, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U01-B010', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const higher = (a: ReturnType<typeof mustDec>, c: ReturnType<typeof mustDec>) => (cmp(a, c) >= 0 ? a : c);

test('U01-B010 D010: shorthand method, NOOPL and AGL ceilings', () => {
  const card = itemFor('D010') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const longs = add(add(d('1200'), d('300')), d('150')), shorts = add(d('750'), d('1000'));
  assert.equal(at(longs, 0), '1650'); assert.equal(at(shorts, 0), '1750'); assert.equal(at(higher(longs, shorts), 0), '1750');
  assert.equal(at(mul(d('6400'), d('0.25')), 0), '1600'); assert.equal(at(mul(d('6400'), d('6')), 0), '38400');
  assert.equal(at(sub(shorts, longs), 0), '100'); // the wrong netting of the self-check
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['1,650', '1,750', '1,600', '38,400']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
  assert.ok(cmp(higher(longs, shorts), mul(d('6400'), d('0.25'))) > 0);
});

test('U01-B010 D011: section 13 penalty arithmetic', () => {
  const card = itemFor('D011') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(at(mul(d('450000'), d('3')), 0), '1350000');
  const further = mul(sub(d('30'), d('1')), d('5000')); assert.equal(at(further, 0), '145000');
  assert.equal(at(add(d('200000'), further), 0), '345000');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const v of [d('1350000'), d('200000'), d('145000'), d('345000')]) assert.ok(shown.includes(formatIndian(v, 0)), `${formatIndian(v, 0)} not in ${shown}`);
});

test('U01-B010 D026 to D028: numerical questions', () => {
  const q26 = itemFor('D026') as QuestionItem; if (q26.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('9200'), d('6')), 2), '55200.00'); assert.equal(q26.numeric_rule.expected_answer, '55200.00');
  const q27 = itemFor('D027') as QuestionItem; if (q27.question_type !== 'numeric_input') throw new Error('numeric');
  const l = add(d('840'), d('215')), s = add(d('560'), d('700'));
  assert.equal(at(higher(l, s), 2), '1260.00'); assert.equal(q27.numeric_rule.expected_answer, '1260.00');
  for (const wrong of ['205', '2315', '1055']) { const g = gradeNumeric(wrong, q27.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q28 = itemFor('D028') as QuestionItem; if (q28.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(add(d('200000'), mul(d('44'), d('5000'))), 2), '420000.00'); assert.equal(q28.numeric_rule.expected_answer, '420000.00');
  assert.deepEqual(gradeNumeric('420000', q28.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '420000.00' });
  for (const wrong of ['425000', '2200000', '200000']) { const g = gradeNumeric(wrong, q28.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U01-B010: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D012: 'B', D013: 'C', D014: 'D', D015: 'A', D016: 'C', D017: 'B', D018: 'D', D019: 'C', D020: 'B', D021: 'A', D022: 'D', D023: 'C', D024: 'B', D025: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
