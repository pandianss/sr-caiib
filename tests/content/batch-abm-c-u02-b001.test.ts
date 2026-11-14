// Recomputation and structural checks for batch ABM-C-U02-B001 (financial statements, cash flow and funds flow).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);

test('ABM C U02 B001: cash flow and funds flow worked examples and numericals', () => {
  const closing = 40 + (95 - 70 + 25); near(closing, 90);
  let s = shown('D010'); for (const p of ['Rs 50 lakh', 'Rs 90 lakh']) assert.ok(s.includes(p), p);
  const sources = 50 + 60 + 30, uses = 90 + 20; near(sources, 140); near(uses, 110); near(sources - uses, 30);
  s = shown('D012'); for (const p of ['Rs 140 lakh', 'Rs 110 lakh', 'Rs 30 lakh increase']) assert.ok(s.includes(p), p);
  near(140 - (150 + 20), -30); // the self-check variation: a Rs 150 lakh machine
  const usedInInvesting = 180 - 60 - (150 - 120);
  const cases: [string, number, string][] = [['D045', closing, '90'], ['D046', usedInInvesting, '90'], ['D047', 140 - 110, '30'], ['D048', 170 - 140, '30'], ['D049', 480 - 320, '160'], ['D050', 900 + 30, '930']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected)); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 32); assert.equal(b.items.length, 50);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 11, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
