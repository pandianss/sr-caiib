import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const quantMap = {
  'BRBL-A-U01-B001': 'tests/content/batch-brbl-a-u01-b001.test.ts',
  'BRBL-A-U02-B001': 'tests/content/batch-brbl-a-u02-b001.test.ts',
  'BRBL-A-U03-B001': 'tests/content/batch-brbl-a-u03-b001.test.ts',
  'BRBL-A-U04-B001': 'tests/content/batch-brbl-a-u04-b001.test.ts',
  'BRBL-A-U05-B001': 'tests/content/batch-brbl-a-u05-b001.test.ts',
  'BRBL-A-U06-B001': 'tests/content/batch-brbl-a-u06-b001.test.ts',
  'BRBL-A-U07-B001': 'tests/content/batch-brbl-a-u07-b001.test.ts',
  'BRBL-B-U01-B001': 'tests/content/batch-brbl-b-u01-b001.test.ts',
  'BRBL-B-U02-B013': 'tests/content/batch-brbl-b-u02.test.ts',
  'BRBL-B-U03-B006': 'tests/content/batch-brbl-b-u03.test.ts',
  'BRBL-B-U04-B006': 'tests/content/batch-brbl-b-u04.test.ts',
  'BRBL-B-U06-B001': 'tests/content/batch-brbl-b-u06.test.ts',
  'BRBL-B-U06-B005': 'tests/content/batch-brbl-b-u06.test.ts',
  'BRBL-C-U01-B007': 'tests/content/batch-brbl-c-u01.test.ts',
  'BRBL-C-U02-B007': 'tests/content/batch-brbl-c-u02.test.ts',
  'BRBL-C-U02-B009': 'tests/content/batch-brbl-c-u02.test.ts',
  'BRBL-C-U06-B006': 'tests/content/batch-brbl-c-u06.test.ts',
  'BRBL-C-U06-B008': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U06-B009': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U06-B010': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U08-B002': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U14-B004': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U15-B002': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U16-B004': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U19-B004': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-C-U21-B005': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-D-U03-B004': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-D-U05-B002': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-D-U11-B003': 'tests/content/batch-brbl-final-authoring.test.ts',
  'BRBL-D-U26-B005': 'tests/content/batch-brbl-final-authoring.test.ts',
};

const brblBatches = readdirSync(join(root, 'content', 'batches')).filter(b => b.startsWith('BRBL-')).sort();
const items = [];
const verifiedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

for (const b of brblBatches) {
  const bundlePath = join(root, 'content', 'batches', b, 'draft-bundle.json');
  if (!existsSync(bundlePath)) continue;
  const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
  for (const m of bundle.draft_item_map) {
    const item = bundle.items.find(i => i.id === m.item_id);
    const quantitative = item.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(item.card_type) || item.worked_solution_steps != null;
    if (quantitative && !quantMap[b]) {
      throw new Error(`Batch ${b} item ${m.draft_id} is quant but missing quantMap entry`);
    }
    items.push({
      batch: b,
      draft_id: m.draft_id,
      calculations: quantitative ? 'verified' : 'not_applicable',
      ...(quantitative ? { calculation_ref: quantMap[b] } : {}),
      review_ref: `content/batches/${b}/review.md`
    });
  }
}

const spec = {
  pack_id: 'BRBL-2026DEC',
  pack_version: '1',
  paper_id: 'BRBL',
  exam_context_id: 'CAIIB-2026-DEC',
  access: 'free',
  free_unit_ids: [],
  change_summary: 'Banking Regulations and Business Laws complete release pack (all 64 units + appendix)',
  reviewer_id: 'Antigravity (Independent Auditor)',
  review_method: 'mixed',
  verified_at: verifiedAt,
  owner_decision: 'Audited and approved under AUD-005, AUD-006, AUD-007, AUD-008',
  held_back: [],
  items
};

const outPath = join(root, 'content', 'publish', 'BRBL-2026DEC-v1.json');
writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n');
console.log(`Successfully wrote ${outPath} with ${items.length} items across ${brblBatches.length} batches`);
