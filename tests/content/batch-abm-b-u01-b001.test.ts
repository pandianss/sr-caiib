// Structural checks for batch ABM-B-U01-B001 (qualitative HR content; no calculations).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle, QuestionItem, StudyCard } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-B-U01-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const staging = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-B-U01-B001', 'staging.json'), 'utf8')) as { facts: { fact_id: string; statement: string }[] };

test('ABM B U01: 12 cards and 25 choice questions, all unreviewed drafts mapped to unit objectives', () => {
  const cards = b.items.filter(i => i.item_type === 'card') as StudyCard[]; const qs = b.items.filter(i => i.item_type === 'question') as QuestionItem[];
  assert.equal(cards.length, 12); assert.equal(qs.length, 25); assert.equal(b.items.length, 37);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.deepEqual(q.options.map(o => o.option_id), ['A', 'B', 'C', 'D']); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
});

test('ABM B U01: the correct answers are spread across the four positions', () => {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const i of b.items) if (i.item_type === 'question') counts[(i as QuestionItem & { correct_option_id: string }).correct_option_id]!++;
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 9, `${k}: ${counts[k]}`);
});

test('ABM B U01: counts quoted in the lessons match the listed items', () => {
  const f12 = staging.facts.find(f => f.fact_id === 'F012')!.statement;
  const nine = ['communication', 'initiative', 'drive', 'creativity', 'self-confidence', 'teamwork', 'influence', 'problem solving', 'inter-personal skills'];
  const ten = ['business knowledge', 'change management', 'diversity management', 'service orientation', 'execution excellence', 'financial perspective', 'building expertise', 'personal credibility', 'relationship management', 'strategic thinking and alignment'];
  assert.equal(nine.length + ten.length, 19); for (const w of [...nine, ...ten]) assert.ok(f12.includes(w), w);
  const shrm = ['Leadership and Navigation', 'Ethical Practice', 'Business Acumen', 'Relationship Management', 'Consultation', 'Critical Evaluation', 'Global and Cultural Effectiveness', 'Communication', 'HR expertise'];
  assert.equal(shrm.length, 9); for (const w of shrm) assert.ok(f12.includes(w), w);
});
