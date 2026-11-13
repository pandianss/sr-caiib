// Independent deterministic recomputation for batch BFM-A-U07-B001 (ECGC and risks in foreign trade).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, mustDec, round, toPlain, cmp } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('A7-B001 D011: sharing a recovery', () => {
  const card = itemFor('D011') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const paid = mul(d('8000000'), d('0.65')); assert.equal(at(paid, 0), '5200000');
  assert.equal(at(sub(d('8000000'), paid), 0), '2800000');
  const back = mul(d('3000000'), d('0.65')); assert.equal(at(back, 0), '1950000');
  assert.equal(at(sub(d('3000000'), back), 0), '1050000');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['52,00,000', '28,00,000', '19,50,000', '10,50,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('A7-B001 D012: exchange fluctuation cover', () => {
  const card = itemFor('D012') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const ref = d('84.00'), settle = d('80.00');
  const loss = sub(ref, settle); assert.equal(at(loss, 2), '4.00');
  assert.equal(toPlain(round(div(loss, ref, 6, 'HALF_UP'), 4, 'HALF_UP'), 4), '0.0476');
  const deductible = mul(ref, d('0.02')); assert.equal(at(deductible, 2), '1.68');
  const ceiling = mul(ref, d('0.35')); assert.ok(cmp(sub(loss, deductible), ceiling) < 0);
  const ecgc = sub(loss, deductible); assert.equal(at(ecgc, 2), '2.32');
  const total = mul(ecgc, d('500000')); assert.equal(at(total, 0), '1160000');
  assert.equal(at(sub(mul(loss, d('500000')), total), 0), '840000');
  assert.ok(cmp(sub(ref, d('83.00')), deductible) < 0); // self-check: loss of 1.00 within the 2% deductible
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['4.76%', '1.68', '2.32', '11,60,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('A7-B001 D036 and D037: numerical questions', () => {
  const q1 = itemFor('D036') as QuestionItem; if (q1.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('2500000'), d('0.70')), 0), '1750000'); assert.equal(q1.numeric_rule.expected_answer, '1750000');
  for (const wrong of ['750000', '1250000', '1500000', '2500000']) { const g = gradeNumeric(wrong, q1.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q2 = itemFor('D037') as QuestionItem; if (q2.question_type !== 'numeric_input') throw new Error('numeric');
  const threshold = mul(d('250000'), d('0.01')); assert.equal(at(threshold, 0), '2500');
  assert.ok(cmp(d('4200'), threshold) >= 0);
  const total = add(d('4200'), mul(d('1600'), d('0.5'))); assert.equal(at(total, 0), '5000'); assert.equal(q2.numeric_rule.expected_answer, '5000');
  for (const wrong of ['5800', '4200', '800', '4600']) { const g = gradeNumeric(wrong, q2.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('A7-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D013: 'B', D014: 'C', D015: 'D', D016: 'A', D017: 'C', D018: 'B', D019: 'D', D020: 'A', D021: 'B', D022: 'C', D023: 'D', D024: 'A', D025: 'B', D026: 'C', D027: 'D', D028: 'A', D029: 'C', D030: 'B', D031: 'D', D032: 'A', D033: 'B', D034: 'C', D035: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
