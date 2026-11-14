// Structural, calculation and source checks for batch ABM-D-U03-B001 (compliance audit, disclosures, accounting standards, listing disclosures).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-D-U03-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };

test('ABM D U03 B001: divergence worked example and numericals recompute', () => {
  const needsDisclosure = (profit: number, addProv: number, incGnpa: number, addGnpa: number) => addProv > 0.05 * profit || addGnpa > 0.05 * incGnpa;
  assert.equal(needsDisclosure(2000, 130, 1800, 95), true);
  assert.equal(needsDisclosure(2500, 100, 2000, 80), false);
  assert.equal(needsDisclosure(2500, 130, 2000, 80), true);
  const s = shown('D013');
  for (const p of ['Rs 100 crore', 'Condition (a) met', 'Rs 90 crore', 'Condition (b) met, so disclosure is required (either condition is enough)', 'Rs 125 crore and Rs 100 crore', 'Neither condition met, so no divergence disclosure is required']) assert.ok(s.includes(p), p);
  const cases: [string, number, string][] = [['D080', (3 * 2) / 2, '3'], ['D081', 0.05 * 2000, '100'], ['D082', 95 - 0.05 * 1800, '5'], ['D083', 6 * 12, '72']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    assert.equal(computed, Number(expected), id); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

const norm = (p: string) => readFileSync(p, 'utf8').replace(/\s+/g, ' ');

test('ABM D U03 B001: key phrases appear in the CCO circular (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-notif-11962.txt');
  if (!existsSync(src)) return;
  const t = norm(src);
  for (const p of ['at least once in three years', 'The CCO shall have direct reporting lines', 'quarterly on one-to-one basis', 'performance appraisal of the CCO shall be reviewed by the Board/ACB', 'senior executive level selection committee', 'Department of Supervision, Reserve Bank of India, Central Office', 'submitted to the ACB for approval', 'including any committee dealing with purchases', 'he/she may have only advisory role', 'overall responsible for overseeing the effective management']) assert.ok(t.includes(p), p);
});

test('ABM D U03 B001: divergence thresholds appear in the 2025 Directions (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-fs-2025-167.txt');
  if (!existsSync(src)) return;
  const t = norm(src);
  for (const p of ['Divergence in asset classification and provisioning', 'exceeds five per cent of the reported profit before provisions and contingencies', 'exceed five per cent of the reported incremental Gross NPAs', 'published immediately following communication of such divergence by RBI']) assert.ok(t.includes(p), p);
});

test('ABM D U03 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 62); assert.equal(b.items.length, 83);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 11 && counts[k]! <= 20, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
