// Recomputation and structural checks for batch ABM-C-U04-B001 (term loans, project appraisal and project finance).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const r2 = (x: number) => Math.round(x * 100 + 1e-9) / 100;
const floorExposure = (aggregate: number) => aggregate <= 1500 ? 0.10 * aggregate : Math.max(0.05 * aggregate, 150);

test('ABM C U04 B001: worked examples recompute', () => {
  const cost = 20 + 60 + 200 + 20 + 10 + 30 + 10 + 30; near(cost, 380); const other = 100 + 20 + 30 + 20; near(cost - other, 210); near(210 / 100, 2.1);
  let s = shown('D006'); for (const p of ['Rs 380 lakh', 'Rs 170 lakh', 'Rs 210 lakh', '2.10 : 1']) assert.ok(s.includes(p), p);
  const contribution = 12 - 7, bep = 2000 / contribution; near(bep, 400); near(bep / 1000, 0.4); near(1 - 0.4, 0.6); near(2000 / (12000 - 7000) * 12000, 4800); near(bep * 12, 4800);
  s = shown('D008'); for (const p of ['Rs 5', '400 units', '40 per cent', '60 per cent', 'Rs 4,800']) assert.ok(s.includes(p), p);
  const acc = [130, 160, 190], intr = [60, 40, 20], inst = [80, 100, 120]; const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  assert.deepEqual(acc.map((a, i) => r2(a / inst[i]!)), [1.63, 1.6, 1.58]); near(sum(acc) / sum(inst), 1.6); near(r2((sum(acc) + sum(intr)) / (sum(inst) + sum(intr))), 1.43);
  const yearly = acc.map((a, i) => (a + intr[i]!) / (inst[i]! + intr[i]!)); near(r2(sum(yearly) / 3), 1.43);
  s = shown('D010'); for (const p of ['1.63, 1.60, 1.58', '1.60', '1.43']) assert.ok(s.includes(p), p);
  near(0.85 * 22, 18.7); near(0.75 * 360, 270); near(floorExposure(1200), 120); near(floorExposure(4000), 200); near(floorExposure(2000), 150);
  s = shown('D015'); for (const p of ['18.7 years', '270 hectares', 'Rs 120 crore', 'Rs 200 crore']) assert.ok(s.includes(p), p);
  near(0.5 * 600, 300); s = shown('D018'); for (const p of ['Rs 300 crore', 'BBB minus; 2 agencies']) assert.ok(s.includes(p), p);
});

test('ABM C U04 B001: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [['D060', 2000 / 5, '400'], ['D061', (1 - 400 / 1000) * 100, '60.00'], ['D062', 2000 / (12000 - 7000) * 12000, '4800'], ['D063', 150 / 100, '1.50'], ['D064', r2(190 / 140), '1.36'], ['D065', r2(600 / 420), '1.43'], ['D066', r2((600 - 400) / 600 * 100), '33.33'], ['D067', 0.85 * 22, '18.7'], ['D068', floorExposure(4000), '200'], ['D069', 0.5 * 600, '300'], ['D070', 380 - 170, '210']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U04 B001: key phrases appear in the Credit Facilities Directions (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-dor-2025-154.txt');
  if (!existsSync(src)) return;
  const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
  for (const p of ['shall not exceed 85 per cent of the economic life', 'no individual bank shall have an exposure which is less than 10 per cent of the aggregate exposure', '5 per cent or ₹150 crore, whichever is higher', 'For infrastructure projects under PPP model – 50 per cent', 'For all other projects (non-PPP infrastructure, and non-infrastructure including CRE & CRE-RH) – 75 per cent', 'declaration of the Appointed Date', 'lender’s independent engineer (LIE) / architect', 'shall be 50 per cent of the bond issue size', 'PCE cannot be provided by way of guarantee', 'not lower than “BBB” minus', 'rated by a minimum of two ECAI', 'technically feasible, financially viable and bankable']) assert.ok(t.includes(p), p);
});

test('ABM C U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 41); assert.equal(b.items.length, 70);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 15, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
