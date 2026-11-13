// Deterministic recomputation and structural checks for batch ABM-B-U04-B001 (employees' feedback and reward system).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-B-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const sum = (xs: number[]) => xs.reduce((a, c) => a + c, 0);
const compa = (salary: number, low: number, high: number) => 100 * salary / ((low + high) / 2);
const points = (rows: [degree: number, weight: number][]) => sum(rows.map(([d, w]) => d * w));
const zone = (c: number) => (c < 88 ? 'new' : c < 96 ? 'gaining' : c < 104 ? 'competent' : c < 112 ? 'above' : 'outstanding');

test('ABM B U04 courseware examples reproduce (toolmaker, receptionist points, compa-ratios)', () => {
  assert.equal(5 + 10 + 12 + 24 + 3, 54);
  assert.equal(points([[1, 25], [1, 25], [1, 10], [2, 20], [1, 10], [1, 10]]), 120);
  assert.deepEqual([21000, 23000, 24000, 26000, 28000].map(s => (Math.round(compa(s, 20000, 28000) * 10) / 10)), [87.5, 95.8, 100, 108.3, 116.7]);
  assert.equal(4 + 9 + 13 + 3, 29); // 4 + 9 + 13 + 3 laws amalgamated, as the courseware counts them
});

test('ABM B U04 worked examples D012 to D014', () => {
  assert.equal(6 + 9 + 11 + 14 + 5, 45); assert.ok(shown('D012').includes('Rs 45 per day'));
  assert.equal(points([[3, 20], [2, 20], [1, 10], [3, 20], [2, 15], [2, 15]]), 230); const t = shown('D013'); for (const p of ['60', '40', '10', '30; 30', '230']) assert.ok(t.includes(p), p);
  const mid = (30000 + 42000) / 2; assert.equal(mid, 36000);
  const salaries = [31500, 36000, 39600, 42000]; const cr = salaries.map(s => compa(s, 30000, 42000));
  near(cr[0]!, 87.5); near(cr[1]!, 100); near(cr[2]!, 110); near(cr[3]!, 116.6667, 1e-3);
  assert.deepEqual(cr.map(zone), ['new', 'competent', 'above', 'outstanding']);
  const u = shown('D014'); for (const p of ['Rs 36,000', '87.5 per cent', '100 per cent', '110 per cent', '116.7 per cent']) assert.ok(u.includes(p), p);
});

test('ABM B U04 numerical questions: expected answers recomputed and graded', () => {
  const cases: [string, number, string][] = [
    ['D039', 6 + 9 + 11 + 14 + 5, '45'], ['D040', points([[3, 20], [2, 20], [1, 10], [2, 20], [1, 15], [2, 15]]), '195'], ['D041', (30000 + 42000) / 2, '36000'],
    ['D042', compa(33000, 30000, 42000), '91.7'], ['D043', 100 * 27000 / 25000, '108.0'], ['D044', 4 * 15, '60'], ['D045', 40000 + 0.12 * 40000, '44800'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 0.05); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  near(compa(33000, 30000, 42000), 91.6667, 1e-3); // 91.67 rounds to 91.7: not a tie at one decimal
  assert.equal(zone(26 / 24 * 100), 'above'); assert.equal(zone(90), 'gaining');
});

test('ABM B U04 choice questions, answer spread and counts; all drafts unreviewed', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 24); assert.equal(b.items.length, 45);
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.deepEqual(q.options.map(o => o.option_id), ['A', 'B', 'C', 'D']); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }; for (const q of qs) if (q.question_type === 'single_choice') counts[q.correct_option_id]!++;
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 9, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
