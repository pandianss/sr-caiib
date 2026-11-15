// Usage: node scripts/revise-draft.mjs content/batches/BATCH
// Edit staging/config first. Retains complete old envelopes and bumps changed canonical item revisions.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, renameSync } from 'node:fs';
import { resolve, join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { assertDraftLineage, reviseDraftBundle } from '../src/import/draft-revisions.mjs';

try {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  if (args.length !== 1) throw new Error('Usage: node scripts/revise-draft.mjs content/batches/BATCH');
  const path = resolve(root, args[0]), base = join(root, 'content/batches');
  const inside = relative(base, path);
  if (!inside || inside.startsWith('..') || inside.includes(sep)) throw new Error('Select one batch directory directly inside content/batches');
  const read = p => JSON.parse(readFileSync(p, 'utf8'));
  const catalogue = read(join(root, 'public/content/catalogue.json'));
  const bundlePath = join(path, 'draft-bundle.json');
  const previous = read(bundlePath);
  if (previous.import_config.origin !== 'source_assisted') throw new Error('Release-content revision command rejects fixture origin');
  const historyPath = join(path, 'draft-history');
  const historyNames = existsSync(historyPath) ? readdirSync(historyPath).filter(f => /^\d{4}\.json$/.test(f)).sort() : [];
  const history = historyNames.map(f => read(join(historyPath, f)));
  assertDraftLineage(previous, history, catalogue);
  const next = reviseDraftBundle(previous, read(join(path, 'staging.json')), read(join(path, 'import-config.json')), catalogue);
  if (isDeepStrictEqual(next, previous)) { console.log('No change; no revision or archive created.'); }
  else {
    // Never silently edit an identity currently delivered to learners through this authoring-only command.
    const published = new Set(readdirSync(join(root, 'content/packs')).filter(f => f.endsWith('.json')).flatMap(f => read(join(root, 'content/packs', f)).pack.items.map(i => i.id)));
    if (next.items.some(i => published.has(i.id))) throw new Error('A delivered identity needs the reviewed published-correction workflow');
    const sequence = historyNames.length ? Number(historyNames.at(-1).slice(0, 4)) + 1 : 1;
    if (sequence > 9999) throw new Error('Draft history sequence limit reached');
    const snapshotName = `${String(sequence).padStart(4, '0')}.json`;
    mkdirSync(historyPath, { recursive: true });
    writeFileSync(join(historyPath, snapshotName), JSON.stringify(previous, null, 2) + '\n', { flag: 'wx' });
    const temporary = join(path, 'draft-bundle.next.json');
    writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { flag: 'wx' });
    renameSync(temporary, bundlePath);
    const beforeById = new Map(previous.items.map(i => [i.id, i.revision]));
    console.log(`Revised ${inside}: ${next.items.filter(i => i.revision !== beforeById.get(i.id)).length} item revisions advanced; previous envelope retained in draft-history/${snapshotName}. No publication created.`);
  }
} catch (error) { console.error(`revise-draft: ${error.message}`); process.exitCode = 1; }
