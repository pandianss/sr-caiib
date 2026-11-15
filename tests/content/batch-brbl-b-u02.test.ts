// Authored-content arithmetic evidence, not evidence of legal currency or editorial approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const bundle = JSON.parse(readFileSync(join(ROOT, 'content/batches/BRBL-B-U02-B013/draft-bundle.json'), 'utf8')) as DraftImportBundle;
const item = (draftId: string) => {
  const id = bundle.draft_item_map.find(m => m.draft_id === draftId)?.item_id;
  const found = bundle.items.find(i => i.id === id);
  assert.ok(found, draftId); return found;
};
const fifth = (rupees: bigint) => { assert.equal(rupees % 5n, 0n); return rupees / 5n; };

test('BRBL NI worked example independently recomputes each base and the combined assumed orders', () => {
  const example = item('D002');
  assert.ok(example.item_type === 'card' && example.card_type === 'worked_example');
  const interim = fifth(750000n), appeal = fifth(900000n);
  assert.deepEqual(example.worked_steps.map(s => s.intermediate_result), [interim, appeal, interim + appeal].map(n => `${n} rupees`));
  assert.equal(interim + appeal, 330000n);
});

test('BRBL NI assessments use the cheque for the ceiling and award for the additional appeal floor', () => {
  const ceiling = item('D004'), floor = item('D005');
  assert.ok(ceiling.item_type === 'question' && ceiling.question_type === 'numeric_input');
  assert.ok(floor.item_type === 'question' && floor.question_type === 'numeric_input');
  assert.equal(ceiling.numeric_rule.expected_answer, fifth(465000n).toString());
  assert.equal(floor.numeric_rule.expected_answer, fifth(680000n).toString());
  assert.notEqual(floor.numeric_rule.expected_answer, (fifth(680000n) - 70000n).toString(), 'prior interim compensation is not deducted from the additional deposit');
  for (const q of [ceiling, floor]) {
    assert.equal(q.numeric_rule.unit_label, 'rupees');
    assert.equal(q.numeric_rule.precision_decimals, 0);
    assert.equal(q.publication_state, 'draft');
    assert.equal(q.review, null);
  }
});
