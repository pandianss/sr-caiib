// Recomputation and structural checks for batch ABM-C-U09-B001 (the Insolvency and Bankruptcy Code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U09-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };
const near = (a: number, e: number, tol = 1e-9) => assert.ok(Math.abs(a - e) < tol, `${a} vs ${e}`);

// Distribute proceeds down the ranked claims; equal-ranking classes share pro rata.
const distribute = (proceeds: number, ranks: number[][]) => { let left = proceeds; return ranks.map(cls => { const claim = cls.reduce((a, c) => a + c, 0); const paid = Math.min(left, claim); left -= paid; return paid; }); };

test('ABM C U09 B001: voting, waterfall and pre-pack worked examples recompute', () => {
  const voting = 400 + 300 + 200; near(400 / voting * 100, 44.444444, 1e-5); near(300 / voting * 100, 33.333333, 1e-5); near(700 / voting * 100, 77.777778, 1e-5);
  let s = shown('D005'); for (const p of ['Voting debt Rs 900 crore', '44.44 per cent', '33.33 per cent', '77.78 per cent', '270 days', '330 days at most']) assert.ok(s.includes(p), p);
  const paid = distribute(60, [[5], [10, 20], [5], [25], [8]]); assert.deepEqual(paid, [5, 30, 5, 20, 0]); near(20 / 25 * 100, 80);
  s = shown('D012'); for (const p of ['Rs 55 crore left', 'Rs 25 crore left', 'Rs 20 crore left', 'Rs 20 crore paid', '80.00 per cent', 'Rs 0 crore left']) assert.ok(s.includes(p), p);
  near((300 - 60) * 0.66, 158.4, 1e-9);
  s = shown('D014'); for (const p of ['Rs 240 lakh', 'Rs 158.40 lakh', 'Within 90 days', 'Within 120 days']) assert.ok(s.includes(p), p);
});

test('ABM C U09 B001: numerical answers recompute and grade', () => {
  const cases: [string, number, string][] = [['D057', 400 / 900 * 100, '44.44'], ['D058', 700 / 900 * 100, '77.78'], ['D059', 180 + 90, '270'], ['D060', 60 - 5 - 10 - 20 - 5, '20'], ['D061', 20 / 25 * 100, '80.00'], ['D062', (300 - 60) * 0.66, '158.40']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    near(computed, Number(expected), 5e-3); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

test('ABM C U09 B001: key phrases appear in the Code and the 2026 Act (local copies, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('ibc-2016-upto-2021-08-12.txt', ['minimum amount of the default is one lakh rupees', 'completed within a period of one hundred and eighty days from the date of admission', 'not exceeding ninety days', 'not been granted more than once'.replace('not been granted', 'not be granted'), 'three hundred and thirty days from the insolvency commencement date', 'wilful defaulter in accordance with the guidelines of the Reserve Bank of India', 'is disqualified to act as a director under the Companies Act, 2013', 'is prohibited by the Securities and Exchange Board of India from trading in securities', 'shall be distributed in the following order of priority', 'the insolvency resolution process costs and the liquidation costs paid in full', 'workmen', 'representing not less than sixty-six per cent. in value of the financial debt due to such creditors', 'within a period of one hundred and twenty days from the pre-packaged insolvency commencement date', 'within a period of ninety days from the pre-packaged insolvency commencement date']);
  check('ibc-amendment-act-2026.txt', ['ninety per cent. voting share of the committee of creditors', 'within a period of thirty days from the date of receipt of the application', 'within fourteen days of the receipt of the application', 'he shall be a secured creditor to the extent of the value of such security interest']);
});

test('ABM C U09 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 42); assert.equal(b.items.length, 62);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 15, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
