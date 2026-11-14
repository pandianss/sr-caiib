// Structural, calculation and source checks for batch ABM-D-U06-B001 (compliance audit, disclosures, accounting standards, listing disclosures).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-D-U06-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };

test('ABM D U06 B001: group classification, glide path and thresholds recompute', () => {
  const group = [400, 250, 300, 40, 80]; const total = group.reduce((a, b) => a + b, 0);
  assert.equal(total, 1070); assert.ok(total >= 1000);
  const s3 = shown('D003');
  for (const p of ['Rs 1,070 crore', 'Group is at or above the threshold', 'Middle Layer', 'Base Layer', 'Each would be Base Layer on its own']) assert.ok(s3.includes(p), p);
  // CCO rank and tenure for a Middle Layer NBFC.
  const maxLevelUL = 2, maxLevelML = maxLevelUL + 1; assert.equal(maxLevelML, 3); assert.ok(3 <= maxLevelML); assert.ok(3 > maxLevelUL);
  const minTenure = 3 - 1; assert.equal(minTenure, 2);
  const s10 = shown('D010');
  for (const p of ['Level 3 is allowed for NBFC-ML', 'Rank passes for NBFC-ML (it would fail for NBFC-UL)', 'Minimum 2 years allowed in exceptional cases', 'Tenure passes (exceptional case, Board decision)']) assert.ok(s10.includes(p), p);
  const cases: [string, number, string][] = [['D081', total, '1070'], ['D082', 10 - 2, '8'], ['D083', 5 - 2, '3'], ['D084', Math.floor(0.30 * 12) + 1, '4']];
  for (const [id, computed, expected] of cases) {
    const q = itemFor(id) as QuestionItem; if (q.question_type !== 'numeric_input') throw new Error('numeric expected');
    assert.equal(computed, Number(expected), id); assert.equal(q.numeric_rule.expected_answer, expected, id);
    const g = gradeNumeric(expected, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, true, id);
  }
});

const norm = (p: string) => readFileSync(p, 'utf8').replace(/\s+/g, ' ');
const check = (file: string, phrases: string[]) => {
  const src = join(ROOT, 'content', 'sources', 'primary', file);
  if (!existsSync(src)) return;
  const t = norm(src);
  for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
};

test('ABM D U06 B001: key phrases appear in the SBR Directions (local copy, checked when present)', () => {
  check('rbi-nbfc-sbr-2025.txt', ['four layers based on their size, activity and perceived riskiness', 'The Top Layer is ideally expected to be empty', 'all deposit taking NBFCs (NBFCs-D), irrespective of asset size', 'SPD and IDF-NBFC will always remain in the Middle Layer', '1,00,000 crore and above as per the latest audited balance sheet', 'NBFCs having asset size of', 'reviewed every three years', 'within a maximum time-period of 24 months', 'at least for a period of five years', 'does not meet the criteria for classification for five consecutive years', 'shall not be eligible to hold the Certificate of Registration', 'Statutory Auditors are required to certify the asset size', 'By March 31, 2025 By March 31, 2027', 'Second Amendment Directions, 2026 dated June 24, 2026']);
});

test('ABM D U06 B001: key phrases appear in the Governance Directions (local copy, checked when present)', () => {
  check('rbi-nbfc-gov-2025.txt', ['relevant experience of having worked in a bank or an NBFC', 'more than 30 percent of the directors, excluding independent directors', 'not less than three members of its Board of Directors', 'asset size of more than', '5,000 crore shall appoint a Chief Risk Officer', 'without the presence of the MD&CEO, at least on a quarterly basis', 'sufficiently senior in the organization hierarchy', 'shall not be on the Board of more than three NBFCs', 'mandatorily listed within three years', 'formulate a whistle blower mechanism']);
});

test('ABM D U06 B001: key phrases appear in the NBFC CCO circular (local copy, checked when present)', () => {
  check('rbi-nbfc-cco-2022.txt', ['latest by April 1, 2023 and October 1, 2023, respectively', 'at least the first six months of introduction', 'minimum fixed tenure of not less than 3 years', 'relax the minimum tenure by one year', 'not below two levels from the CEO', 'can be relaxed by one level further', 'Senior Supervisory Manager, Department of Supervision', 'unquestionable integrity', 'The Policy shall be reviewed at least once a year', 'nodal point of contact between the NBFC and the regulators']);
});

test('ABM D U06 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 69); assert.equal(b.items.length, 84);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 12 && counts[k]! <= 23, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
