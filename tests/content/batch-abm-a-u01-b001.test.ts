// Independent deterministic recomputation for batch ABM-A-U01-B001 (statistics: frequency distributions).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { div, mul, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-A-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const dv = (a: ReturnType<typeof mustDec>, b: ReturnType<typeof mustDec>) => div(a, b, 12, 'HALF_UP');
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };

test('ABM U01 D010: boundaries, width and marks of inclusive loan classes', () => {
  const limits: [number, number][] = [[1, 5], [6, 10], [11, 15], [16, 20]]; const [[, u1], [l2]] = limits as [[number, number], [number, number], ...[number, number][]]; const half = (l2 - u1) / 2;
  assert.equal(half, 0.5);
  const bounds = limits.map(([l, u]) => `${l - half}-${u + half}`);
  assert.deepEqual(bounds, ['0.5-5.5', '5.5-10.5', '10.5-15.5', '15.5-20.5']);
  assert.equal(5 + half - (1 - half), 5);
  assert.deepEqual(limits.map(([l, u]) => (l + u) / 2), [3, 8, 13, 18]);
  assert.equal([8, 20, 12, 10].reduce((a, c) => a + c, 0), 50);
  for (const s of ['0.5-5.5; 5.5-10.5; 10.5-15.5; 15.5-20.5', '3, 8, 13, 18', '50']) assert.ok(shown('D010').includes(s), s);
});

test('ABM U01 D011: percentage frequency, density and cumulative counts', () => {
  const f = [40, 36, 30, 14]; const w = [10, 10, 20, 40]; const N = f.reduce((a, c) => a + c, 0);
  assert.equal(N, 120);
  assert.equal(w.join(), [10 - 0, 20 - 10, 40 - 20, 80 - 40].join());
  assert.deepEqual(f.map(x => at(mul(dv(d(String(x)), d('120')), d('100')), 2)), ['33.33', '30.00', '25.00', '11.67']);
  assert.deepEqual(f.map((x, i) => at(dv(d(String(x)), d(String(w[i]))), 2)), ['4.00', '3.60', '1.50', '0.35']);
  let c = 0; assert.deepEqual(f.map(x => (c += x)), [40, 76, 106, 120]);
  c = 0; assert.deepEqual([...f].reverse().map(x => (c += x)).reverse(), [120, 80, 44, 14]);
  const text = shown('D011');
  for (const s of ['33.33, 30.00, 25.00, 11.67', '4.00, 3.60, 1.50, 0.35', '40, 76, 106, 120', '120, 80, 44, 14']) assert.ok(text.includes(s), s);
});

test('ABM U01 D012: discrete frequency distribution from the raw list', () => {
  const card = itemFor('D012') as StudyCard;
  const raw = [2, 1, 3, 2, 2, 4, 1, 2, 3, 2, 1, 5, 2, 3, 2, 1, 2, 4, 3, 2];
  const counts = new Map<number, number>(); for (const v of raw) counts.set(v, (counts.get(v) ?? 0) + 1);
  assert.deepEqual([...counts.entries()].sort(), [[1, 4], [2, 9], [3, 4], [4, 2], [5, 1]]);
  assert.ok(card.core_explanation_md.includes(raw.join(', ')));
  const text = shown('D012');
  assert.ok(text.includes('1: 4; 2: 9; 3: 4; 4: 2; 5: 1') && text.includes('4, 13, 17, 19, 20'));
  assert.ok((card as { final_answer_with_unit: string }).final_answer_with_unit.startsWith('13 of 20'));
});

test('ABM U01 numerical questions: expected answers recomputed and graded', () => {
  const cases: [string, string, string][] = [
    ['D025', at(dv(d('1040'), d('130')), 0), '8'], ['D026', at(dv(d('89'), d('2')), 1), '44.5'], ['D027', at(d('199.5'), 1), '199.5'],
    ['D028', at(mul(dv(d('18'), d('75')), d('100')), 2), '24.00'], ['D029', at(dv(d('30'), d('20')), 2), '1.50'], ['D030', String(12 + 25 + 31), '68'],
  ];
  assert.equal(1250 - 210, 1040); assert.equal(199 + 1, 200); assert.equal(200 - 1 / 2, 199.5);
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    assert.equal(computed, expected, id); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM U01: choice questions have four distinct options, one correct; all items are unreviewed drafts', () => {
  for (let n = 13; n <= 24; n++) {
    const q = itemFor(`D0${n}`) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
  assert.equal(b.items.length, 30);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
