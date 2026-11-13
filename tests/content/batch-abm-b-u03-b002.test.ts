// Structural checks for batch ABM-B-U03-B002 (qualitative HR content; no calculations).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-B-U03-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;

test('ABM B U03 part 2: 12 cards and 32 choice questions, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question') as QuestionItem[];
  assert.equal(b.items.filter(i => i.item_type === 'card').length, 12); assert.equal(qs.length, 32); assert.equal(b.items.length, 44);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.deepEqual(q.options.map(o => o.option_id), ['A', 'B', 'C', 'D']); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4);
    assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1);
  }
});

test('ABM B U03 part 2: correct answers are spread across the four positions', () => {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const i of b.items) if (i.item_type === 'question') counts[(i as QuestionItem & { correct_option_id: string }).correct_option_id]!++;
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 6 && counts[k]! <= 10, `${k}: ${counts[k]}`);
});
