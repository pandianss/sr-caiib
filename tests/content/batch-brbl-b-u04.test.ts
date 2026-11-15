import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

// Authored arithmetic in an assumed approved arrangement; not a legal or live-system certification.
const b = JSON.parse(readFileSync(join(ROOT, 'content/batches/BRBL-B-U04-B006/draft-bundle.json'), 'utf8')) as DraftImportBundle;
function draft(id: string) {
  const itemId = b.draft_item_map.find(m => m.draft_id === id)?.item_id;
  const item = b.items.find(i => i.id === itemId); assert.ok(item); return item;
}

test('PSS worked example reconciles gross sides to a net debit using integer rupees', () => {
  const worked = draft('D002'); assert.ok(worked.item_type === 'card' && worked.card_type === 'worked_example');
  const outgoing = 180000n + 70000n, incoming = 90000n + 40000n;
  assert.deepEqual(worked.worked_steps.map(s => s.intermediate_result), [`${outgoing} rupees`, `${incoming} rupees`, `${outgoing - incoming} rupees net debit`]);
});

test('PSS assessed net debits use outgoing minus incoming rather than gross totals or reversed sign', () => {
  const first = draft('D004'), second = draft('D005');
  assert.ok(first.item_type === 'question' && first.question_type === 'numeric_input');
  assert.ok(second.item_type === 'question' && second.question_type === 'numeric_input');
  assert.equal(first.numeric_rule.expected_answer, (210000n + 65000n - 95000n - 55000n).toString());
  assert.equal(second.numeric_rule.expected_answer, (480000n - 315000n).toString());
  assert.notEqual(first.numeric_rule.expected_answer, (210000n + 65000n).toString());
  assert.notEqual(second.numeric_rule.expected_answer, (315000n - 480000n).toString());
  for (const item of [first, second]) {
    assert.equal(item.numeric_rule.unit_label, 'rupees'); assert.equal(item.numeric_rule.precision_decimals, 0);
    assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null);
  }
});
