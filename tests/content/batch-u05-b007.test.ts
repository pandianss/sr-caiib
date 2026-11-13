// Independent deterministic recomputation for batch BFM-A-U05-B007 (export and import controls).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, mul, div, mustDec, round, toPlain, cmp } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U05-B007', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const lower = (a: ReturnType<typeof mustDec>, c: ReturnType<typeof mustDec>) => (cmp(a, c) <= 0 ? a : c);

test('U05-B007 D011: free-of-cost export cap', () => {
  const card = itemFor('D011') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const avg = div(add(add(d('180000000'), d('240000000')), d('300000000')), d('3'), 0, 'HALF_UP');
  assert.equal(at(avg, 0), '240000000');
  const two = mul(avg, d('0.02')); assert.equal(at(two, 0), '4800000');
  assert.equal(at(lower(d('10000000'), two), 0), '4800000');
  const big = mul(d('800000000'), d('0.02')); assert.equal(at(lower(d('10000000'), big), 0), '10000000');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['24,00,00,000', '48,00,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B007 D012: extension ceiling', () => {
  const card = itemFor('D012') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const avg = div(add(d('6400000'), d('8800000')), d('2'), 0, 'HALF_UP'); assert.equal(at(avg, 0), '7600000');
  const ten = mul(avg, d('0.10')); assert.equal(at(ten, 0), '760000');
  const ceiling = lower(d('1000000'), ten); assert.equal(at(ceiling, 0), '760000');
  assert.ok(cmp(d('900000'), ceiling) > 0);
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['7,600,000', '760,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B007 D033 and D034: numerical questions', () => {
  const q1 = itemFor('D033') as QuestionItem; if (q1.question_type !== 'numeric_input') throw new Error('numeric');
  const avg = div(add(d('5200000'), d('7400000')), d('2'), 0, 'HALF_UP');
  const ceiling = lower(d('1000000'), mul(avg, d('0.10')));
  assert.equal(at(ceiling, 0), '630000'); assert.equal(q1.numeric_rule.expected_answer, '630000');
  for (const wrong of ['1000000', '6300000', '520000', '740000']) { const g = gradeNumeric(wrong, q1.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q2 = itemFor('D034') as QuestionItem; if (q2.question_type !== 'numeric_input') throw new Error('numeric');
  const cap = mul(div(add(add(d('420000000'), d('450000000')), d('480000000')), d('3'), 0, 'HALF_UP'), d('0.02'));
  assert.equal(at(cap, 0), '9000000'); assert.equal(q2.numeric_rule.expected_answer, '9000000');
  for (const wrong of ['10000000', '45000000', '900000', '2700000']) { const g = gradeNumeric(wrong, q2.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U05-B007: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D013: 'B', D014: 'C', D015: 'D', D016: 'A', D017: 'C', D018: 'B', D019: 'D', D020: 'A', D021: 'B', D022: 'C', D023: 'D', D024: 'A', D025: 'C', D026: 'B', D027: 'D', D028: 'A', D029: 'B', D030: 'C', D031: 'D', D032: 'A' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
