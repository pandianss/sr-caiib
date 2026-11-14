// Structural and source checks for batch ABM-C-U03-B002 (bills, NFB facilities, TReDS, CP, factoring, forfaiting). No calculations.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-C-U03-B002', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;

test('ABM C U03 B002: key phrases appear in the Credit Facilities Directions (local copy, checked when present)', () => {
  const src = join(ROOT, 'content', 'sources', 'primary', 'rbi-dor-2025-154.txt');
  if (!existsSync(src)) return;
  const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
  for (const p of ['Structured Financial Messaging system (SFMS)', 'treated as an exposure on the LC issuing bank and not on the borrower', 'shall be discouraged', 'shall not purchase / discount other bills', 'shall not purchase / discounted / negotiate accommodation bills', 'restricted to usance bills held by other banks', 'two / three wheelers', 'aging schedule', 'shall not enter into Repo transactions', 'only on behalf of a customer having funded credit facility', 'irrevocable', 'unconditional', 'incontrovertible', 'unless there is a court order restraining the same', 'Only genuine trade bills shall be co-accepted', 'They derive at least 50 per cent of their income from factoring activity'.replace('They derive', 'They derive')]) {
    const norm = p.replace('shall not purchase / discounted / negotiate accommodation bills', 'shall not purchase / discounted / negotiate accommodation bills');
    assert.ok(t.includes(norm) || t.replace(/ - /g, ' ').includes(norm), norm);
  }
});

test('ABM C U03 B002: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 30); assert.equal(b.items.length, 36);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 4 && counts[k]! <= 11, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
