// Recomputation and structural checks for batch ABM-C-U05-B001 (credit delivery and straight through processing).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const drawingPower = (stocks: number, sm: number, debts: number, dm: number, creditors: number) => stocks * (1 - sm) + debts * (1 - dm) - creditors;

test('ABM C U05 B001: drawing power, loan system and account framework examples recompute', () => {
  near(drawingPower(300, 0.25, 200, 0.40, 80), 265); near(Math.min(265, 280), 265); near(drawingPower(300, 0.25, 200, 0.40, 40), 305);
  let s = shown('D006'); for (const p of ['Rs 225 lakh', 'Rs 120 lakh', 'Rs 265 lakh']) assert.ok(s.includes(p), p);
  const base = 200 - 30 - 20; near(base, 150); near(0.6 * base, 90); near(base - 0.6 * base, 60);
  s = shown('D008'); for (const p of ['Rs 150 crore', 'Rs 90 crore', 'Rs 60 crore']) assert.ok(s.includes(p), p);
  near(18 / 150 * 100, 12); near(60 / 150 * 100, 40); near(12 / 150 * 100, 8);
  s = shown('D010'); for (const p of ['12 per cent', '40 per cent each', '8 per cent', 'D: collection account only']) assert.ok(s.includes(p), p);
});

test('ABM C U05 B001: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [['D058', drawingPower(300, 0.25, 200, 0.40, 80), '265'], ['D059', Math.min(265, 280), '265'], ['D060', 0.6 * (200 - 30 - 20), '90'], ['D061', (200 - 30 - 20) - 0.6 * 150, '60'], ['D062', 18 / 150 * 100, '12.00'], ['D063', 12 / 150 * 100, '8.00']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U05 B001: key phrases appear in the Directions (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('rbi-dor-2025-157.txt', ['aggregate fund based working capital limit (WCL) of ₹ 150 crore and above', 'at least 60 per cent of the sanctioned fund based working capital limit', 'tenor being not less than seven days', 'Food Credit Consortium', 'exposure of the banking system to the customer is less than ₹10 crore', 'minimum 10 per cent share in banking system’s aggregate exposure', 'within two working days of receipt', 'within one month from the date of observing such ineligibility', 'completed within three months', 'January 22, 2016', 'every transaction of security interest is required to be filed with the Registry']);
  check('rbi-dor-2025-159.txt', ['sanctioned limits of rupees five crore and above', 'at least at quarterly intervals', 'Company Secretary / Cost Accountant / Chartered Accountant', 'lead role in monitoring the unhedged foreign exchange exposure']);
  check('rbi-dor-2025-154.txt', ['disbursal is proportionate to the stages of completion']);
});

test('ABM C U05 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 43); assert.equal(b.items.length, 63);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 15, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
