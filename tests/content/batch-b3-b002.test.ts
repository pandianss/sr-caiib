// Independent deterministic recomputation for batch BFM-B-U03-B002 (credit, market and operational risk capital; CRM).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, cmp, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U03-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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
/** E* = max(0, E(1+He) - C(1-Hc-Hfx)) */
const eStar = (e: string, he: string, c: string, hc: string, hfx: string) => { const v = sub(mul(d(e), add(d('1'), d(he))), mul(d(c), sub(sub(d('1'), d(hc)), d(hfx)))); return cmp(v, d('0')) > 0 ? v : d('0'); };

test('B3-B002 D010: corporate risk-weighted assets', () => {
  const rwa = add(add(add(mul(d('200'), d('0.2')), mul(d('150'), d('0.5'))), mul(d('100'), d('1'))), mul(d('40'), d('1.5')));
  assert.equal(at(rwa, 0), '275'); assert.equal(at(mul(rwa, d('0.09')), 2), '24.75'); assert.equal(at(mul(rwa, d('0.115')), 3), '31.625');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['₹40 crore', '₹75 crore', '₹100 crore', '₹60 crore', '₹275 crore', '₹24.75 crore', '₹31.625 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B002 D011: exposure after collateral', () => {
  assert.equal(at(eStar('100', '0', '50', '0.06', '0.08'), 0), '57'); assert.equal(at(mul(mul(d('50'), sub(sub(d('1'), d('0.06')), d('0.08'))), d('1')), 0), '43');
  const shown = shownOf(itemFor('D011') as StudyCard);
  for (const t of ['₹43 crore', '₹57 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B002 D012: general market risk with horizontal disallowance', () => {
  const net = add(sub(d('60'), d('45')), d('120')); assert.equal(at(net, 0), '135');
  const horizontal = mul(d('45'), d('0.4')); assert.equal(at(horizontal, 0), '18'); assert.equal(at(add(net, horizontal), 0), '153');
  const shown = shownOf(itemFor('D012') as StudyCard);
  for (const t of ['₹135 crore', '₹45 crore', '₹18 crore', '₹153 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B3-B002 D041 to D046: numerical questions', () => {
  const q1 = numeric('D041'); assert.equal(at(add(add(mul(d('120'), d('0.3')), mul(d('80'), d('1'))), mul(d('50'), d('1.5'))), 0), '191'); assert.equal(q1.numeric_rule.expected_answer, '191'); wrongs(q1, ['250', '170', '150', '136']);
  const q2 = numeric('D042'); assert.equal(at(eStar('200', '0', '120', '0.10', '0.08'), 2), '101.60'); assert.equal(q2.numeric_rule.expected_answer, '101.60'); wrongs(q2, ['98.40', '80.00', '200.00', '104.00']);
  const q3 = numeric('D043'); assert.equal(at(mul(d('500'), add(d('0.1125'), d('0.09'))), 2), '101.25'); assert.equal(q3.numeric_rule.expected_answer, '101.25'); wrongs(q3, ['90.00', '56.25', '45.00', '126.56']);
  const q4 = numeric('D044'); assert.equal(at(mul(cmp(d('80'), d('100')) >= 0 ? d('80') : d('100'), d('0.09')), 0), '9'); assert.equal(q4.numeric_rule.expected_answer, '9'); wrongs(q4, ['7', '8', '80', '100']);
  const q5 = numeric('D045'); assert.equal(at(mul(div(add(d('400'), d('500')), d('2'), 4, 'HALF_UP'), d('0.15')), 1), '67.5'); assert.equal(q5.numeric_rule.expected_answer, '67.5'); wrongs(q5, ['45.0', '30.0', '22.5', '90.0']);
  const q6 = numeric('D046'); assert.equal(at(mul(sub(d('100'), d('25')), d('1')), 0), '75'); assert.equal(q6.numeric_rule.expected_answer, '75'); wrongs(q6, ['100', '112', '150', '37']);
});

test('B3-B002: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 28; i++) {
    const id = 'D' + String(13 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
