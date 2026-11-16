import test from 'node:test';
import assert from 'node:assert/strict';
import { spreadAcrossUnits } from '../../src/core/session.ts';

test('a mixed set takes one question from each unit in turn and loses none', () => {
  const qs = [{ id: 'a1', unit_id: 'A' }, { id: 'a2', unit_id: 'A' }, { id: 'a3', unit_id: 'A' }, { id: 'b1', unit_id: 'B' }, { id: 'c1', unit_id: 'C' }, { id: 'c2', unit_id: 'C' }];
  const out = spreadAcrossUnits(qs);
  assert.deepEqual(out.map(q => q.id), ['a1', 'b1', 'c1', 'a2', 'c2', 'a3']);
  assert.equal(out.length, qs.length);
  assert.deepEqual(spreadAcrossUnits([]), []);
});
