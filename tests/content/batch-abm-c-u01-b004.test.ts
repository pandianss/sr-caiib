// Recomputation and structural checks for batch ABM-C-U01-B004 (priority sector eligibility, MSME classification, collateral-free MSE loans).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U01-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);
type Cat = 'micro' | 'small' | 'medium' | 'above';
// Composite classification for a fresh enterprise: the lowest category whose ceilings (investment, turnover) are both met.
const classify = (inv: number, turn: number): Cat => inv <= 2.5 && turn <= 10 ? 'micro' : inv <= 25 && turn <= 100 ? 'small' : inv <= 125 && turn <= 500 ? 'medium' : 'above';
const housingLoanLimit = (population: number) => population >= 50 ? { loan: 50, cost: 63 } : population >= 10 ? { loan: 45, cost: 57 } : { loan: 35, cost: 44 };

test('ABM C U01 B004: classification and eligibility worked examples', () => {
  assert.equal(classify(2, 12), 'small'); assert.equal(classify(30, 90), 'medium'); assert.equal(classify(8 + 9, 60 + 70), 'medium'); assert.equal(classify(130, 300), 'above'); assert.equal(classify(2, 9), 'micro');
  let s = shown('D009'); for (const p of ['A is small', 'B is medium', '17 and 130', 'C is medium', 'D is not an MSME']) assert.ok(s.includes(p), p);
  near(0.02 * 400000, 8000); near(Math.min(9000, 8000), 8000);
  const h1 = housingLoanLimit(25), h2 = housingLoanLimit(60);
  assert.ok(44 <= h1.loan && 56 <= h1.cost); assert.ok(!(52 <= h2.loan)); assert.ok(50 <= h2.loan && 63 <= h2.cost);
  s = shown('D010'); for (const p of ['Rs 8,000 crore', 'Eligible', 'Not eligible (loan limit exceeded)']) assert.ok(s.includes(p), p);
});

test('ABM C U01 B004: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [
    ['D046', Math.min(3.2 + 1.1, 4), '4.00'], ['D047', 0.02 * 400000, '8000'], ['D048', 0.32 * 100000, '32000'], ['D049', Math.min(45, housingLoanLimit(15).loan), '45'], ['D050', 60 + 70, '130'], ['D051', 2.5 - 1.0, '1.50'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 1e-6); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U01 B004: key phrases appear in the primary texts (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('rbi-psl-2025.txt', ['aggregate limit of ₹4 crore per borrowing entity', 'up to ₹90 lakh against Negotiable Warehouse Receipt', 'aggregate sanctioned limit of ₹100 crore per borrower', 'not less than 75 per cent', 'up to 2 per cent of ANBC', 'not exceeding ₹25 lakh', 'Loans up to a limit of ₹8 crore per borrower', 'Loans up to a limit of ₹12 crore per borrower', 'Bank loans up to a limit of ₹35 crore']);
  check('msme-so-1364e-2025.txt', ['two crore and fifty lakh', 'twenty five crore', 'one hundred twenty five crore', 'five hundred crore', 'same Permanent Account Number', 'Exports of goods or services']);
  check('rbi-msme-amend-2026-02-09-extract.txt', ['not to accept collateral security in the case of loans up to Rs 20 lakh', 'up to Rs 25 lakh as per their internal policy', 'on or after April 01, 2026']);
});

test('ABM C U01 B004: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 35); assert.equal(b.items.length, 51);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 13, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
