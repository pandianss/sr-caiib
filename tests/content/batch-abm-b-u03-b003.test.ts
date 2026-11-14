// Structural and source checks for batch ABM-B-U03-B003 (PoSH Act and BNS offences against women). No calculations.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle, QuestionItem } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content', 'batches', 'ABM-B-U03-B003', 'draft-bundle.json'), 'utf8')) as DraftImportBundle;

test('ABM B U03 B003: key phrases appear in the source copies (local, checked when present)', () => {
  const check = (file: string, phrases: string[]) => {
    const src = join(ROOT, 'content', 'sources', 'primary', file);
    if (!existsSync(src)) return;
    const t = readFileSync(src, 'utf8').replace(/\s+/g, ' ');
    for (const p of phrases) assert.ok(t.includes(p), `${file}: ${p}`);
  };
  check('wcd-posh-handbook.txt', ['Physical contact or advances', 'A demand or request for sexual favours', 'Making sexually coloured remarks', 'Showing pornography', 'within three months of the last alleged incident', 'Any enterprise which employs less than 10 workers']);
  check('pib-2224438.txt', ['whether employed or not', 'volunteers or trainees', 'unpaid interns', 'more than 10 employees']);
  check('bns-section-table.txt', ['74. Assault or use of criminal force to woman with intent to outrage her modesty. 354.', '75. Sexual harassment. 354A.', '77. Voyeurism. (Change) 354C.', '78. Stalking. 354D.', '79. Word, gesture or act intended to insult modesty of a woman. 509.', 'shall not come into force on 1 st July 2024']);
});

test('ABM B U03 B003: choice questions are well formed, answers spread, all unreviewed drafts', () => {
  const qs = b.items.filter(i => i.item_type === 'question' && (i as QuestionItem).question_type === 'single_choice') as QuestionItem[];
  assert.equal(qs.length, 14); assert.equal(b.items.length, 17);
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) {
    if (q.question_type !== 'single_choice') throw new Error('choice expected');
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options.map(o => o.text_md)).size, 4); assert.equal(q.options.filter(o => o.option_id === q.correct_option_id).length, 1); counts[q.correct_option_id]!++;
  }
  for (const k of Object.keys(counts)) assert.ok(counts[k]! >= 2 && counts[k]! <= 6, `${k}: ${counts[k]}`);
  for (const item of b.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
});
