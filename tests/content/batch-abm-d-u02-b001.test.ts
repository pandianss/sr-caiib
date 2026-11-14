// Structural, calculation and source checks for batch ABM-D-U02-B001 (compliance audit, disclosures, accounting standards, listing disclosures).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-D-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };

test('ABM D U02 B001: year-end worked example and numericals recompute', () => {
  // Inter-branch: net each category on its own, add net debits only, provide 100 per cent.
  const cats = [{ d: 6.0, c: 4.5 }, { d: 2.0, c: 3.0 }, { d: 1.2, c: 0.7 }];
  const netDebit = (x: { d: number; c: number }) => Math.max(0, Math.round((x.d - x.c) * 10) / 10);
  const provision = cats.reduce((s, x) => s + netDebit(x), 0);
  assert.equal(Math.round(provision * 10) / 10, 2.0);
  const wrongSetOff = Math.round((cats[0]!.d - cats[0]!.c + cats[2]!.d - cats[2]!.c - (cats[1]!.c - cats[1]!.d)) * 10) / 10;
  assert.equal(wrongSetOff, 1.0);
  assert.equal(0.25 * 480, 120); assert.equal(0.20 * 480, 96);
  const s = shown('D011');
  for (const p of ['2.0 crore aggregate net debit', 'Provision of Rs 2.0 crore', '100 per cent provision of Rs 40 lakh', 'Rs 25 lakh moves to a Blocked Account', 'At least Rs 120 crore to the Statutory Reserve']) assert.ok(s.includes(p), p);
  const cases: [string, number, string][] = [
    ['D086', Math.round((3.2 + 0.8) * 10) / 10, '4.0'], ['D087', 0.25 * 480 - 0.20 * 480, '24'], ['D088', 3 * 4, '12'], ['D089', 80 / 4, '20'], ['D090', 0.01 * 9000, '90'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    assert.equal(computed, Number(expected), id); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

const norm = (p: string) => readFileSync(p, 'utf8').replace(/\s+/g, ' ');

test('ABM D U02 B001: key phrases appear in the HIA circular (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-hia-scb-2021.txt');
  if (!existsSync(src)) return;
  const t = norm(src);
  for (const p of ['preferably for a minimum of three years', 'at least once in a quarter, without the presence of the senior management', 'shall not be given any business targets', 'shall not be outsourced', 'Ownership of audit reports in all cases shall rest with regular functionaries', 'ability to exercise independent judgement', 'shall be with the ACB and the', 'shall be with the Board in matters of performance', 'controlling office / head office', 'specialised function and managed by career internal auditors']) assert.ok(t.includes(p), p);
});

test('ABM D U02 B001: key phrases appear in the 2025 financial statements Directions (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-fs-2025-167.txt');
  if (!existsSync(src)) return;
  const t = norm(src);
  for (const p of ['outstanding for more than five years', 'if the amount exceeds', 'a provision equivalent to 100 per cent of the aggregate net debit', 'outstanding for more than three years shall be transferred to a Blocked Account', 'outstanding for more than two years', 'not less than 20 per cent of such profit to Reserve Fund', 'not less than 25 per cent', 'not exceeding four quarters', 'the entire provisioning is required to be made at once', 'shall not be transferred to the profit and loss account or to any reserves', 'one per cent of the total income', 'is not mandatory for the quarterly reporting', 'it is presumed that the investor has significant influence', 'RRB shall be treated as an', 'shall include the entire investment portfolio', 'within one month from the publication', 'twenty largest depositors', 'Total amount of top 20 intra-group exposures', 'all the four quarters of relevant financial year', 'Payment and Settlement Systems Act, 2007', 'more than six months']) assert.ok(t.includes(p), p);
});

test('ABM D U02 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 66); assert.equal(b.items.length, 90);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 12 && counts[k]! <= 21, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
