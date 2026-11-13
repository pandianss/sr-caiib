// Independent deterministic recomputation for batch BFM-B-U04-B001 (market risk).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-B-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
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

test('B4-B001 D009: BPV profit and loss', () => {
  const bpv = mul(d('1850'), d('25')); assert.equal(at(bpv, 0), '46250'); assert.equal(at(mul(bpv, d('6')), 0), '277500'); assert.equal(at(mul(bpv, d('4')), 0), '185000');
  const shown = shownOf(itemFor('D009') as StudyCard);
  for (const t of ['₹46,250 per bp', '₹2,77,500', '₹1,85,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B4-B001 D010: duration of a three-year bond', () => {
  const y = d('1.09');
  const pv1 = div(d('9'), y, 10, 'HALF_UP'), pv2 = div(d('9'), mul(y, y), 10, 'HALF_UP'), pv3 = div(d('109'), mul(mul(y, y), y), 10, 'HALF_UP');
  assert.equal(at(pv1, 4), '8.2569'); assert.equal(at(pv2, 4), '7.5751'); assert.equal(at(pv3, 4), '84.1680');
  const price = add(add(pv1, pv2), pv3); assert.equal(at(price, 2), '100.00');
  const weighted = add(add(mul(d('1'), pv1), mul(d('2'), pv2)), mul(d('3'), pv3)); assert.equal(at(weighted, 3), '275.911');
  const mac = div(weighted, price, 10, 'HALF_UP'); assert.equal(at(mac, 4), '2.7591');
  const mod = div(mac, y, 10, 'HALF_UP'); assert.equal(at(mod, 4), '2.5313');
  const pct = mul(mod, d('0.5')); assert.equal(at(pct, 4), '1.2656'); assert.equal(at(add(d('100'), mul(d('100'), div(pct, d('100'), 10, 'HALF_UP'))), 2), '101.27');
  const shown = shownOf(itemFor('D010') as StudyCard);
  for (const t of ['8.2569; 7.5751; 84.1680', '100.00', '275.911', '2.7591 years', '2.5313', '+1.2656%', '101.27']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B4-B001 D011: value at risk of a position', () => {
  const sd = mul(d('25000000'), d('0.012')); assert.equal(at(sd, 0), '300000'); const v1 = mul(sd, d('2.326')); assert.equal(at(v1, 0), '697800'); assert.equal(at(mul(v1, d('4')), 0), '2791200');
  const shown = shownOf(itemFor('D011') as StudyCard);
  for (const t of ['₹3,00,000', '₹6,97,800', '₹27,91,200']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('B4-B001 D038 to D042: numerical questions', () => {
  const q1 = numeric('D038'); assert.equal(at(mul(mul(d('2100'), d('40')), d('5')), 0), '420000'); assert.equal(q1.numeric_rule.expected_answer, '420000'); wrongs(q1, ['84000', '105000', '4200000', '21000']);
  const q2 = numeric('D039'); const chg = mul(d('98'), mul(d('3.4'), d('0.0025'))); assert.equal(at(sub(d('98'), chg), 2), '97.17'); assert.equal(q2.numeric_rule.expected_answer, '97.17'); wrongs(q2, ['97.00', '98.83', '97.50', '96.50']);
  const q3 = numeric('D040'); assert.equal(at(mul(mul(d('8000000'), d('0.02')), d('1.65')), 0), '264000'); assert.equal(q3.numeric_rule.expected_answer, '264000'); wrongs(q3, ['160000', '372160', '528000', '26400']);
  const q4 = numeric('D041'); assert.equal(at(mul(d('3.5'), d('3')), 1), '10.5'); assert.equal(q4.numeric_rule.expected_answer, '10.5'); wrongs(q4, ['31.5', '3.5', '7.0', '35.0']);
  const q5 = numeric('D042'); assert.equal(at(mul(d('250'), d('0.01')), 1), '2.5'); assert.equal(q5.numeric_rule.expected_answer, '2.5'); wrongs(q5, ['25.0', '0.5', '5.0', '250.0']);
});

test('B4-B001: choice questions well formed, answers as intended; all drafts', () => {
  const letters = ['B', 'C', 'D', 'A'];
  for (let i = 0; i < 26; i++) {
    const id = 'D' + String(12 + i).padStart(3, '0');
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, letters[i % 4]);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
