// Structural and source checks for batch ABM-D-U01-B001 (the compliance function in banks).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-D-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };

test('ABM D U01 B001: eligibility worked example and numericals recompute', () => {
  const eligible = (age: number, total: number, special: number) => age <= 55 && total >= 15 && special >= 5;
  assert.equal(eligible(53, 17, 6), true); assert.equal(eligible(56, 20, 8), false); assert.equal(eligible(53, 17, 4), false);
  const s = shown('D008'); for (const p of ['Age passes', 'Rank passes, so Candidate 1 is eligible', 'Not eligible on age', '31 March 2030']) assert.ok(s.includes(p), p);
  const cases: [string, number, string][] = [['D048', 1 * 5, '5'], ['D049', 12 / 3, '4'], ['D050', (4 + 2) - 5, '1']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    assert.equal(computed, Number(expected)); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM D U01 B001: key phrases appear in the circular (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-notif-11962.txt');
  if (!existsSync(src)) return;
  const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
  for (const p of ['reviewed at least once a year', 'at least once in three years', 'minimum fixed tenure of not less than 3 years', 'Not more than 55 years', 'at least 15 years in the banking or financial services', 'minimum 5 years', 'not below two levels from the CEO', 'quarterly on one-to-one basis', 'shall not be given any business targets', 'dual hatting', 'only advisory role', 'overall responsible for overseeing the effective management']) assert.ok(t.includes(p) || t.includes(p.replace('dual hatting', '?dual hatting?')), p);
});

test('ABM D U01 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 36); assert.equal(b.items.length, 50);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 5 && counts[k]! <= 13, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
