// Independent deterministic recomputation for batch BFM-A-U05-B003 (export finance and Gold Card).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mul, mustDec, round, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'BFM-A-U05-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const d = mustDec;
const at = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);
const addDays = (s: string, n: number) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) + n * 86400000).toISOString().slice(0, 10);

test('U05-B003 D007: usance credit deadline and stand-by limit', () => {
  const card = itemFor('D007') as StudyCard;
  if (card.card_type !== 'worked_example') throw new Error('expected a worked example');
  assert.equal(addDays('2026-02-01', 365), '2027-02-01');
  assert.equal(addDays('2026-02-01', 180), '2026-07-31'); // the old 180-day distractor date is not 1 August
  const standby = mul(d('420000000'), d('0.20'));
  assert.equal(at(standby, 2), '84000000.00');
  const shown = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const t of ['1 February 2027', formatIndian(standby, 2)]) assert.ok(shown.includes(t), `${t} not in ${shown}`);
});

test('U05-B003 D008: stand-by limit numerical', () => {
  const q = itemFor('D008') as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric');
  assert.equal(at(mul(d('365000000'), d('0.20')), 2), '73000000.00'); assert.equal(q.numeric_rule.expected_answer, '73000000.00');
  assert.deepEqual(gradeNumeric('73000000', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '73000000.00' });
  for (const wrong of ['36500000', '365000000', '292000000']) { const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong); }
});

test('U05-B003: choice questions well formed, answers as intended; all drafts', () => {
  const answers: Record<string, string> = { D009: 'B', D010: 'D', D011: 'C', D012: 'A', D013: 'B', D014: 'C', D015: 'D', D016: 'A', D017: 'B' };
  for (const [id, correct] of Object.entries(answers)) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'single_choice') throw new Error('choice');
    assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.correct_option_id, correct);
  }
  const q17 = itemFor('D017') as QuestionItem & { options: { option_id: string; text_md: string }[] };
  assert.ok(q17.options.find(o => o.option_id === 'B')!.text_md === '1 February 2027');
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
