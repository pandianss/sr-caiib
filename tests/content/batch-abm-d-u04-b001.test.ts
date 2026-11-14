// Structural, calculation and source checks for batch ABM-D-U04-B001 (compliance audit, disclosures, accounting standards, listing disclosures).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-D-U04-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };

test('ABM D U04 B001: reporting calendar worked example and numericals recompute', () => {
  const addDays = (d: string, n: number) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  assert.equal(addDays('2026-09-30', 5), '2026-10-05'); assert.equal(addDays('2026-09-30', 10), '2026-10-10');
  const s = shown('D009');
  for (const p of ['Due by 5 October (to the regional or zonal office)', 'Due by 10 October (to the Compliance department, copy to the Risk officer)', 'Due by 10 October (to the Compliance department)', 'Due by 5 October (to the Compliance department through the Chief Executive of the centre, copy to the International Department)', '5 days for consolidation']) assert.ok(s.includes(p), p);
  const scoreLevel = (x: number) => x <= 3 ? 'well' : x <= 5 ? 'meets' : x <= 7 ? 'improve' : 'significant';
  assert.equal(scoreLevel(2), 'well'); assert.equal(scoreLevel(4.2), 'meets'); assert.equal(scoreLevel(6), 'improve'); assert.equal(scoreLevel(7.1), 'significant');
  const cases: [string, number, string][] = [['D075', Math.round(0.8 * 0.25 * 100) / 100, '0.20'], ['D076', 40 * (12 / 3), '160'], ['D077', 0.05 * 400, '20'], ['D078', 30 * 4, '120']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    assert.equal(computed, Number(expected), id); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

const norm = (p: string) => readFileSync(p, 'utf8').replace(/\s+/g, ' ');

test('ABM D U04 B001: policy and review rules appear in the CCO circular (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-notif-11962.txt');
  if (!existsSync(src)) return;
  const t = norm(src);
  for (const p of ['at least once in three years', 'The policy shall be reviewed at least once a year', 'The compliance function shall be subject to internal audit', 'submitted to the ACB for approval and be made available to the internal audit', 'To conduct assessment of the compliance risk (at least once a year)', 'in both letter and spirit in a time bound and sustainable manner']) assert.ok(t.includes(p), p);
});

test('ABM D U04 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 60); assert.equal(b.items.length, 78);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 10 && counts[k]! <= 20, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
