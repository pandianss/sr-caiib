// Independent deterministic recomputation for batch BFM-A-U08-B001 (EXIM Bank, RBI, FEMA, FEDAI, depositary receipts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, mustDec, round, toPlain } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U08-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
/** Section 11(3): basic ceiling 10,000 plus 2,000 for every day of a continuing contravention. */
const ceiling = (days: string) => add(d('10000'), mul(d('2000'), d(days)));

test('A8-B001 D010: penalty ceiling worked example', () => {
  const card = itemFor('D010') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(at(mul(d('2000'), d('15')), 0), '30000'); assert.equal(at(ceiling('15'), 0), '40000');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['10,000', '30,000', '40,000']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('A8-B001 D036 and D037: numerical questions', () => {
  const q1 = itemFor('D036') as QuestionItem; if (q1.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(ceiling('9'), 0), '28000'); assert.equal(q1.numeric_rule.expected_answer, '28000');
  for (const wrong of ['18000', '30000', '12000', '10000']) { const g = gradeNumeric(wrong, q1.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q2 = itemFor('D037') as QuestionItem; if (q2.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(sub(d('250000'), d('135000')), 0), '115000'); assert.equal(q2.numeric_rule.expected_answer, '115000');
  for (const wrong of ['135000', '250000', '385000', '125000']) { const g = gradeNumeric(wrong, q2.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('A8-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D011: 'B', D012: 'C', D013: 'D', D014: 'A', D015: 'C', D016: 'B', D017: 'D', D018: 'A', D019: 'B', D020: 'C', D021: 'D', D022: 'A', D023: 'B', D024: 'C', D025: 'D', D026: 'A', D027: 'B', D028: 'C', D029: 'D', D030: 'A', D031: 'B', D032: 'C', D033: 'D', D034: 'A', D035: 'B' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
