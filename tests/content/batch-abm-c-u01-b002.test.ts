// Recomputation and structural checks for batch ABM-C-U01-B002 (pricing of advances, against RBI_IRA_2025).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U01-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const carry = (crr: number, mc: number) => crr * mc / (1 - crr);

test('ABM C U01 B002: MCLR build-up worked example and numericals', () => {
  near(carry(0.04, 8), 0.333333, 1e-6); const mclr = 8 + carry(0.04, 8) + 0.5 + 0.2; near(mclr, 9.03333, 1e-5); near(mclr + 1, 10.03333, 1e-5);
  const s = shown('D008'); for (const p of ['0.3333 per cent', 'MCLR 9.0333 per cent', '1.00 per cent', '10.0333 per cent']) assert.ok(s.includes(p), p);
  const buckets = [15.1, 11.8, 9.3, 16.9]; let c = 0, n = 0; for (const x of buckets) { c += x; n++; if (c > 30) break; } assert.equal(n, 3); near(15.1 + 11.8, 26.9); near(15.1 + 11.8 + 9.3, 36.2);
  const cases: [string, number, string][] = [['D031', carry(0.04, 8), '0.3333'], ['D032', 8 + 0.3333 + 0.5 + 0.2, '9.0333'], ['D033', 9.0333 + 1, '10.0333'], ['D034', n, '3'], ['D035', 0.04 * 7.5, '0.30']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 5e-5); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U01 B002: key phrases appear in the Directions (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-dor-2025-161.txt');
  if (!existsSync(src)) return;
  const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
  for (const p of ['Required CRR x (marginal cost) / (1- CRR)'.replace(/\s+/g, ' '), 'at least once in three months', 'one year or lower', 'Marginal cost of funds', 'Tenor premium', 'uniform external benchmark within a loan category', 'Three-months and Six-months Treasury Bill', 'once in three years', 'cannot be negative', '30 percent']) assert.ok(t.includes(p), p);
});

test('ABM C U01 B002: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 22); assert.equal(b.items.length, 35);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 3 && counts[k]! <= 8, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
