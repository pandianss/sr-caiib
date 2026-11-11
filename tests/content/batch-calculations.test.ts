// Independent deterministic recomputation of every numerical value in authored content batches.
// Each check rebuilds the figure from the scenario inputs with exact decimal arithmetic; it does not read the
// authored working. A mismatch means the draft must be corrected before review can pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { add, div, mul, mustDec, round, sub, toPlain, formatIndian } from '../../src/core/decimal.ts';
import { gradeNumeric } from '../../src/core/grading.ts';
import { validateContentItem } from '../../src/validation/contracts.ts';
import type { ContentItem, CurriculumCatalogue, DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const bundle = (batch: string): DraftImportBundle => JSON.parse(readFileSync(join(ROOT, 'content', 'batches', batch, 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const itemFor = (b: DraftImportBundle, draftId: string): ContentItem => {
  const id = b.draft_item_map.find(m => m.draft_id === draftId)?.item_id;
  const item = b.items.find(i => i.id === id);
  assert.ok(item, `draft ${draftId} missing from bundle`);
  return item;
};
const d = mustDec;
const plain = (x: ReturnType<typeof mustDec>, places: number) => toPlain(round(x, places, 'HALF_UP'), places);

test('BFM-A-U01-B001: worked example D003 (two quotes for one import payment)', () => {
  const b = bundle('BFM-A-U01-B001'); const card = itemFor(b, 'D003') as StudyCard;
  assert.equal(card.item_type === 'card' && card.card_type, 'worked_example');
  const offer = d('83.4175'), margin = d('0.0600'), usd = d('40000'), allIn = d('83.4700');
  const rateA = add(offer, margin);
  const costA = mul(usd, rateA), costB = mul(usd, allIn), saving = sub(costA, costB), hidden = sub(allIn, offer);
  assert.equal(plain(rateA, 4), '83.4775'); assert.equal(plain(costA, 2), '3339100.00'); assert.equal(plain(costB, 2), '3338800.00');
  assert.equal(plain(saving, 2), '300.00'); assert.equal(plain(hidden, 4), '0.0525');
  // Cross-check: the saving equals notional x (Bank A margin - Bank B hidden margin).
  assert.equal(plain(mul(usd, sub(margin, hidden)), 2), '300.00');
  if (card.card_type !== 'worked_example') return;
  const results = card.worked_steps.map(s => s.intermediate_result).join(' | ');
  for (const expected of ['83.4175', '83.4775', formatIndian(costA, 2), formatIndian(costB, 2), '0.0525', '5.25 paise', formatIndian(saving, 2)]) assert.ok(results.includes(expected), `step results should show ${expected}: ${results}`);
  assert.ok(card.final_answer_with_unit.includes('300.00') && card.final_answer_with_unit.includes('5.25 paise'));
});

test('BFM-A-U01-B001: numeric question D006 expected answer and grading', () => {
  const b = bundle('BFM-A-U01-B001'); const q = itemFor(b, 'D006') as QuestionItem;
  assert.equal(q.item_type === 'question' && q.question_type, 'numeric_input');
  if (q.question_type !== 'numeric_input') return;
  const rate = add(d('83.4175'), d('0.0800'));
  const exact = mul(d('12500'), rate);
  assert.equal(plain(rate, 4), '83.4975');
  assert.equal(toPlain(exact), '1043718.75000000'.slice(0, toPlain(exact).length), 'product is exact');
  assert.equal(plain(exact, q.numeric_rule.precision_decimals), q.numeric_rule.expected_answer);
  // Not a rounding tie: the exact value already has two decimals, so the unstated tie rule cannot matter.
  assert.equal(toPlain(round(exact, 2, 'TOWARD_ZERO'), 2), toPlain(round(exact, 2, 'AWAY_FROM_ZERO'), 2));
  assert.deepEqual(gradeNumeric('1043718.75', q.numeric_rule), { status: 'graded', is_correct: true, normalized_response: '1043718.75' });
  // Plausible wrong answers are rejected: using the buying rate, forgetting the margin, deducting the margin.
  for (const wrong of [plain(mul(d('12500'), add(d('83.4125'), d('0.0800'))), 2), plain(mul(d('12500'), d('83.4175')), 2), plain(mul(d('12500'), sub(d('83.4175'), d('0.0800'))), 2)]) {
    const g = gradeNumeric(wrong, q.numeric_rule); assert.equal(g.status === 'graded' && g.is_correct, false, wrong);
  }
  const shown = (q.worked_solution_steps ?? []).map(s => s.intermediate_result).join(' | ');
  assert.ok(shown.includes('83.4975') && shown.includes(formatIndian(exact, 2)), shown);
});

test('BFM-A-U01-B001: value-date question D005 calendar facts', () => {
  const b = bundle('BFM-A-U01-B001'); const q = itemFor(b, 'D005') as QuestionItem;
  if (q.question_type !== 'single_choice') throw new Error('expected a choice question');
  const day = (iso: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  assert.deepEqual(['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17'].map(day), ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday']);
  // Second working day after Thursday 12 November, skipping Saturday and Sunday.
  let date = new Date('2026-11-12T00:00:00Z'); let working = 0;
  while (working < 2) { date = new Date(date.getTime() + 86_400_000); const wd = date.getUTCDay(); if (wd !== 0 && wd !== 6) working += 1; }
  assert.equal(date.toISOString().slice(0, 10), '2026-11-16');
  const correct = q.options.find(o => o.option_id === q.correct_option_id)!;
  assert.match(correct.text_md, /Monday, 16 November 2026/); assert.match(q.stem_md, /Thursday, 12 November 2026/);
  assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
});

test('BFM-A-U01-B001: choice question D004 has four different figures and the bid as the answer', () => {
  const b = bundle('BFM-A-U01-B001'); const q = itemFor(b, 'D004') as QuestionItem;
  if (q.question_type !== 'single_choice') throw new Error('expected a choice question');
  const figures = q.options.map(o => /^(\d+\.\d{4})/.exec(o.text_md)?.[1]);
  assert.equal(new Set(figures).size, 4, figures.join(','));
  assert.ok(q.options.find(o => o.option_id === q.correct_option_id)!.text_md.startsWith('83.2450'));
  assert.equal(plain(div(add(d('83.2450'), d('83.2550')), d('2'), 6), 4), '83.2500'); // the midpoint distractor is the true midpoint
});

test('every imported batch item is a structurally valid draft against the official catalogue', () => {
  const catalogue = JSON.parse(readFileSync(join(ROOT, 'content', 'syllabus', 'caiib-2026.json'), 'utf8')) as { papers: { id: string; modules: { id: string; units: { id: string }[] }[] }[] };
  const objectives = JSON.parse(readFileSync(join(ROOT, 'content', 'objectives', 'BFM.json'), 'utf8')) as CurriculumCatalogue['objectives'];
  const cat: CurriculumCatalogue = {
    syllabus_version: 'IIBF-CAIIB-RULES-SYLLABUS-2026',
    modules: catalogue.papers.flatMap(p => p.modules.map(m => ({ id: m.id, paper_id: p.id }))) as CurriculumCatalogue['modules'],
    units: catalogue.papers.flatMap(p => p.modules.flatMap(m => m.units.map(u => ({ id: u.id, module_id: m.id })))) as CurriculumCatalogue['units'],
    objectives,
  };
  const b = bundle('BFM-A-U01-B001');
  for (const item of b.items) {
    const r = validateContentItem(item, cat); assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); assert.equal(item.origin, 'source_assisted');
  }
});
