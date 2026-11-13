// Independent deterministic recomputation for batch BFM-A-U02-B004 (travel foreign exchange and overseas investment).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, sub, mul, mustDec, round, toPlain, cmp } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U02-B004', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('U02-B004 D005: financial commitment headroom', () => {
  const card = itemFor('D005') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  const ceiling = mul(d('250'), d('4')); assert.equal(at(ceiling, 0), '1000');
  const headroom = sub(ceiling, d('680')); assert.equal(at(headroom, 0), '320');
  assert.equal(at(sub(d('400'), headroom), 0), '80');
  assert.ok(cmp(mul(d('275'), d('4')), add(d('680'), d('400'))) >= 0);
  assert.equal(at(sub(mul(d('275'), d('4')), d('680')), 0), '420');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['1,000 crore', '320 crore', '80 crore']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U02-B004 D019 and D020: numerical questions', () => {
  const q1 = itemFor('D019') as QuestionItem; if (q1.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(sub(mul(d('180'), d('4')), d('510')), 0), '210'); assert.equal(q1.numeric_rule.expected_answer, '210');
  for (const wrong of ['720', '510', '330', '110']) { const g = gradeNumeric(wrong, q1.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
  const q2 = itemFor('D020') as QuestionItem; if (q2.question_type !== 'numeric_input') throw new Error('numeric');
  const total = add(d('2750'), d('1100')); assert.equal(at(total, 0), '3850');
  assert.equal(at(sub(total, d('2000')), 0), '1850'); assert.equal(q2.numeric_rule.expected_answer, '1850');
  for (const wrong of ['1890', '3850', '1810', '2000']) { const g = gradeNumeric(wrong, q2.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U02-B004: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D006: 'B', D007: 'C', D008: 'D', D009: 'A', D010: 'C', D011: 'B', D012: 'D', D013: 'A', D014: 'B', D015: 'C', D016: 'D', D017: 'B', D018: 'C' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
