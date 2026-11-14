// Recomputation and structural checks for batch ABM-C-U07-B001 (credit risk, rating, derivatives and credit information).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
const el = (pd: number, lgd: number, ead: number) => pd * lgd * ead;

test('ABM C U07 B001: scoring and expected loss example recompute', () => {
  near(24 + 28 + 18, 70); near(30 + 40 + 30, 100); near(el(0.02, 0.45, 200), 1.8, 1e-9);
  const s = shown('D007'); for (const p of ['70 marks', '100 marks', '70 per cent', 'Rs 1.8 crore']) assert.ok(s.includes(p), p);
});

test('ABM C U07 B001: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [['D042', 24 + 28 + 18, '70'], ['D043', 70 / 100 * 100, '70.00'], ['D044', el(0.02, 0.45, 200), '1.80'], ['D045', el(0.015, 0.40, 500), '3.00']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U07 B001: key phrases appear in the Directions (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('rbi-dor-2025-151.txt', ['Acuite Ratings & Research Limited (Acuite)', 'Brickwork Ratings India Private Limited', 'CARE Ratings Limited', 'CRISIL Ratings Limited', 'ICRA Limited', 'India Ratings and Research Private Limited (India Ratings)', 'INFOMERICS Valuation and Rating Limited (INFOMERICS)', 'Fitch', 'Moody\'s', 'cherry pick']);
  check('rbi-dor-2025-157.txt', ['independent and objective credit appraisal in all cases', 'sensitivity tests / scenario analysis', 'debt of the parent company is not infused as equity capital']);
  check('rbi-dor-2025-164.txt', ['Central Repository of Information on Large Credits (CRILC)']);
});

test('ABM C U07 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 31); assert.equal(b.items.length, 45);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 11, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
