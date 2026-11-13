// Updates content/ledger/<paper>.json from the batches named in a publish specification: for each objective mapped by a
// batch's import config, records lesson, worked-example and assessment item IDs, published item IDs and review evidence.
// Adequacy is a minimum rule (a lesson card and two questions); gaps and caveats stay hand-edited and are preserved.
// Usage: node scripts/update-ledger.mjs content/publish/<PACK>-v<n>.json [calc-test-path]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [specPath, calcTest] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const ledgerPath = join(root, 'content', 'ledger', `${spec.paper_id}.json`);
const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : [];
const objectives = new Map(JSON.parse(readFileSync(join(root, 'content', 'objectives', `${spec.paper_id}.json`), 'utf8')).map(o => [o.id, o]));
const byId = new Map(ledger.map(r => [r.objective_id, r]));
const specBatches = [...new Set(spec.items.map(i => i.batch))];
const publishedDrafts = new Set(spec.items.map(i => `${i.batch}/${i.draft_id}`));
const add = (arr, id) => { if (!arr.includes(id)) arr.push(id); };
const touched = new Set();
for (const batch of specBatches) {
  const bundle = JSON.parse(readFileSync(join(root, 'content', 'batches', batch, 'draft-bundle.json'), 'utf8'));
  const config = JSON.parse(readFileSync(join(root, 'content', 'batches', batch, 'import-config.json'), 'utf8'));
  for (const m of config.mappings) {
    if (!publishedDrafts.has(`${batch}/${m.draft_id}`)) continue;
    const id = bundle.draft_item_map.find(x => x.draft_id === m.draft_id)?.item_id;
    const item = bundle.items.find(i => i.id === id);
    for (const oid of m.objective_ids) {
      if (!objectives.has(oid)) throw new Error(`${oid} is not registered in content/objectives`);
      let r = byId.get(oid);
      if (!r) { r = { objective_id: oid, statement: objectives.get(oid).title, origin: 'editorial', source_support: 'supported', lesson_item_ids: [], worked_example_item_ids: [], assessment_item_ids: [], review: { source: 'passed', originality: 'passed', calculations: 'not_applicable', record_refs: [] }, published_item_ids: [], teaching_adequate: false, assessment_adequate: false, gaps: [], source_caveats: [] }; byId.set(oid, r); ledger.push(r); }
      touched.add(oid);
      if (item.item_type === 'question' || item.question_type) add(r.assessment_item_ids, id);
      else if (item.card_type === 'worked_example') add(r.worked_example_item_ids, id);
      else add(r.lesson_item_ids, id);
      add(r.published_item_ids, id);
      for (const ref of [`content/batches/${batch}/review.md`, specPath.replaceAll('\\', '/'), ...(calcTest ? [calcTest] : [])]) add(r.review.record_refs, ref);
      if (item.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(item.card_type)) r.review.calculations = 'passed';
    }
  }
}
for (const oid of touched) {
  const r = byId.get(oid);
  r.teaching_adequate = r.lesson_item_ids.length >= 1;
  r.assessment_adequate = r.assessment_item_ids.length >= 2;
  r.source_caveats ??= []; r.gaps ??= [];
}
ledger.sort((a, b) => a.objective_id.localeCompare(b.objective_id, 'en', { numeric: true }));
writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(`ledger ${spec.paper_id}: ${touched.size} objectives updated, ${ledger.length} records`);
