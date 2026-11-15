import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importStaging } from '../src/import/staging.mjs';
import { assertDraftLineage, reviseDraftBundle } from '../src/import/draft-revisions.mjs';
import { registerDraftEvidence } from '../scripts/register-draft-ledger.mjs';

// Synthetic data is only simulated in memory, never written to the release ledger or packs.
const read = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const catalogue = read('catalogue.sample.json');
const config = { ...read('import-config.sample.json'), origin: 'source_assisted' };
const original = () => importStaging(read('staging-batch.sample.json'), catalogue, config);

test('changed canonical payload advances only that item, retaining IDs and the unreviewed draft gate', () => {
  const before = original(), staging = structuredClone(before.source_batch);
  staging.drafts[0].payload.title = 'SYNTHETIC revised lesson heading';
  const after = reviseDraftBundle(before, staging, config, catalogue);
  assert.deepEqual(after.items.map(i => i.id), before.items.map(i => i.id));
  assert.equal(after.items[0].revision, 2);
  assert.deepEqual(after.items.slice(1).map(i => i.revision), before.items.slice(1).map(i => i.revision));
  for (const item of after.items) { assert.equal(item.publication_state, 'draft'); assert.equal(item.review, null); }
  assert.equal(before.items[0].revision, 1); assert.notEqual(before.items[0].title, after.items[0].title);
});

test('a complete history reproduces revisions and registers without creating passed review or publication', () => {
  const first = original(), secondSource = structuredClone(first.source_batch);
  secondSource.drafts[0].payload.title = 'SYNTHETIC second version';
  const second = reviseDraftBundle(first, secondSource, config, catalogue);
  const thirdSource = structuredClone(secondSource); thirdSource.drafts[0].payload.title = 'SYNTHETIC third version';
  const third = reviseDraftBundle(second, thirdSource, config, catalogue);
  assert.equal(third.items[0].revision, 3);
  assert.equal(assertDraftLineage(third, [first, second], catalogue), third);
  const ledger = registerDraftEvidence([], [{ bundle: third, history: [first, second], reviewRef: 'SYNTHETIC_REVIEW.md' }], catalogue);
  assert.ok(ledger.every(r => r.review.source === 'pending' && r.published_item_ids.length === 0));
});

test('missing history, revision jumps and changed content with a stale revision are rejected', () => {
  const first = original(), staging = structuredClone(first.source_batch);
  staging.drafts[0].payload.title = 'SYNTHETIC changed';
  const second = reviseDraftBundle(first, staging, config, catalogue);
  assert.throws(() => assertDraftLineage(second, [], catalogue), /history/);
  const jump = structuredClone(second); jump.items[0].revision = 7;
  assert.throws(() => assertDraftLineage(jump, [first], catalogue), /history/);
  const stale = structuredClone(second); stale.items[0].revision = 1;
  assert.throws(() => assertDraftLineage(stale, [first], catalogue), /history/);
});

test('evidence-only edits retain canonical revisions; reordering does not transfer revisions between identities', () => {
  const first = original(), staging = structuredClone(first.source_batch);
  staging.unresolved.push('SYNTHETIC new editorial caveat');
  const second = reviseDraftBundle(first, staging, config, catalogue);
  assert.deepEqual(second.items, first.items);
  assertDraftLineage(second, [first], catalogue);
  const reordered = structuredClone(staging); reordered.drafts.reverse();
  const third = reviseDraftBundle(second, reordered, config, catalogue);
  assert.ok(third.items.every(item => item.revision === 1));
  assert.deepEqual(new Set(third.items.map(i => i.id)), new Set(first.items.map(i => i.id)));
});

test('reviewed content, changed origins, altered identity sets and invalid replacement payloads cannot be revised', () => {
  const before = original(), reviewed = structuredClone(before);
  reviewed.items[0].publication_state = 'published';
  assert.throws(() => reviseDraftBundle(reviewed, before.source_batch, config, catalogue), /Reviewed or published/);
  assert.throws(() => reviseDraftBundle(before, before.source_batch, { ...config, origin: 'synthetic_fixture' }, catalogue), /origin/);
  assert.throws(() => reviseDraftBundle(before, before.source_batch, { ...config, content_namespace: 'SYNTHETIC_NEW_NAMESPACE' }, catalogue), /identities/);
  const invalid = structuredClone(before.source_batch); delete invalid.drafts[0].payload.self_check;
  assert.throws(() => reviseDraftBundle(before, invalid, config, catalogue));
});
