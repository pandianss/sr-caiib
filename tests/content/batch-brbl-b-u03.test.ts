// Exact authored-example arithmetic; passing does not verify the statutory premise or cutoff applicability.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DraftImportBundle } from '../../src/types/contracts.ts';
import { ROOT } from '../helpers.ts';

const b = JSON.parse(readFileSync(join(ROOT, 'content/batches/BRBL-B-U03-B006/draft-bundle.json'), 'utf8')) as DraftImportBundle;
function draft(id: string) {
  const itemId = b.draft_item_map.find(m => m.draft_id === id)?.item_id;
  const item = b.items.find(i => i.id === itemId); assert.ok(item); return item;
}

test('FEMA worked example recomputes the ceiling using five days after the first', () => {
  const example = draft('D002'); assert.ok(example.item_type === 'card' && example.card_type === 'worked_example');
  const base = 240000n * 3n, continuing = 5n * 5000n;
  assert.deepEqual(example.worked_steps.map(s => s.intermediate_result), [base, continuing, base + continuing].map(v => `${v} rupees`));
});

test('FEMA assessments distinguish quantifiable base and total-days versus after-first-day wording', () => {
  const quantifiable = draft('D004'), notQuantifiable = draft('D005');
  assert.ok(quantifiable.item_type === 'question' && quantifiable.question_type === 'numeric_input');
  assert.ok(notQuantifiable.item_type === 'question' && notQuantifiable.question_type === 'numeric_input');
  assert.equal(quantifiable.numeric_rule.expected_answer, (175000n * 3n + 4n * 5000n).toString());
  assert.equal(notQuantifiable.numeric_rule.expected_answer, (200000n + (6n - 1n) * 5000n).toString());
  assert.notEqual(notQuantifiable.numeric_rule.expected_answer, (200000n + 6n * 5000n).toString(), 'the first day is excluded from the additional ceiling');
  for (const item of [quantifiable, notQuantifiable]) {
    assert.equal(item.numeric_rule.unit_label, 'rupees');
    assert.equal(item.numeric_rule.precision_decimals, 0);
    assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null);
  }
});
