// Recomputation and structural checks for batch ABM-C-U03-B001 (working capital assessment methods and LC limit).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const r2 = (x: number) => Math.round(x * 100 + 1e-9) / 100;

// Bank finance under the three Tandon methods.
const tca = 400, ocl = 120, core = 100, gap = tca - ocl;
const m1 = gap - 0.25 * gap, m2 = gap - 0.25 * tca, m3 = gap - (core + 0.25 * (tca - core));

test('ABM C U03 B001: Tandon, cash budget, turnover and LC worked examples recompute', () => {
  near(m1, 210); near(m2, 180); near(m3, 105);
  near(r2(tca / (ocl + m1)), 1.21); near(r2(tca / (ocl + m2)), 1.33); near(r2(tca / (ocl + m3)), 1.78);
  let s = shown('D005'); for (const p of ['Rs 280 lakh', 'Bank finance Rs 210 lakh; current ratio 400 / (120 + 210) = 1.21', 'Bank finance Rs 180 lakh; current ratio 400 / 300 = 1.33', 'Bank finance Rs 105 lakh; current ratio 400 / 225 = 1.78']) assert.ok(s.includes(p), p);
  // Cash budget
  let bal = 20; const closings: number[] = []; for (const [r, p] of [[300, 380], [280, 360], [420, 350]] as const) { bal += r - p; closings.push(bal); }
  assert.deepEqual(closings, [-60, -140, -70]); near(-Math.min(...closings), 140);
  s = shown('D007'); for (const p of ['Closing -60', 'Closing -140', 'Closing -70', 'Rs 140 lakh']) assert.ok(s.includes(p), p);
  // Projected turnover
  near(0.25 * 200, 50); near(0.20 * 200, 40); near(0.05 * 200, 10);
  s = shown('D009'); for (const p of ['Rs 50 lakh', 'Rs 40 lakh', 'Rs 10 lakh']) assert.ok(s.includes(p), p);
  // LC limit
  const lcs = 9.6 / 1.6, interval = 12 / lcs, outstanding = Math.ceil(((15 + 15) / 30 + 3) / (interval)); near(lcs, 6, 1e-9); near(interval, 2); assert.equal(outstanding, 2); near(outstanding * 1.6, 3.2, 1e-9);
  s = shown('D012'); for (const p of ['6 LCs a year', '2 months', '4 months', '2 LCs', 'Rs 3.2 crore']) assert.ok(s.includes(p), p);
  assert.equal(Math.ceil(6 / 2), 3);
});

test('ABM C U03 B001: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [['D037', m1, '210'], ['D038', m2, '180'], ['D039', m3, '105'], ['D040', r2(tca / (ocl + m2)), '1.33'], ['D041', 0.2 * 200, '40'], ['D042', -(20 + 300 - 380 + 280 - 360), '140'], ['D043', 9.6 / 1.6, '6'], ['D044', (4 / 2) * 1.6, '3.2']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 24); assert.equal(b.items.length, 44);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 9, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
