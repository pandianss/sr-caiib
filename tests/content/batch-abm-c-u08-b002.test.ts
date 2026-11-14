// Recomputation and structural checks for batch ABM-C-U08-B002 (resolution framework, project resolution and loan transfers).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U08-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);

test('ABM C U08 B002: worked examples recompute', () => {
  near(0.20 * 800, 160); near(0.35 * 800, 280); near(Math.min(800, 200 + 160), 360); near(200 + 280, 480);
  let s = shown('D005'); for (const p of ['Rs 200 crore', 'Rs 160 crore', 'Rs 360 crore', 'Rs 280 crore', 'Rs 480 crore']) assert.ok(s.includes(p), p);
  const base = 500 + 50; near(0.1 * base, 55); near(0.2 * base, 110);
  s = shown('D007'); for (const p of ['Rs 550 crore', 'Rs 55 crore', 'Rs 110 crore', '1 rating', '2 ratings']) assert.ok(s.includes(p), p);
  near(0.00375 * 2 * 1000, 7.5); near(0.005625 * 3 * 1000, 16.875); near(((1400 - 1000) - 100) / 1000 * 100, 30);
  s = shown('D010'); for (const p of ['Rs 7.5 crore', 'Rs 16.875 crore', 'Rs 300 crore', '30.00 per cent']) assert.ok(s.includes(p), p);
  const nbv = 100 - 60; near(nbv - 30, 10); near(200 * 1.08, 216); near(50 - 44, 6);
  s = shown('D012'); for (const p of ['Rs 40 crore', 'Rs 10 crore', 'Rs 216 crore', 'Rs 6 crore']) assert.ok(s.includes(p), p);
});

test('ABM C U08 B002: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [['D053', 0.2 * 800, '160'], ['D054', 0.35 * 800, '280'], ['D055', 0.1 * 550, '55.0'], ['D056', 0.2 * 550, '110.0'], ['D057', 0.00375 * 2 * 1000, '7.500'], ['D058', 0.005625 * 3 * 1000, '16.875'], ['D059', (400 - 100) / 1000 * 100, '30.00'], ['D060', (100 - 60) - 30, '10'], ['D061', 200 * 1.08, '216'], ['D062', 50 - 44, '6']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U08 B002: key phrases appear in the Directions (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('rbi-dor-2025-165.txt', ['SMA-0 Up to 30 days', 'monthly basis', 'every Friday', 'representing 75 per cent by value of total outstanding credit facilities', 'not less than the liquidation value due to the dissenting signatories', 'RP4 or better', '180th day from the end of the Review Period', '20 per cent', '15 per cent (i.e. total additional provisioning of 35 per cent', 'at least 10 per cent of the sum of outstanding principal debt', 'at least 20 per cent of the sum of outstanding principal debt', 'immediately downgraded', 'investment grade (BBB- or better)', 'at least 26 per cent', 'Up to 3 years Up to 2 years', 'ten per cent of the original project cost', '25 per cent or more of the original outlay', 'only once during the lifetime of the project', '0.375% for infrastructure project loans']);
  check('rbi-dor-2025-159.txt', ['two external valuation reports', 'Swiss Challenge', 'not be less than five per cent and shall not be more than 15 per cent', 'not be less than 12 months from the date of such transfer', 'risk premium will be subject to a floor of 3 per cent', 'at least six months', 'Transfer of Borrower Accounts at the Request/Instance of Borrower', 'credit information from the transferor bank']);
});

test('ABM C U08 B002: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 39); assert.equal(b.items.length, 62);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 14, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
