// Structural and source checks for batch ABM-D-U05-B001 (compliance culture, GRC framework and whistle-blowing; no calculations).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-D-U05-B001', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;
const norm = (p: string) => readFileSync(p, 'utf8').replace(/\s+/g, ' ');

test('ABM D U05 B001: culture elements appear in the CCO circular (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-notif-11962.txt');
  if (!existsSync(src)) return;
  const t = norm(src);
  for (const p of ['Tone from the Top', 'Accountability', 'Incentive Structure', 'Effective Communication & Challenges']) assert.ok(t.includes(p), p);
});

test('ABM D U05 B001: no quantitative items, choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 59); assert.equal(b.items.length, 70);
  assert.equal(b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'numeric_input').length, 0);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 10 && counts[k]! <= 20, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
