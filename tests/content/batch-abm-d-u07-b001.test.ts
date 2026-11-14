// Structural, calculation and source checks for batch ABM-D-U07-B001 (compliance audit, disclosures, accounting standards, listing disclosures).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeNumeric } from '../../src/core/grading.ts';
import type { ContentItem, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-D-U07-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (draftId: string): ContentItem => {
  const item = b.items.find(i => i.id === b.draft_item_map.find(m => m.draft_id === draftId)?.item_id);
  assert.ok(item, `draft ${draftId} missing`);
  return item;
};
const shown = (id: string) => { const c = itemFor(id) as StudyCard; if (c.card_type !== 'worked_example') throw new Error('worked example expected'); return c.worked_steps.map(s => s.intermediate_result).join(' | '); };

test('ABM D U07 B001: reporting worked examples and numericals recompute', () => {
  const addDays = (d: string, n: number) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  assert.equal(addDays('2027-01-10', 7), '2027-01-17'); assert.equal(addDays('2027-01-10', 180), '2027-07-09');
  const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  assert.equal(daysBetween('2027-06-15', '2027-07-09'), 24);
  const s9 = shown('D009');
  for (const p of ['17 January 2027', '9 July 2027', 'The 180 days have not yet run out (24 days remain)', 'SCBMF review and supervisory review']) assert.ok(s9.includes(p), p);
  assert.equal(addDays('2027-03-10', 14), '2027-03-24'); assert.equal(addDays('2027-03-12', 7), '2027-03-19'); assert.equal(addDays('2027-03-31', 15), '2027-04-15');
  const lea = (priv: boolean, crore: number) => priv ? (crore >= 1 ? 'police+sfio' : 'police') : (crore >= 6 ? 'cbi' : 'police');
  assert.equal(lea(true, 0.8), 'police'); assert.equal(lea(true, 2.5), 'police+sfio'); assert.equal(lea(false, 5.5), 'police'); assert.equal(lea(false, 6), 'cbi');
  const s12 = shown('D012');
  for (const p of ['State or UT Police only', 'State or UT Police and the SFIO (details in FMR format)', 'State or UT Police (not the CBI)', '24 March for all three accounts', 'By 19 March', 'By 15 April']) assert.ok(s12.includes(p), p);
  const cases: [string, number, string][] = [['D130', 180 - 120, '60'], ['D131', [3, 5, 7, 12].filter(x => x >= 5).length, '3'], ['D132', [0.4, 1.0, 1.1].filter(x => x <= 1).length, '2'], ['D133', 3 + 2, '5']];
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

test('ABM D U07 B001: key phrases appear in the 2024 Fraud Risk Management Master Directions (local copy, checked when present)', () => {
  check('rbi-frm-2024.txt', ['A reasonable time of not less than 21 days', 'reviewed by the Board at least once in three years', 'a minimum of three members of the Board, consisting of a whole-time director and a minimum of two independent directors / non-executive directors', 'preferably not more than 30 days', 'within seven days of being red flagged', 'ordinarily be completed within 180 days', 'for a period of five years', 'not later than 14 days from the date of classification', 'State / Union Territory (UT) Police', 'Serious Fraud Investigation Office (SFIO)', 'Central Bureau of Investigation (CBI)', 'at least in the rank of a whole-time director', 'periodic legal audit and re-verification', 'not later than seven days', 'within 15 days from the end of the quarter', 'paying banker', 'Closure Module', 'Central Payments Fraud Information Registry (CPFIR)', 'Aggregate fund-based and non-fund-based exposure of', 'General Manager or equivalent']);
});

test('ABM D U07 B001: key phrases appear in the 2011 internal vigilance circular (local copy, checked when present)', () => {
  check('rbi-civ-2011.txt', ['Chief of Internal Vigilance', 'three years extendable up to a further period of two years', 'overall tenure of six years', 'first week of every month', 'proven integrity and ability to inspire confidence', 'minimum period of mandatory leave in each category of staff, including the CEO', 'malicious, vexatious or unfounded', 'disproportionate to his known sources of income']);
});

test('ABM D U07 B001: BNS equivalents appear in the NCRB correspondence table (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'bns-section-table.txt');
  if (!existsSync(src)) return;
  const t = norm(src);
  assert.match(t, /2\(9\) \S*fraudulently\S* 25\. \S*Fraudulently\S*/);
  for (const p of ['336 (1) 463. Forgery.', '335. Making a false document. 464. Making a false document.']) assert.ok(t.includes(p), p);
});

test('ABM D U07 B001: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 110); assert.equal(b.items.length, 133);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 20 && counts[k]! <= 35, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
