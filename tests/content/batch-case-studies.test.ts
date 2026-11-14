// Calculation and linkage checks for the three audit-driven case study batches (AUD-003).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const load = (id: string) => JSON.parse(readFileSync(join(ROOT, 'content', 'batches', id, 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const q = (b: DraftImportBundle, draft: string): QuestionItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draft)?.item_id);
  assert.ok(item && item.item_type === 'question', draft); return item as QuestionItem;
};
const numeric = (b: DraftImportBundle, draft: string, computed: number, expected: string) => {
  const it = q(b, draft); if (it.question_type !== 'numeric_input') throw new Error('numeric expected');
  assert.equal(it.numeric_rule.expected_answer, expected, draft); assert.equal(computed, Number(expected), draft);
  const g = gradeNumeric(expected, it.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, draft);
};
const linked = (b: DraftImportBundle, n: number) => {
  const cs = b.items.filter(i => i.item_type === 'case_study'); assert.equal(cs.length, 1);
  const c = cs[0]!; if (c.item_type !== 'case_study') throw new Error('case');
  assert.equal(c.question_ids.length, n); assert.ok(c.scenario_narrative_md.split(/\s+/).length >= 150, 'narrative 150+ words');
  for (const id of c.question_ids) assert.equal((b.items.find(i => i.id === id) as QuestionItem).case_study_id, c.id);
  for (const i of b.items) { assert.equal(i.publication_state, 'draft'); assert.equal(i.review, null); }
};

test('Tandon case (ABM-C-U03-B003): limits and current ratio recompute', () => {
  const b = load('ABM-C-U03-B003'); linked(b, 4);
  const ca = 1200, cl = 330;
  const m2 = ca - 0.25 * ca - cl; const gap = ca - cl; const m1 = 0.75 * gap;
  assert.equal(0.25 * ca + 0.75 * ca, ca); assert.ok(m1 > m2);
  numeric(b, 'D002', m2, '570'); numeric(b, 'D003', m1, '652.5'); numeric(b, 'D004', Math.round(ca / (cl + m2) * 100) / 100, '1.33');
  assert.ok(Math.round(ca / (cl + m1) * 100) / 100 === 1.22);
});

test('CIRP case (ABM-C-U09-B002): voting shares, vote combinations and day count recompute', () => {
  const b = load('ABM-C-U09-B002'); linked(b, 4);
  const debts: Record<string, number> = { A: 300, B: 200, C: 150, D: 100 }; const voting = Object.values(debts).reduce((s, x) => s + x, 0);
  assert.equal(voting, 750);
  const share = (...k: string[]) => k.reduce((s, x) => s + debts[x]!, 0) / voting * 100;
  numeric(b, 'D002', Math.round(share('A') * 100) / 100, '40.00');
  assert.ok(share('A', 'C') < 66); assert.ok(share('A', 'B') >= 66); assert.ok(share('A', 'D') < 66); assert.ok(share('B', 'C', 'D') < 66); assert.ok(share('C', 'D') < 66);
  numeric(b, 'D005', 330 - (180 + 90), '60');
});

test('CRAR case (BFM-B-U03-B005): ratios, band and CET1 shortfall recompute', () => {
  const b = load('BFM-B-U03-B005'); linked(b, 4);
  const rwa = 40000, cet1 = 3000, at1 = 600, t2 = 800;
  assert.equal(at1 / rwa, 0.015); assert.equal(t2 / rwa, 0.02);
  numeric(b, 'D002', Math.round((cet1 + at1 + t2) / rwa * 1e4) / 100, '11.00');
  numeric(b, 'D003', Math.round(cet1 / rwa * 1e4) / 100, '7.50');
  const ratio = cet1 / rwa * 100; assert.ok(ratio > 7.375 && ratio <= 8.0);
  numeric(b, 'D005', 0.08 * rwa - cet1, '200');
});

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d; };
const nextBankingDays = (iso: string, n: number) => { let d = new Date(`${iso}T00:00:00Z`); let left = n; while (left > 0) { d = addDays(d.toISOString().slice(0, 10), 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) left -= 1; } return d; };

test('Usance LC case (BFM-A-U04-B007): presentation period, examination deadline and due date recompute', () => {
  const b = load('BFM-A-U04-B007'); linked(b, 5);
  assert.equal(new Date('2026-02-12T00:00:00Z').getUTCDay(), 4); assert.equal(new Date('2026-03-02T00:00:00Z').getUTCDay(), 1);
  assert.equal(addDays('2026-02-12', 21).toISOString().slice(0, 10), '2026-03-05');
  assert.ok(new Date('2026-03-02T00:00:00Z') <= addDays('2026-02-12', 21));
  assert.equal(addDays('2026-02-12', 90).toISOString().slice(0, 10), '2026-05-13');
  numeric(b, 'D003', nextBankingDays('2026-03-02', 5).getUTCDate(), '9');
  assert.equal(nextBankingDays('2026-03-02', 5).getUTCMonth(), 2);
});

test('Forward contract FEDAI case (BFM-A-U01-B011): matured contract deadline and cancellation difference recompute', () => {
  const b = load('BFM-A-U01-B011'); linked(b, 4);
  assert.equal(new Date('2026-01-16T00:00:00Z').getUTCDay(), 5);
  numeric(b, 'D003', nextBankingDays('2026-01-16', 3).getUTCDate(), '21');
  const contract = 84.0, ttSelling = 84.8, usd = 100000;
  numeric(b, 'D004', Math.round((ttSelling - contract) * usd), '80000');
  assert.ok((83.6 - contract) * usd < 0);
});
