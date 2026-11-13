// Independent deterministic recomputation for batch BFM-A-U06-B004 (ECB proceeds, reporting and conversion).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U06-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U06-B004 D004: conversion of an ECB into shares', () => {
  const card = itemFor('D004') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const rupees = mul(d('2400000'), d('84.50')); assert.equal(at(rupees, 0), '202800000');
  assert.equal(at(div(rupees, d('1200'), 0, 'HALF_UP'), 0), '169000');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['20,28,00,000', '1,69,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U06-B004 D012: whole shares on conversion', () => {
  const q = itemFor('D012') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  const rupees = mul(d('1800000'), d('83.20')); assert.equal(at(rupees, 0), '149760000');
  const exact = div(rupees, d('950'), 4, 'HALF_UP'); assert.equal(toPlain(exact, 4), '157642.1053');
  assert.equal(q.numeric_rule.expected_answer, '157642');
  assert.deepEqual(gradeNumeric('157642', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '157642' });
  for (const wrong of ['157643', '157642.1', '1576421', '149760000']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U06-B004: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D005: 'B', D006: 'C', D007: 'D', D008: 'A', D009: 'C', D010: 'B', D011: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
