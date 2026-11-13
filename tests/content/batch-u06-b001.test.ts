// Independent deterministic recomputation for batch BFM-A-U06-B001 (external commercial borrowings, trade credit).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, mul, sub, mustDec, round, toPlain, cmp } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
/** Limit test: pass test (a) or test (b) of the borrowing limit (USD million). */
function withinLimit(netWorth: string, ecbOutstanding: string, domestic: string, proposed: string): { a: boolean; b: boolean; ok: boolean } {
  const ecbAfter = add(d(ecbOutstanding), d(proposed)), totalAfter = add(ecbAfter, d(domestic));
  const a = cmp(ecbAfter, d('1000')) <= 0, bb = cmp(totalAfter, mul(d(netWorth), d('3'))) <= 0;
  return { a, b: bb, ok: a || bb };
}

test('U06-B001 D008: the two-test limit', () => {
  const card = itemFor('D008') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.deepEqual(withinLimit('600', '900', '400', '200'), { a: false, b: true, ok: true });
  assert.equal(at(mul(d('600'), d('3')), 0), '1800'); assert.equal(at(add(add(d('900'), d('200')), d('400')), 0), '1500');
  assert.equal(at(sub(mul(d('600'), d('3')), d('400')), 0), '1400'); // self-check: total ECB ceiling under test (b)
  assert.equal(at(sub(d('1400'), d('900')), 0), '500');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['1,100', '1,800', '1,500']) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U06-B001 D009: headroom under the net worth test', () => {
  const q = itemFor('D009') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  const headroom = sub(mul(d('450'), d('3')), add(d('300'), d('600')));
  assert.equal(at(headroom, 0), '450'); assert.equal(q.numeric_rule.expected_answer, '450');
  assert.deepEqual(gradeNumeric('450', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '450' });
  for (const wrong of ['1350', '900', '150']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U06-B001: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D010: 'B', D011: 'D', D012: 'C', D013: 'A', D014: 'B', D015: 'D', D016: 'C', D017: 'B', D018: 'A', D019: 'D' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q16 = itemFor('D016') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q16.options.find(o => o.option_id === 'C')!.text_md.startsWith('30 April 2026'));
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
