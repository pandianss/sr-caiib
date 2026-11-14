// Recomputation and structural checks for batch ABM-C-U02-B002 (ratio analysis and related topics).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U02-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const r2 = (x: number) => Math.round(x * 100 + 1e-9) / 100;

test('ABM C U02 B002: worked examples recompute', () => {
  // Liquidity and leverage
  const tca = 600, cl = 450, tl = 300, nw = 400, intang = 40, group = 60;
  near(r2(tca / cl), 1.33); const nwc = tca - cl; near(nwc, 150); near(nwc / tca * 100, 25);
  const tol = tl + cl, tnw = nw - intang; near(tol, 750); near(tnw, 360); near(r2(tol / tnw), 2.08); near(tol / (tnw - group), 2.5);
  let s = shown('D013'); for (const p of ['1.33', 'Rs 150 lakh', '25.00 per cent', 'TOL 750, TNW 360', '2.08 times', '2.50 times']) assert.ok(s.includes(p), p);
  // DSCR
  const accrual = 80 + 40, inst = 90, intTL = 30; near(accrual, 120); near(r2(accrual / inst), 1.33); near((accrual + intTL) / (inst + intTL), 1.25); near(360 / 120, 3); near(120 / 40, 3);
  s = shown('D014'); for (const p of ['Rs 120 lakh', '1.33', '1.25', '3.00 years', '3.00 times']) assert.ok(s.includes(p), p);
  // Holding ratios
  near(240 / 1460 * 365, 60); near(90 / 2190 * 365, 15); near(140 / 2555 * 365, 20); near(600 / 3650 * 365, 60); near(180 / 1095 * 365, 60); near(240 + 90 + 140 + 600, 1070); near(1460 / 365, 4);
  s = shown('D015'); for (const p of ['60 days', '15 days', '20 days', 'Rs 1,070 lakh']) assert.ok(s.includes(p), p);
});

test('ABM C U02 B002: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [
    ['D060', 600 / 450, '1.33'], ['D061', (600 - 450) / 600 * 100, '25.00'], ['D062', 750 / 360, '2.08'], ['D063', 750 / 300, '2.50'], ['D064', 120 / 90, '1.33'], ['D065', 150 / 120, '1.25'],
    ['D066', 360 / 120, '3.00'], ['D067', (500 - 320) / 500 * 100, '36.00'], ['D068', 600 / 3650 * 365, '60'], ['D069', 1460 / 365 * 45, '180'], ['D070', 1200 / 150, '8.00'], ['D071', (460 - 400) / 400 * 100, '15.00'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(r2(computed), Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U02 B002: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 42); assert.equal(b.items.length, 71);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 15, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
