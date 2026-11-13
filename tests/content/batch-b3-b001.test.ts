// Independent deterministic recomputation for batch BFM-B-U03-B001 (Basel I, II, III history and Indian minimum ratios).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, cmp, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const higher = (a: ReturnType<typeof mustDec>, c: ReturnType<typeof mustDec>) => (cmp(a, c) >= 0 ? a : c);

test('B3-B001 D010: market risk capital charge', () => {
  const m = mul(d('3'), d('9')); assert.equal(at(m, 0), '27');
  assert.equal(at(higher(d('12'), m), 0), '27'); assert.equal(at(higher(d('30'), m), 0), '30');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['₹27 crore', '₹30 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B001 D011: Basel I risk-weighted assets', () => {
  const rwa = add(add(add(mul(d('200'), d('0')), mul(d('300'), d('0.2'))), mul(d('400'), d('0.5'))), mul(d('500'), d('1')));
  assert.equal(at(rwa, 0), '760'); assert.equal(at(mul(rwa, d('0.08')), 1), '60.8'); assert.equal(at(mul(rwa, d('0.09')), 1), '68.4');
  assert.equal(at(mul(div(d('95'), rwa, 6, 'HALF_UP'), d('100')), 1), '12.5');
  const shown = shownOf(itemFor('D011') as StudyCard);
  for (const t of ['₹760 crore', '₹60.8 crore', '₹68.4 crore', '12.5%']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B001 D038 to D040: numerical questions', () => {
  const q1 = itemFor('D038') as QuestionItem; if (q1.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('18400'), d('0.115')), 0), '2116'); assert.equal(q1.numeric_rule.expected_answer, '2116');
  for (const wrong of ['1656', '2116.5', '1472', '2300']) { const g = gradeNumeric(wrong, q1.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q2 = itemFor('D039') as QuestionItem; if (q2.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('12500'), add(d('0.055'), d('0.025'))), 0), '1000'); assert.equal(q2.numeric_rule.expected_answer, '1000');
  for (const wrong of ['687.5', '312.5', '875', '1437.5']) { const g = gradeNumeric(wrong, q2.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q3 = itemFor('D040') as QuestionItem; if (q3.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(sub(mul(d('20000'), d('0.115')), mul(d('20000'), d('0.10875'))), 0), '125'); assert.equal(q3.numeric_rule.expected_answer, '125');
  for (const wrong of ['2175', '2300', '150', '100']) { const g = gradeNumeric(wrong, q3.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('B3-B001: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 26; i++) {
    const id = 'D' + String(12 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
