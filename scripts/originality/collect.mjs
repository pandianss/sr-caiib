// Assemble current item text from draft bundles (per latest publish spec) into cur/<PACK>.json for re-scanning.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const W = dirname(fileURLToPath(import.meta.url)), root = join(W, '..', '..');
mkdirSync(join(W, 'cur'), { recursive: true });
for (const f of readdirSync(join(root, 'content/packs'))) {
  const pack = JSON.parse(readFileSync(join(root, 'content/packs', f), 'utf8'));
  const spec = JSON.parse(readFileSync(join(root, pack.published_from), 'utf8'));
  const cache = new Map(), items = [];
  for (const e of spec.items) {
    if (!cache.has(e.batch)) cache.set(e.batch, JSON.parse(readFileSync(join(root, 'content/batches', e.batch, 'draft-bundle.json'), 'utf8')));
    const b = cache.get(e.batch), id = b.draft_item_map.find(m => m.draft_id === e.draft_id).item_id;
    items.push(b.items.find(i => i.id === id));
  }
  writeFileSync(join(W, 'cur', f), JSON.stringify({ pack: { items } }));
  console.log(f, items.length);
}
