// Entirely synthetic, in-memory engineering fixtures; nothing here enters the content ledger or packs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importStaging } from '../src/import/staging.mjs';
import { registerDraftEvidence } from '../scripts/register-draft-ledger.mjs';

const read = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const catalogue = read('catalogue.sample.json');
function input(origin = 'source_assisted') {
  // Simulate this importer mode only in memory. All source identities remain explicitly synthetic.
  const config = { ...read('import-config.sample.json'), origin };
  return { bundle: importStaging(read('staging-batch.sample.json'), catalogue, config), reviewRef: 'SYNTHETIC_AUTHOR_EVIDENCE.md' };
}

test('draft evidence is idempotent and cannot manufacture publication or a passed review', () => {
  const first = registerDraftEvidence([], [input()], catalogue);
  assert.deepEqual(registerDraftEvidence(first, [input()], catalogue), first);
  assert.equal(first.length, 2);
  for (const row of first) {
    assert.deepEqual(row.published_item_ids, []);
    assert.equal(row.review.source, 'pending');
    assert.equal(row.review.originality, 'pending');
    assert.ok(row.gaps.length > 0);
  }
  assert.equal(first.find(r => r.objective_id.includes('U02')).review.calculations, 'pending');
});

test('stale canonical text and broken source references reject the whole input without mutating the ledger', () => {
  const original = registerDraftEvidence([], [input()], catalogue);
  const before = structuredClone(original);
  const stale = input(); stale.bundle.items[0].title = 'Tampered after import';
  assert.throws(() => registerDraftEvidence(original, [input(), stale], catalogue), /[Ss]tale or modified/);
  const broken = input(); broken.bundle.source_batch.drafts[0].fact_ids = ['MISSING_FACT'];
  assert.throws(() => registerDraftEvidence(original, [broken], catalogue));
  assert.deepEqual(original, before);
});

test('fixture origin, absent evidence and cross-unit mapping cannot be registered', () => {
  assert.throws(() => registerDraftEvidence([], [input('synthetic_fixture')], catalogue), /Synthetic fixture/);
  const missing = input(); missing.reviewRef = '';
  assert.throws(() => registerDraftEvidence([], [missing], catalogue), /record reference/);
  const ancestry = input(); ancestry.bundle.import_config.mappings[0].unit_id = 'BFM::MOD_TEST::U02';
  assert.throws(() => registerDraftEvidence([], [ancestry], catalogue));
});

test('existing published identity is rejected and retained evidence cannot be silently reclassified', () => {
  const incoming = input();
  const previous = registerDraftEvidence([], [incoming], catalogue);
  previous[0].published_item_ids.push(previous[0].lesson_item_ids[0]);
  const before = structuredClone(previous);
  assert.throws(() => registerDraftEvidence(previous, [incoming], catalogue), /published identity/);
  assert.deepEqual(previous, before);
});

test('new draft material preserves old published IDs, gaps and reviewer references while reopening review', () => {
  const previous = registerDraftEvidence([], [input()], catalogue);
  previous[0].published_item_ids = ['SYNTHETIC_OLDER_PUBLISHED_ID'];
  previous[0].review.source = 'passed'; previous[0].review.originality = 'passed';
  previous[0].review.record_refs.push('SYNTHETIC_OLDER_REVIEW.md');
  previous[0].gaps.push('SYNTHETIC unresolved exception');
  const next = registerDraftEvidence(previous, [input()], catalogue);
  assert.deepEqual(next[0].published_item_ids, ['SYNTHETIC_OLDER_PUBLISHED_ID']);
  assert.ok(next[0].review.record_refs.includes('SYNTHETIC_OLDER_REVIEW.md'));
  assert.ok(next[0].gaps.includes('SYNTHETIC unresolved exception'));
  assert.equal(next[0].review.source, 'pending');
  assert.equal(previous[0].review.source, 'passed');
});
