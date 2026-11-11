// Builds a published content pack from reviewed draft bundles, according to a publish specification.
// The specification names every item to publish and the review record that supports it; nothing is published
// by default. Items keep their canonical IDs and citations; they gain a review record and `published` state.
// Usage: node scripts/publish-pack.mjs content/publish/<spec>.json
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack } from '../src/validation/contracts.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const specPath = process.argv[2];
const fail = m => { console.error(`publish-pack: ${m}`); process.exit(1); };
if (!specPath) fail('usage: node scripts/publish-pack.mjs content/publish/<spec>.json');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
for (const k of ['pack_id', 'pack_version', 'paper_id', 'exam_context_id', 'access', 'change_summary', 'reviewer_id', 'review_method', 'verified_at', 'items']) if (spec[k] === undefined) fail(`specification is missing ${k}`);
if (!['human', 'automated', 'mixed'].includes(spec.review_method)) fail('review_method must be human, automated or mixed');
const catalogue = JSON.parse(readFileSync(join(root, 'public', 'content', 'catalogue.json'), 'utf8'));

const items = [];
for (const entry of spec.items) {
  const bundlePath = join(root, 'content', 'batches', entry.batch, 'draft-bundle.json');
  if (!existsSync(bundlePath)) fail(`no draft bundle for batch ${entry.batch}`);
  if (!entry.review_ref || !existsSync(join(root, entry.review_ref))) fail(`${entry.batch}/${entry.draft_id}: review record ${entry.review_ref} not found`);
  const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
  const id = bundle.draft_item_map.find(m => m.draft_id === entry.draft_id)?.item_id;
  const item = bundle.items.find(i => i.id === id);
  if (!item) fail(`${entry.batch}/${entry.draft_id}: draft not found`);
  if (item.origin === 'synthetic_fixture') fail(`${entry.batch}/${entry.draft_id}: synthetic fixtures cannot be published`);
  if (!item.citations?.length) fail(`${entry.batch}/${entry.draft_id}: no source citation`);
  const quantitative = item.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(item.card_type) || item.worked_solution_steps != null;
  if (quantitative && entry.calculations !== 'verified') fail(`${entry.batch}/${entry.draft_id}: quantitative item needs calculations "verified" with a recomputation test`);
  if (quantitative && !(entry.calculation_ref && existsSync(join(root, entry.calculation_ref)))) fail(`${entry.batch}/${entry.draft_id}: calculation evidence file missing`);
  items.push({ ...item, publication_state: 'published', review: { verified_at: spec.verified_at, reviewer_id: spec.reviewer_id, method: spec.review_method, source_verified: true, answer_checked: true, calculations: quantitative ? 'verified' : (entry.calculations ?? 'not_applicable') } });
}
const pack = { schema_version: '2.0.0', pack_id: spec.pack_id, pack_version: spec.pack_version, syllabus_version: catalogue.syllabus_version, exam_context_id: spec.exam_context_id, paper_id: spec.paper_id, items };
const result = validatePack(pack, catalogue);
if (!result.ok) fail(`pack failed validation:\n  ${result.issues.slice(0, 12).map(i => `${i.path}: ${i.message}`).join('\n  ')}`);
mkdirSync(join(root, 'content', 'packs'), { recursive: true });
const out = join(root, 'content', 'packs', `${spec.pack_id}.json`);
writeFileSync(out, JSON.stringify({ access: spec.access, free_unit_ids: spec.free_unit_ids ?? [], change_summary: spec.change_summary, minimum_client_version: spec.minimum_client_version ?? '0.1.0', published_from: specPath.replace(/\\/g, '/'), pack }, null, 1) + '\n');
console.log(`published ${items.length} items → ${out} (pack ${spec.pack_id} v${spec.pack_version}, review: ${spec.review_method} by ${spec.reviewer_id})`);
