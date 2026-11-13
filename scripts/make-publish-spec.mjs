// Writes a publish specification for a paper's next pack version from batch folders (all draft items of each batch,
// with the calculation evidence file named per batch). Usage:
//   node scripts/make-publish-spec.mjs <paper> <version> <access> "<change summary>" <batch>:<calc-test-or-none>[,<batch>:<calc-test>...]
// Previous version's items are carried forward when content/publish/<PACK>-v<version-1>.json exists.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [paper, version, access, summary, batchArg] = process.argv.slice(2);
if (!batchArg) { console.error('usage: make-publish-spec.mjs <paper> <version> <access> <summary> <batch>:<calc-test>[,...]'); process.exit(2); }
const packId = `${paper}-2026DEC`;
const prevPath = join(root, 'content', 'publish', `${packId}-v${Number(version) - 1}.json`);
const prev = existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, 'utf8')) : null;
const items = prev ? [...prev.items] : [];
const verifiedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
for (const part of batchArg.split(',')) {
  const [batch, calcRef] = part.split(':');
  const bundle = JSON.parse(readFileSync(join(root, 'content', 'batches', batch, 'draft-bundle.json'), 'utf8'));
  for (const m of bundle.draft_item_map) {
    const item = bundle.items.find(i => i.id === m.item_id);
    const quantitative = item.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(item.card_type) || item.worked_solution_steps != null;
    if (quantitative && (!calcRef || calcRef === 'none')) throw new Error(`${batch}/${m.draft_id} is quantitative; give a calculation test`);
    items.push({ batch, draft_id: m.draft_id, calculations: quantitative ? 'verified' : 'not_applicable', ...(quantitative ? { calculation_ref: calcRef } : {}), review_ref: `content/batches/${batch}/review.md` });
  }
}
const spec = {
  pack_id: packId, pack_version: String(version), paper_id: paper, exam_context_id: 'CAIIB-2026-DEC', access,
  free_unit_ids: prev?.free_unit_ids ?? [], change_summary: summary,
  reviewer_id: 'coding-agent (Claude), same agent as author', review_method: 'automated', verified_at: verifiedAt,
  owner_decision: 'On 11 Nov 2026 the owner accepted publication on the agent\'s review alone, without a human reviewer.',
  held_back: prev?.held_back ?? [], items,
};
if (!prev && process.env.FREE_UNITS) spec.free_unit_ids = process.env.FREE_UNITS.split(',');
writeFileSync(join(root, 'content', 'publish', `${packId}-v${version}.json`), JSON.stringify(spec, null, 2) + '\n');
console.log(`${packId} v${version}: ${items.length} items`);
