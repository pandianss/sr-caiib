// Editorial draft revisions only. Published corrections require a new reviewed pack.
import { isDeepStrictEqual } from 'node:util';
import { importStaging } from './staging.mjs';

function assertUnreviewed(bundle) {
  if (bundle?.schema_version !== 'draft-import-1' || bundle.publication_state !== 'draft') throw new Error('Only draft-import envelopes can be revised');
  for (const item of bundle.items) {
    if (item.publication_state !== 'draft' || item.review !== null) throw new Error('Reviewed or published items require the separate review/publication workflow');
    if (!Number.isSafeInteger(item.revision) || item.revision < 1) throw new Error('Invalid draft revision');
  }
}
const atInitialRevision = bundle => ({ ...bundle, items: bundle.items.map(item => ({ ...item, revision: 1 })) });

/** Reimport exact payload/evidence, retaining IDs and advancing only changed canonical items. */
export function reviseDraftBundle(previous, staging, config, catalogue) {
  assertUnreviewed(previous);
  const oldImport = importStaging(previous.source_batch, catalogue, previous.import_config);
  if (!isDeepStrictEqual(atInitialRevision(previous), oldImport)) throw new Error('Previous draft is inconsistent with its retained source/config');
  if (config.origin !== previous.import_config.origin) throw new Error('Draft revision cannot change origin');
  const next = importStaging(staging, catalogue, config);
  const before = new Map(previous.items.map(i => [i.id, i]));
  if (next.items.length !== before.size || next.items.some(i => !before.has(i.id))) throw new Error('A revision must retain the exact item identities; author additions/removals in an explicit separate batch workflow');
  next.items = next.items.map(item => {
    const prior = before.get(item.id);
    const changed = !isDeepStrictEqual({ ...prior, revision: 1 }, item);
    const revision = prior.revision + (changed ? 1 : 0);
    if (!Number.isSafeInteger(revision)) throw new Error('Draft revision exceeds the supported integer range');
    return { ...item, revision };
  });
  return next;
}

/** Every noninitial revision must be reproducible from a complete ordered chain of prior envelopes. */
export function assertDraftLineage(bundle, history, catalogue) {
  let previous = null;
  for (const current of [...history, bundle]) {
    assertUnreviewed(current);
    const expected = previous
      ? reviseDraftBundle(previous, current.source_batch, current.import_config, catalogue)
      : importStaging(current.source_batch, catalogue, current.import_config);
    if (!isDeepStrictEqual(expected, current)) throw new Error('Stale or modified draft bundle, or missing/invalid revision history');
    previous = current;
  }
  return bundle;
}
