// Recomputation and structural checks for batch ABM-C-U01-B003 (asset classification, provisioning and large exposures).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U01-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
// Doubtful asset provision: unsecured part at 100 per cent, secured part at the band rate.
const doubtful = (outstanding: number, security: number, months: number) => {
  const secured = Math.min(outstanding, security); const rate = months <= 12 ? 0.25 : months <= 36 ? 0.40 : 1;
  return (outstanding - secured) + secured * rate;
};

test('ABM C U01 B003: provisioning and exposure-limit worked examples and numericals', () => {
  near(doubtful(80, 50, 18), 50); near(doubtful(80, 50, 6), 42.5); near(50 / 80, 0.625);
  let s = shown('D009'); for (const p of ['Rs 50 lakh', 'Rs 30 lakh', 'Rs 20 lakh']) assert.ok(s.includes(p), p);
  s = shown('D012'); for (const p of ['Rs 1,000 crore', 'Rs 1,250 crore', 'Rs 500 crore']) assert.ok(s.includes(p), p);
  near(0.20 * 5000, 1000); near(0.25 * 5000, 1250); near(0.10 * 5000, 500);
  const cases: [string, number, string][] = [
    ['D050', 0.15 * 120, '18.00'], ['D051', 0.25 * 60, '15.00'], ['D052', doubtful(200, 120, 24), '128.00'], ['D053', 0.01 * 400, '4.00'], ['D054', 0.004 * 500, '2.00'],
    ['D055', 0.20 * 8000, '1600'], ['D056', 0.10 * 8000, '800'], ['D057', Math.max(0, 1900 - 0.25 * 8000), '0'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-9); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U01 B003: key phrases appear in the Directions (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('rbi-dor-2025-164.txt', ['overdue for a period of more than 90 days', 'remains continuously in excess of the sanctioned limit', 'borrower-wise and not facility-wise', 'less than fifty per cent of the value', 'less than ten per cent of the outstanding', 'entire arrears of interest and principal', 'actual receipt basis', 'general provision of 15 per cent', 'additional provision of 10 per cent', 'Up to one year 25', 'More than three years 100', 'shall attract 0.40 per cent standard asset', 'not more than ten per cent, ab-initio']);
  check('rbi-dor-2025-158.txt', ['shall not be higher than 20 percent', 'additional five percent exposure', 'shall not be higher than 25 percent', 'equal to or above 10 percent of the bank', '0.25 percent', '50 percent or more of one counterparty', 'Deleted with effect from January 01, 202']);
});

test('ABM C U01 B003: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 37); assert.equal(b.items.length, 57);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 12, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
