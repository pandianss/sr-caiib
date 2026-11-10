// Builds the content the app ships with: catalogue, coverage ledger, exam contexts, pack manifest and packs.
// Release content comes only from content/packs (published, validated). Synthetic fixtures are included ONLY
// with --fixtures, for engineering and UI inspection; a release build never contains them.
// Usage: node scripts/build-content.mjs [--fixtures] [--out <dir>]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalogue, validateExamConfig, validatePack } from '../src/validation/contracts.ts';
import { reconcileLedger, summariseOverall } from '../src/core/coverage.ts';
import { PAPER_NAMES, COMPULSORY_PAPERS } from '../src/core/catalogue.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fixtures = args.includes('--fixtures');
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(root, 'public', 'content');
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const fail = msg => { console.error(`build-content: ${msg}`); process.exit(1); };
const SOURCE_ID = 'IIBF_ELECTIVES_2025_BOOKLET';
const SYLLABUS_VERSION = 'IIBF-ELECTIVES-2025-BOOKLET-PROVISIONAL';

// ---- baseline catalogue from the syllabus transcription -------------------------------------------------------
const src = readJson(join(root, 'visual-map', 'source-data.json'));
const objectivesDir = join(root, 'content', 'objectives');
const ledgerDir = join(root, 'content', 'ledger');
/** Editorially derived objectives, one file per paper: [{ id, unit_id, title, description? }] */
const derivedObjectives = existsSync(objectivesDir) ? readdirSync(objectivesDir).filter(f => f.endsWith('.json')).flatMap(f => readJson(join(objectivesDir, f))) : [];
/** Ledger objective records keyed by objective ID (teaching, assessment and review evidence). */
const ledgerRecords = new Map((existsSync(ledgerDir) ? readdirSync(ledgerDir).filter(f => f.endsWith('.json')).flatMap(f => readJson(join(ledgerDir, f))) : []).map(r => [r.objective_id, r]));

const catalogue = { syllabus_version: SYLLABUS_VERSION, modules: [], units: [], objectives: derivedObjectives.map(({ id, unit_id, title, description }) => ({ id, unit_id, title, ...(description ? { description } : {}) })) };
const papers = [];
for (const p of src.papers) {
  const topics = [];
  for (const m of p.modules) {
    const moduleTitle = m.kind === 'appendix' ? `Appendix: ${m.title}` : `${m.label}: ${m.title}`;
    catalogue.modules.push({ id: m.id, paper_id: p.id, title: moduleTitle });
    for (const u of m.units) {
      catalogue.units.push({ id: u.id, module_id: m.id, title: u.title });
      const objectives = derivedObjectives.filter(o => o.unit_id === u.id).map(o => ledgerRecords.get(o.id) ?? {
        objective_id: o.id, statement: o.title, origin: 'editorial', source_support: 'missing', lesson_item_ids: [], worked_example_item_ids: [], assessment_item_ids: [],
        teaching_adequate: false, assessment_adequate: false, review: { source: 'not_started', originality: 'not_started', calculations: 'not_started', record_refs: [] }, published_item_ids: [], gaps: ['No content authored yet.'],
      });
      topics.push({
        topic_id: u.id, paper_id: p.id, module_id: m.id, module_title: moduleTitle, module_kind: m.kind === 'appendix' ? 'appendix' : 'module', title: u.title,
        official_scope_text: u.scope_text ?? '', syllabus_source_id: SOURCE_ID, locator: `PDF page${u.pages.length > 1 ? 's' : ''} ${u.pages.join(', ')}`,
        baseline_issue: u.kind === 'named_section' ? null : 'Editorial container for an unheaded list in the source; not an official unit heading.',
        kind: u.kind === 'named_section' ? 'named_section' : 'editorial_container', objectives,
        blocked_reason: objectives.length ? null : 'Teaching sources (the textbooks or primary references) are not yet accessible, so objectives, lessons and assessments have not been produced.',
      });
    }
  }
  papers.push({ paper_id: p.id, title: PAPER_NAMES[p.id], kind: 'elective', baseline: { status: 'provisional', note: `Topics transcribed from "${src.source.title}". Applicability to the target session is unconfirmed, so this is not yet a verified denominator.`, syllabus_source_id: SOURCE_ID }, topics });
}
for (const id of COMPULSORY_PAPERS) papers.unshift({ paper_id: id, title: PAPER_NAMES[id], kind: 'compulsory', baseline: { status: 'missing', note: 'No official syllabus document for this paper has been obtained yet. Its modules and topics are unknown.', syllabus_source_id: null }, topics: [] });
papers.sort((a, b) => ['ABM', 'BFM', 'ABFM', 'BRBL', 'CB', 'RM', 'ITDB', 'HRM', 'RB'].indexOf(a.paper_id) - ['ABM', 'BFM', 'ABFM', 'BRBL', 'CB', 'RM', 'ITDB', 'HRM', 'RB'].indexOf(b.paper_id));
const cat = validateCatalogue(catalogue);
if (!cat.ok) fail(`catalogue invalid: ${JSON.stringify(cat.issues.slice(0, 5))}`);

// ---- exam contexts ---------------------------------------------------------------------------------------------
const contexts = readJson(join(root, 'content', 'exam-contexts.json'));
for (const c of contexts) {
  if (c.status === 'verified') { const r = validateExamConfig(c.config); if (!r.ok) fail(`exam context ${c.exam_context_id}: ${JSON.stringify(r.issues)}`); }
  else if (c.config !== null || c.pass_marks !== null) fail(`unverified exam context ${c.exam_context_id} must not carry a configuration`);
}

// ---- packs -----------------------------------------------------------------------------------------------------
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'packs'), { recursive: true });
mkdirSync(join(out, 'catalogues'), { recursive: true });
const manifest = { generated_at: new Date().toISOString(), packs: [] };
const publishedItemIds = new Set();
function addPack(pack, catalogueForPack, meta, kind) {
  const bytes = Buffer.from(JSON.stringify(pack));
  const file = `packs/${pack.pack_id}@${pack.pack_version}.json`;
  writeFileSync(join(out, file), bytes);
  const count = t => pack.items.filter(i => i.item_type === t).length;
  manifest.packs.push({
    pack_id: pack.pack_id, pack_version: pack.pack_version, paper_id: pack.paper_id, exam_context_id: pack.exam_context_id, syllabus_version: pack.syllabus_version,
    schema_version: '2.0.0', file_size_bytes: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex'), path: file,
    minimum_client_version: meta.minimum_client_version ?? '0.1.0', change_summary: meta.change_summary, kind, access: meta.access, free_unit_ids: meta.free_unit_ids ?? [],
    unit_ids: [...new Set(pack.items.map(i => i.unit_id))], item_counts: { cards: count('card'), questions: count('question'), case_studies: count('case_study'), references: count('reference'), calculators: count('calculator') },
  });
  writeFileSync(join(out, 'catalogues', `${catalogueForPack.syllabus_version}.json`), JSON.stringify(catalogueForPack));
}
const packsDir = join(root, 'content', 'packs');
if (existsSync(packsDir)) for (const f of readdirSync(packsDir).filter(f => f.endsWith('.json'))) {
  const wrapper = readJson(join(packsDir, f));
  const r = validatePack(wrapper.pack, catalogue);
  if (!r.ok) fail(`published pack ${f} failed validation: ${JSON.stringify(r.issues.slice(0, 5))}`);
  if (!['free', 'full'].includes(wrapper.access) || !wrapper.change_summary) fail(`published pack ${f} needs access and change_summary`);
  if (!contexts.some(c => c.exam_context_id === wrapper.pack.exam_context_id)) fail(`published pack ${f} refers to an unknown exam context`);
  wrapper.pack.items.forEach(i => publishedItemIds.add(i.id));
  addPack(wrapper.pack, catalogue, wrapper, 'published');
}
if (fixtures) {
  const fx = join(root, 'content', 'fixtures');
  const fxCatalogue = readJson(join(fx, 'catalogue.json'));
  contexts.push(readJson(join(fx, 'exam-context.json')));
  for (const f of readdirSync(join(fx, 'packs')).filter(f => f.endsWith('.json'))) {
    const pack = readJson(join(fx, 'packs', f));
    // One fixture paper is marked as pass-only beyond its first unit so lock, purchase and restore screens can be exercised.
    const gated = pack.paper_id === 'CB';
    addPack(pack, fxCatalogue, { access: gated ? 'full' : 'free', free_unit_ids: gated ? ['CB::MOD_FIX::U01'] : [], change_summary: 'Synthetic engineering fixture. Not exam content.' }, 'fixture');
  }
}

// ---- coverage ledger -------------------------------------------------------------------------------------------
const ledger = {
  ledger_version: '1', generated_at: manifest.generated_at, baseline_version: SYLLABUS_VERSION, exam_session: 'CAIIB 2026 (unverified)',
  verdict: 'Baseline unconfirmed: compulsory papers missing, elective baseline provisional, no content authored.',
  sources: [{ source_id: SOURCE_ID, title: src.source.title, authority: 'IIBF', fingerprint_sha256: src.source.sha256, session_applicability: src.source.session_applicability, note: `${src.source.document_kind}; ${src.source.pdf_pages} PDF pages. ${src.notes.join(' ')}` }],
  papers,
};
const problems = reconcileLedger(ledger, catalogue.units.map(u => u.id), catalogue.objectives.map(o => o.id), publishedItemIds);
if (problems.length) fail(`ledger does not reconcile with the catalogue:\n  ${problems.slice(0, 10).join('\n  ')}`);

writeFileSync(join(out, 'catalogue.json'), JSON.stringify(catalogue));
writeFileSync(join(out, 'catalogues', `${catalogue.syllabus_version}.json`), JSON.stringify(catalogue));
writeFileSync(join(out, 'coverage.json'), JSON.stringify(ledger));
writeFileSync(join(out, 'exam-contexts.json'), JSON.stringify(contexts));
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest));
const s = summariseOverall(ledger);
console.log(`content built â†’ ${out}`);
console.log(`  catalogue ${catalogue.syllabus_version}: ${catalogue.modules.length} modules, ${catalogue.units.length} units, ${catalogue.objectives.length} objectives`);
console.log(`  ledger: ${s.overall.topics_listed} topics listed; overall denominator ${s.overall.denominator ?? 'unknown'}; missing baseline: ${s.overall.papers_missing_baseline.join(', ') || 'none'}`);
console.log(`  packs: ${manifest.packs.filter(p => p.kind === 'published').length} published, ${manifest.packs.filter(p => p.kind === 'fixture').length} fixture${fixtures ? ' (FIXTURES INCLUDED â€” not a release build)' : ''}`);
