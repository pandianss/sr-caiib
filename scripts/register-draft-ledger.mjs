// Register source-assisted draft evidence without publishing or manufacturing completed reviews.
// Usage: node scripts/register-draft-ledger.mjs content/batches/BATCH [...]
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDraftLineage } from '../src/import/draft-revisions.mjs';

/** Pure reconciliation; validate every bundle before constructing a new ledger. */
export function registerDraftEvidence(existing, inputs, catalogue) {
  const rebuilt = inputs.map(({ bundle, reviewRef, history = [] }) => {
    if (typeof reviewRef !== 'string' || !reviewRef.trim()) throw new Error('A review/evidence record reference is required');
    const expected = assertDraftLineage(bundle, history, catalogue);
    if (bundle.import_config.origin !== 'source_assisted') throw new Error('Synthetic fixture evidence cannot enter the release content ledger');
    return { bundle: expected, reviewRef };
  });
  const rows = structuredClone(existing);
  const byId = new Map(rows.map(r => [r.objective_id, r]));
  if (byId.size !== rows.length) throw new Error('Existing ledger has duplicate objectives');
  const objectives = new Map(catalogue.objectives.map(o => [o.id, o]));
  const add = (list, value) => { if (!list.includes(value)) list.push(value); };
  for (const { bundle, reviewRef } of rebuilt) {
    const byItem = new Map(bundle.items.map(i => [i.id, i]));
    for (const item of byItem.values()) {
      for (const oid of item.objective_ids) {
        const objective = objectives.get(oid);
        if (!objective || objective.unit_id !== item.unit_id) throw new Error(`Invalid objective ancestry: ${oid}`);
        let row = byId.get(oid);
        if (!row) {
          row = { objective_id: oid, statement: objective.title, origin: 'editorial', source_support: 'partial', lesson_item_ids: [], worked_example_item_ids: [], assessment_item_ids: [], teaching_adequate: false, assessment_adequate: false, review: { source: 'pending', originality: 'pending', calculations: 'not_applicable', record_refs: [] }, published_item_ids: [], gaps: [], source_caveats: [] };
          rows.push(row); byId.set(oid, row);
        }
        if (row.published_item_ids.includes(item.id)) throw new Error(`${item.id}: published identity must not be re-registered as a draft`);
        if (item.item_type === 'question') add(row.assessment_item_ids, item.id);
        else if (item.item_type === 'card' && item.card_type === 'worked_example') add(row.worked_example_item_ids, item.id);
        else if (item.item_type === 'card') add(row.lesson_item_ids, item.id);
        row.review.source = 'pending'; row.review.originality = 'pending';
        if (item.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(item.card_type)) row.review.calculations = 'pending';
        add(row.review.record_refs, reviewRef);
        row.source_caveats ??= [];
        for (const issue of bundle.source_batch.unresolved) add(row.source_caveats, issue);
        add(row.gaps, 'Draft evidence only: source/session applicability, originality and pedagogy require independent review before publication.');
        row.teaching_adequate = row.lesson_item_ids.length + row.worked_example_item_ids.length > 0;
        row.assessment_adequate = row.assessment_item_ids.length >= 2;
      }
    }
  }
  return rows.sort((a, b) => a.objective_id.localeCompare(b.objective_id, 'en', { numeric: true }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const paths = process.argv.slice(2);
    if (!paths.length) throw new Error('Usage: node scripts/register-draft-ledger.mjs content/batches/BATCH [...]');
    const read = p => JSON.parse(readFileSync(p, 'utf8'));
    const catalogue = read(join(root, 'public/content/catalogue.json'));
    const inputs = paths.map(p => {
      const path = resolve(root, p);
      const reviewPath = join(path, 'review.md');
      if (!existsSync(reviewPath)) throw new Error(`No authoring/review evidence record: ${reviewPath}`);
      const historyPath = join(path, 'draft-history');
      const history = existsSync(historyPath) ? readdirSync(historyPath).filter(f => /^\d{4}\.json$/.test(f)).sort().map(f => read(join(historyPath, f))) : [];
      return { bundle: read(join(path, 'draft-bundle.json')), history, reviewRef: relative(root, reviewPath).replaceAll('\\', '/') };
    });
    const papers = new Set(inputs.map(i => i.bundle.import_config.paper_id));
    if (papers.size !== 1) throw new Error('Register one paper per invocation so all validation finishes before its single ledger write');
    const paper = [...papers][0];
    const path = join(root, 'content/ledger', `${paper}.json`);
    const rows = registerDraftEvidence(existsSync(path) ? read(path) : [], inputs, catalogue);
    writeFileSync(path, JSON.stringify(rows, null, 2) + '\n');
    console.log(`Registered ${inputs.length} draft bundles in ${paper} ledger (${rows.length} objectives). No publication or passed review created.`);
  } catch (error) {
    console.error(`register-draft-ledger: ${error.message}`); process.exitCode = 1;
  }
}
