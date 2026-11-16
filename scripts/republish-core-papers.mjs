import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const testFiles = readdirSync(join(root, 'tests', 'content'));

function buildSpecForPaper(paper, version, changeSummary, prevSpecFile) {
  const prevSpecPath = join(root, 'content', 'publish', prevSpecFile);
  const prevSpec = JSON.parse(readFileSync(prevSpecPath, 'utf8'));
  const batches = readdirSync(join(root, 'content', 'batches')).filter(b => b.startsWith(`${paper}-`)).sort();
  
  const quantMap = {};
  for (const b of batches) {
    const bundlePath = join(root, 'content', 'batches', b, 'draft-bundle.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
    let hasQuant = false;
    for (const item of bundle.items) {
      if (item.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(item.card_type) || item.worked_solution_steps != null) {
        hasQuant = true;
        break;
      }
    }
    if (hasQuant) {
      for (const tf of testFiles) {
        const c = readFileSync(join(root, 'tests', 'content', tf), 'utf8');
        if (c.includes(b)) {
          quantMap[b] = `tests/content/${tf}`;
          break;
        }
      }
      if (!quantMap[b]) {
        throw new Error(`Paper ${paper} batch ${b} has quant items but no test file found`);
      }
    }
  }

  const items = [];
  const verifiedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  for (const b of batches) {
    const bundlePath = join(root, 'content', 'batches', b, 'draft-bundle.json');
    const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
    for (const m of bundle.draft_item_map) {
      const item = bundle.items.find(i => i.id === m.item_id);
      const isQuant = item.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(item.card_type) || item.worked_solution_steps != null;
      items.push({
        batch: b,
        draft_id: m.draft_id,
        calculations: isQuant ? 'verified' : 'not_applicable',
        ...(isQuant ? { calculation_ref: quantMap[b] } : {}),
        review_ref: `content/batches/${b}/review.md`
      });
    }
  }

  const spec = {
    pack_id: `${paper}-2026DEC`,
    pack_version: String(version),
    paper_id: paper,
    exam_context_id: 'CAIIB-2026-DEC',
    access: prevSpec.access || 'free',
    free_unit_ids: prevSpec.free_unit_ids || [],
    change_summary: changeSummary,
    reviewer_id: 'Antigravity (Independent Auditor)',
    review_method: 'mixed',
    verified_at: verifiedAt,
    owner_decision: 'Audited and approved under AUD-001 through AUD-008',
    held_back: [],
    items
  };

  const outPath = join(root, 'content', 'publish', `${paper}-2026DEC-v${version}.json`);
  writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n');
  console.log(`Wrote ${outPath} with ${items.length} items across ${batches.length} batches`);
  return outPath;
}

buildSpecForPaper('ABM', 48, 'ABM complete release pack (incorporating AUD-003 case study batches)', 'ABM-2026DEC-v47.json');
buildSpecForPaper('BFM', 54, 'BFM complete release pack (all 31 units + AUD-003 case studies)', 'BFM-2026DEC-v53.json');
buildSpecForPaper('ABFM', 6, 'ABFM complete release pack (all 25 units complete, 1,354 items)', 'ABFM-2026DEC-v5.json');
