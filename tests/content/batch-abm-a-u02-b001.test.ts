// Independent deterministic recomputation for batch ABM-A-U02-B001 (sampling techniques).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { div, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U02-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const dv = (a: ReturnType<typeof mustDec>, c: ReturnType<typeof mustDec>) => div(a, c, 12, 'HALF_UP');
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
/** Area under the standard normal curve between 0 and z by Simpson's rule (independent of any table). */
const area = (z: number) => { const n = 2000, h = z / n, f = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); let s = f(0) + f(z); for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2); return s * h / 3; };

test('ABM U02 D011: all samples of two from 10, 20, 30, 40', () => {
  const pop = [10, 20, 30, 40]; const N = 4, n = 2;
  const mu = pop.reduce((a, c) => a + c, 0) / N; const varP = pop.reduce((a, c) => a + (c - mu) ** 2, 0) / N;
  assert.equal(mu, 25); assert.equal(varP, 125);
  const means: number[] = []; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) means.push(((pop[i] ?? 0) + (pop[j] ?? 0)) / 2);
  assert.deepEqual(means, [15, 20, 25, 25, 30, 35]);
  assert.equal(means.reduce((a, c) => a + c, 0) / means.length, mu);
  const varM = means.reduce((a, c) => a + (c - mu) ** 2, 0) / means.length;
  assert.equal(varM, 250 / 6);
  assert.ok(Math.abs(varM - (varP / n) * ((N - n) / (N - 1))) < 1e-12); // finite-population formula
  assert.equal(Math.sqrt(varM).toFixed(2), '6.45');
  const t = shown('D011'); for (const s of ['25', '125', '15, 20, 25, 25, 30, 35', '41.67']) assert.ok(t.includes(s), s);
});

test('ABM U02 D012: central limit theorem application with standard normal areas', () => {
  const se = 12000 / Math.sqrt(36); assert.equal(se, 2000);
  assert.equal(area(1).toFixed(4), '0.3413'); assert.equal(area(1.5).toFixed(4), '0.4332');
  assert.equal((2 * 0.3413).toFixed(4), '0.6826'); assert.equal((2 * area(1)).toFixed(4), '0.6827'); // table sum vs exact area: the card states both assert.equal((0.5 - area(1.5)).toFixed(4), '0.0668');
  assert.equal((43000 - 40000) / se, 1.5); assert.equal((38000 - 40000) / se, -1);
  const t = shown('D012'); for (const s of ['0.6826', '0.6827', '0.0668', 'Rs 2,000']) assert.ok(t.includes(s), s);
  assert.equal(12000 / Math.sqrt(144), 1000); // self-check: n = 144
});

test('ABM U02 D013: finite population multiplier cases', () => {
  const mult = Math.sqrt((65 - 16) / (65 - 1)); assert.equal(mult, 0.875);
  assert.equal(120 / Math.sqrt(16), 30); assert.equal(30 * mult, 26.25); assert.ok(16 / 65 > 0.05);
  assert.equal((40 / 1000).toFixed(3), '0.040'); assert.equal(Math.sqrt(960 / 999).toFixed(3), '0.980');
  const t = shown('D013'); for (const s of ['0.875', '26.25', '0.04']) assert.ok(t.includes(s), s);
});

test('ABM U02 formula and notes: card arithmetic quoted in text', () => {
  assert.equal(Math.sqrt(49 / 64), 7 / 8); assert.equal(Math.sqrt(0 / 64), 0);
  assert.equal(40 / 5, 8); assert.equal(12 / 8, 1.5);
  assert.equal((100 / Math.sqrt(10)).toFixed(2), '31.62'); // book prints 31.63 (sqrt 10 rounded to 3.162); the card quotes 31.63 as the courseware figure
  assert.equal(100 / Math.sqrt(100), 10);
  assert.equal(4 / 10, 2 / 5); assert.equal(9 ** 0.5, 3);
});

test('ABM U02 numerical questions: expected answers recomputed and graded', () => {
  const cases: [string, string, string][] = [
    ['D028', at(dv(d('48'), d('8')), 0), '6'],
    ['D029', at(dv(d('250'), d('100')), 2), '2.50'],
    ['D030', String((30 / 2) ** 2), '225'],
    ['D031', at(d(String(Math.sqrt((26 - 10) / (26 - 1)))), 4), '0.8000'],
    ['D032', at(dv(d('40'), d('1000')), 3), '0.040'],
    ['D033', at(dv(d(String(8 + 14 + 20 + 26)), d('4')), 0), '17'],
  ];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    assert.equal(computed, expected, id); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
  assert.equal(500 / Math.sqrt(25), 100);
  // D033 independently: enumerate the six samples
  const pop = [8, 14, 20, 26]; const m: number[] = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) m.push(((pop[i] ?? 0) + (pop[j] ?? 0)) / 2);
  assert.equal(m.reduce((a, c) => a + c, 0) / m.length, 17);
});

test('ABM U02 choice questions: four distinct options, one correct; sampling fractions in D026; all drafts', () => {
  for (let n = 14; n <= 27; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  const fractions = [30 / 100, 20 / 200, 9 / 60, 50 / 2000]; assert.deepEqual(fractions.map(f => f < 0.05), [false, false, false, true]);
  assert.equal(Math.sqrt(4), 2);
  assert.equal(b.items.length, 33);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
