// Independent deterministic recomputation for batch BFM-B-U06-B001 (operational risk).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, cmp, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const shownOf = (c: StudyCard) => { if (c.card_type !== 'worked_example') throw new Error('expected a worked example'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const numeric = (id: string) => { const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric'); return q; };
const wrongs = (q: QuestionItem, vals: string[]) => { if (q.question_type !== 'numeric_input') throw new Error('numeric'); for (const w of vals) { const g = gradeNumeric(w, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, w); } };
/** Business indicator component: 12% to 8,000; 15% to 240,000; 18% above (crore). */
const bic = (bi: string) => {
  const x = d(bi);
  const part = (lo: string, hi: string | null, rate: string) => { const l = d(lo); if (cmp(x, l) <= 0) return d('0'); const top = hi && cmp(x, d(hi)) > 0 ? d(hi) : x; return mul(sub(top, l), d(rate)); };
  return add(add(part('0', '8000', '0.12'), part('8000', '240000', '0.15')), part('240000', null, '0.18'));
};

test('B6-B001 D008: standardised approach', () => {
  assert.equal(at(mul(d('400'), d('0.18')), 0), '72'); assert.equal(at(mul(d('1200'), d('0.12')), 0), '144'); assert.equal(at(mul(d('2000'), d('0.15')), 0), '300');
  assert.equal(72 + 144 + 300, 516); assert.equal(400 + 1200 + 2000, 3600); assert.equal(at(mul(d('3600'), d('0.15')), 0), '540');
  const shown = shownOf(itemFor('D008') as StudyCard);
  for (const t of ['₹72 crore', '₹144 crore', '₹300 crore', '₹516 crore', '₹3,600 crore', '₹540 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B6-B001 D009: business indicator component', () => {
  assert.equal(at(bic('20000'), 0), '2760'); assert.equal(at(mul(d('15'), d('90')), 0), '1350');
  const shown = shownOf(itemFor('D009') as StudyCard);
  for (const t of ['₹960 crore', '₹1,800 crore', '₹2,760 crore', '₹1,350 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B6-B001 D010: generic risk score', () => {
  const prod = mul(mul(d('3'), d('5')), sub(d('1'), d('0.40'))); assert.equal(at(prod, 0), '9'); assert.equal(Math.sqrt(9).toFixed(2), '3.00');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['0.60', '9', '3.00']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B6-B001 D036 to D041: numerical questions', () => {
  const q1 = numeric('D036'); assert.equal(at(add(add(mul(d('800'), d('0.18')), mul(d('1500'), d('0.12'))), mul(d('1000'), d('0.15'))), 0), '474'); assert.equal(q1.numeric_rule.expected_answer, '474'); wrongs(q1, ['495', '3300', '47.4', '144']);
  const q2 = numeric('D037'); assert.equal(at(bic('30000'), 0), '4260'); assert.equal(q2.numeric_rule.expected_answer, '4260'); wrongs(q2, ['3960', '4500', '3600', '960']);
  const q3 = numeric('D038'); assert.equal(at(mul(d('15'), d('140')), 0), '2100'); assert.equal(q3.numeric_rule.expected_answer, '2100'); wrongs(q3, ['210', '140', '21', '1400']);
  const q4 = numeric('D039'); assert.equal(Math.sqrt(3 * 5 * (1 - 0.4)).toFixed(2), '3.00'); assert.equal(q4.numeric_rule.expected_answer, '3.00'); wrongs(q4, ['9.00', '15.00', '1.80', '4.50']);
  const q5 = numeric('D040'); assert.equal(at(mul(d('450'), d('0.2')), 0), '90'); assert.equal(q5.numeric_rule.expected_answer, '90'); wrongs(q5, ['9', '360', '225', '45']);
  const q6 = numeric('D041'); assert.equal(at(mul(div(add(d('600'), d('720')), d('2'), 6, 'HALF_UP'), d('0.15')), 0), '99'); assert.equal(q6.numeric_rule.expected_answer, '99'); wrongs(q6, ['66', '66.0', '297', '198']);
});

test('B6-B001: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 25; i++) {
    const id = 'D' + String(11 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
