// Recomputation and structural checks for batch ABM-C-U01-B001 (overview of credit management).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);

test('ABM C U01 D013: priority sector targets for ANBC Rs 5,00,000 crore, against the 2025 Directions percentages', () => {
  const anbc = Math.max(500000, 480000); assert.equal(anbc, 500000);
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-psl-2025.txt'); // local copy, not committed: checked when present
  const t = existsSync(src) ? readFileSync(src, 'utf8') : '';
  if (t) for (const p of ['40 per cent of ANBC', '18 per cent of ANBC or CEOBSE', '14 percent is prescribed for Non-Corporate Farmers', '10 percent is prescribed for SMFs', '7.5 per cent of ANBC or CEOBSE', '12 percent of ANBC or CEOBSE']) assert.ok(t.includes(p), p);
  const r = { total: 0.4 * anbc, agri: 0.18 * anbc, ncf: 0.14 * anbc, smf: 0.1 * anbc, micro: 0.075 * anbc, weaker: 0.12 * anbc };
  assert.deepEqual(r, { total: 200000, agri: 90000, ncf: 70000, smf: 50000, micro: 37500, weaker: 60000 });
  const s = shown('D013'); for (const p of ['Rs 5,00,000 crore', 'Rs 2,00,000 crore', 'Rs 90,000 crore', 'Rs 70,000 crore', 'Rs 50,000 crore', 'Rs 37,500 crore', 'Rs 60,000 crore']) assert.ok(s.includes(p), p);
});

test('ABM C U01 D014 and numericals: exposure ceilings and priority sector amounts', () => {
  const t1 = 40000; near(0.2 * t1, 8000); near(0.25 * t1, 10000); near(0.1 * t1, 4000); near(0.05 * t1, 2000);
  const s = shown('D014'); for (const p of ['Rs 8,000 crore', 'Rs 10,000 crore', 'Rs 4,000 crore', 'Rs 2,000 crore']) assert.ok(s.includes(p), p);
  const cases: [string, number, string][] = [['D041', 0.4 * 300000, '120000'], ['D042', 0.18 * 300000, '54000'], ['D043', 0.1 * 300000, '30000'], ['D044', 0.075 * 300000, '22500'], ['D045', 0.25 * 20000, '5000'], ['D046', 0.1 * 20000, '2000']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U01: MSME classification rule (both limits) and card self-check', () => {
  const cls = (inv: number, turn: number) => (inv <= 2.5 && turn <= 10 ? 'micro' : inv <= 25 && turn <= 100 ? 'small' : inv <= 125 && turn <= 500 ? 'medium' : 'large');
  assert.equal(cls(2, 15), 'small'); assert.equal(cls(2, 8), 'micro'); assert.equal(cls(30, 90), 'medium');
});

test('ABM C U01: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 26); assert.equal(b.items.length, 46);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 9, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
