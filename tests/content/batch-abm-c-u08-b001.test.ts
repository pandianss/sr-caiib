// Recomputation and structural checks for batch ABM-C-U08-B001 (stressed assets, wilful defaulters, recovery, compromise and write-off).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U08-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);

test('ABM C U08 B001: PCR and compromise examples recompute', () => {
  near(60 / 150 * 100, 40); near(90 / 150 * 100, 60);
  let s = shown('D002'); for (const p of ['40.00 per cent', '60.00 per cent']) assert.ok(s.includes(p), p);
  near(66 / 1.10, 60); near(55 * 1.10, 60.5, 1e-9);
  s = shown('D011'); for (const p of ['Rs 60.00 lakh', 'Rs 50.00 lakh', 'acceptable', 'Treated as restructuring']) assert.ok(s.includes(p), p);
});

test('ABM C U08 B001: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [['D050', 60 / 150 * 100, '40.00'], ['D051', 0.6 * 150, '90'], ['D052', 66 / 1.10, '60.00'], ['D053', Math.max(0, 55 / 1.10 - 50), '0.00']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U08 B001: key phrases appear in the Directions (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('rbi-dor-2025-166.txt', ['within 21 days of issuance of show cause notice', 'within 15 days of such a proposal', 'right to be represented by a lawyer', 'within six months of the account being classified as NPA', 'outstanding amount is ₹25 lakh and above', 'a period of five years after the name of wilful defaulter has been removed', 'effective for a period of one year after the name of the wilful defaulter has been removed', 'Director Identification Number (DIN)', 'outstanding amount of ₹1 crore and above']);
  check('rbi-dor-2025-165.txt', ['maximise the possible recovery from a distressed borrower at minimum expense', 'exceeds three months shall be treated as restructuring', 'floor of 12 months', 'consent decree', 'monetary ceiling of the cases to be referred to the Lok Adalats, organised by Civil Courts shall be ₹20 lakh', '₹10 lakhs and above', 'without involving any waiver of claims against the borrower']);
  check('rbi-dor-2025-164.txt', ['ratio of provisioning to gross non-performing assets']);
});

test('ABM C U08 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 38); assert.equal(b.items.length, 53);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 14, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
