// Recomputation and structural checks for batch ABM-C-U06-B001 (credit control and monitoring).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const dp = (stocks: number, sm: number, debts: number, old: number, dm: number, creditors: number) => stocks * (1 - sm) + (debts - old) * (1 - dm) - creditors;

test('ABM C U06 B001: drawing power and review count examples recompute', () => {
  near(dp(400, 0.25, 300, 60, 0.40, 50), 394); near(dp(400, 0.25, 300, 0, 0.40, 50), 430); near(430 - 394, 36);
  let s = shown('D004'); for (const p of ['Rs 300 lakh', 'Rs 240 lakh', 'Rs 144 lakh', 'Rs 394 lakh']) assert.ok(s.includes(p), p);
  near(10 * 4 + 20 * 2 + 30 * 1, 110); near(0.05 * 400, 20); near(0.10 * 400, 40);
  s = shown('D010'); for (const p of ['40 reviews', '30 reviews', '110 reviews', '20 proposals']) assert.ok(s.includes(p), p);
});

test('ABM C U06 B001: numerical answers recompute and grade', () => {
  const exposures = [3, 5, 12, 4.9, 20, 5.5];
  const cases: [string, number, string][] = [['D042', dp(400, 0.25, 300, 60, 0.40, 50), '394'], ['D043', 36, '36'], ['D044', 10 * 4 + 20 * 2 + 30, '110'], ['D045', 0.05 * 400, '20'], ['D046', exposures.filter(x => x >= 5).length, '4']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U06 B001: key phrases appear in the Directions (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('rbi-dor-2025-157.txt', ['independent and objective credit appraisal in all cases', 'sensitivity tests / scenario analysis', 'debt of the parent company is not infused as equity capital', 'Credit Information Reports (CIRs)']);
  check('rbi-dor-2025-164.txt', ['should not be older than three months', 'shall be deemed as irregular', 'not later than three months from the due date', 'delay beyond six months is not considered desirable', 'Stock audit at annual intervals by external agencies', 'valued once in three years', 'report their names to IBA']);
});

test('ABM C U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 31); assert.equal(b.items.length, 46);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 11, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
