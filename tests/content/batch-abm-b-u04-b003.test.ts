// Recomputation and structural checks for batch ABM-B-U04-B003 (the four Labour Codes).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-B-U04-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);

test('ABM B U04 B003: worked example and numericals recompute', () => {
  const contribution = Math.min(0.02 * 500, 0.05 * 150); near(contribution, 7.5);
  const s = shown('D006'); for (const p of ['Rs 1,200', 'Rs 13,500', 'Rs 10 crore', 'Rs 7.5 crore', 'Rs 50,000']) assert.ok(s.includes(p), p);
  const cases: [string, number, string][] = [['D028', 2 * 150 * 4, '1200'], ['D029', 15 * 900, '13500'], ['D030', contribution, '7.50'], ['D031', 0.5 * 100000, '50000']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected)); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM B U04 B003: key phrases appear in the PIB documents (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('pib-2192463.txt', ['made effective from 21st November 2025', 'rationalising 29 existing labour laws', 'continue to remain in force']);
  check('pib-labour-reforms-2025-11-21.txt', ['The Equal Remuneration Act, 1976', 'The Factories Act, 1948', 'at least twice the normal rate', 'Negotiating Union', 'Mandatory 14-day notice', 'Aggregators to contribute 1- 2% of annual turnover', 'safety committees', 'compounded by paying 50% of the maximum fine']);
});

test('ABM B U04 B003: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 21); assert.equal(b.items.length, 31);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 9, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
