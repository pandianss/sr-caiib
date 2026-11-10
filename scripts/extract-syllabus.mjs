// Extracts the paper → module → section structure from the official IIBF "CAIIB Rules & Syllabus" PDF.
//
// How headings are recognised:
// - Bold headings are set in a larger font (height >= 7.6pt); scope text is smaller.
// - A wrapped line continues its paragraph unless the next line's first word would have fitted on it
//   (a deliberate break), which marks a paragraph end.
// - A few headings in the source are set in plain type. They are recognised when two plain paragraphs follow
//   each other where one scope paragraph was expected: the first is taken as a heading. Each such inference is
//   recorded in `extraction.notes` and on the section as `baseline_issue`, so it can be checked by eye.
//
// The output is an internal curriculum mapping that keeps the official wording and PDF page locators. It is not
// learner-facing content. Review the printed report before relying on it.
// Usage: node scripts/extract-syllabus.mjs <pdf> <out.json> [--dump]
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [pdfPath, outPath] = process.argv.slice(2);
const dump = process.argv.includes('--dump');
if (!pdfPath || !outPath) { console.error('Usage: node scripts/extract-syllabus.mjs <pdf> <out.json> [--dump]'); process.exit(2); }
const bytes = readFileSync(pdfPath);
const doc = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, verbosity: 0 }).promise;
const info = (await doc.getMetadata()).info;

// ---- lines with font height and horizontal extent ---------------------------------------------------------------
const lines = [];
for (let pn = 1; pn <= doc.numPages; pn++) {
  const page = await doc.getPage(pn);
  const tc = await page.getTextContent();
  const rows = new Map();
  for (const it of tc.items) {
    if (!it.str.trim()) continue;
    const y = Math.round(it.transform[5] * 2) / 2;
    const key = [...rows.keys()].find(k => Math.abs(k - y) <= 1.5) ?? y;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(it);
  }
  const pageLines = [];
  for (const [y, items] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
    items.sort((a, b) => a.transform[4] - b.transform[4]);
    let text = '';
    let prevEnd = null;
    for (const it of items) { // rebuild spacing from x positions (the PDF drops some spaces between runs)
      const x = it.transform[4];
      if (prevEnd !== null && x - prevEnd > it.height * 0.18 && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' ';
      text += it.str; prevEnd = x + it.width;
    }
    text = text.replace(/\s+/g, ' ').trim();
    const chars = items.reduce((n, it) => n + it.str.trim().length, 0);
    const big = items.reduce((n, it) => n + (it.height >= 7.6 ? it.str.trim().length : 0), 0);
    const start = items[0].transform[4], end = Math.max(...items.map(it => it.transform[4] + it.width));
    pageLines.push({ page: pn, y, text, heading: big / Math.max(1, chars) > 0.6, start, end, charW: (end - start) / Math.max(1, text.length) });
  }
  const right = Math.max(...pageLines.map(l => l.end), 0);
  for (const l of pageLines) { l.right = right; lines.push(l); }
}

// Headings that are set in plain type AND cannot be separated by geometry (the heading fills its line, or the
// preceding scope line is full). They were identified by reading the page and apply only to this exact file.
const OVERRIDES = {
  '038c859f2f9161bd8875fd47cafb6421728d78a3a01fbda54a531f3942d499c9': [
    { page: 5, text: 'Definition of Statistics, Importance & Limitations & Data Collection, Classification & Tabulation' },
    { page: 12, text: 'Public Sector Banks, Private Sector Banks, Regional Rural Banks, Differentiated Banks and Co-operative' },
    { page: 12, text: 'Banks, Local Area Banks' },
  ],
};
const sha256 = createHash('sha256').update(bytes).digest('hex');
for (const o of OVERRIDES[sha256] ?? []) {
  const hit = lines.filter(l => l.page === o.page && l.text === o.text && !l.heading);
  if (hit.length !== 1) { console.error(`override did not match exactly one line: p${o.page} "${o.text}"`); process.exit(1); }
  hit[0].forcedHeading = true;
}
// A module title that wraps can share its second printed line with the first section heading
// ("…AND GOVT." / "INITIATIVES Priority Sector Lending"). Split such a line where upper case ends.
for (let i = 1; i < lines.length; i++) {
  const prev = lines[i - 1], l = lines[i];
  const split = /^((?:[A-Z][A-Z&.,/-]*\s+)+)([A-Z][a-z].*)$/.exec(l.text);
  if (prev.heading && l.heading && prev.page === l.page && /^module\s*[-–]?\s*[A-Z]\s*[:\-–]/i.test(prev.text) && split) {
    const cut = l.start + (l.end - l.start) * (split[1].length / l.text.length);
    lines.splice(i, 1, { ...l, text: split[1].trim(), end: cut, sharedLine: true }, { ...l, text: split[2].trim(), start: cut, sharedLine: true });
    i += 1;
  }
}
// A bare "APPENDIX" line starts an appendix even where the source sets it in plain type.
for (const l of lines) if (/^APPENDIX$/.test(l.text)) l.heading = true;
if (dump) for (const l of lines) console.log(`${String(l.page).padStart(2)} ${l.heading ? 'H' : ' '} ${l.text}`);

/** True when the first word of `next` would have fitted after `line`: the break was deliberate (paragraph end). */
function deliberateBreak(line, next) {
  if (line.page !== next.page) return false; // unknown across a page break; treated as a continuation
  const firstWord = next.text.split(' ')[0] ?? '';
  return line.end + line.charW * (firstWord.length + 1.5) < line.right;
}

// ---- blocks: scope paragraphs and (possibly wrapped) headings ----------------------------------------------------
const PAPER_BY_NAME = [
  [/advanced?\s+bank\s+management/i, 'ABM'], [/bank\s+financial\s+management/i, 'BFM'], [/advanced\s+business\s*(&|and)\s*financial\s+management/i, 'ABFM'],
  [/banking\s+regulations?\s+and\s+business\s+laws/i, 'BRBL'], [/rural\s+banking/i, 'RB'], [/human\s+resources?\s+management/i, 'HRM'],
  [/information\s+technology\s*(&|and)\s*digital\s+banking/i, 'ITDB'], [/risk\s+management/i, 'RM'], [/central\s+banking/i, 'CB'],
];
const PAPER_LINE = /^(compulsory|elective)\s+(paper|subject)\b/i;
const MODULE_LINE = /^module\s*[-–]?\s*([A-Z])\s*[:\-–]\s*(.*)$/i;
const APPENDIX_LINE = /^appendi(x|ces)\b/i;
const STOP_LINE = /^important\s+rules/i;
const startsStructure = t => PAPER_LINE.test(t) || MODULE_LINE.test(t) || APPENDIX_LINE.test(t) || STOP_LINE.test(t);

const blocks = []; let started = false;
for (const l of lines) {
  if (!started) { if (!(l.heading && PAPER_LINE.test(l.text))) continue; started = true; }
  if (l.heading && STOP_LINE.test(l.text)) break;
  const prev = blocks[blocks.length - 1]; const prevLine = prev?.lines[prev.lines.length - 1];
  const kind = l.heading ? 'H' : l.forcedHeading ? 'P' : 'b';
  let join = false;
  if (prev && prev.kind === 'H' && kind === 'H' && prevLine.page === l.page && !startsStructure(l.text) && !PAPER_LINE.test(prev.lines[0].text)) {
    const prevIsModule = MODULE_LINE.test(prev.lines[0].text) || APPENDIX_LINE.test(prev.lines[0].text);
    // Module titles are upper case, so only an upper-case line can continue one. A section heading continues when
    // the previous line was full, or visibly unfinished (ends with a comma, colon, dash or connecting word).
    join = prevIsModule ? (!/[a-z]/.test(l.text) && prev.lines.length === 1) : (!deliberateBreak(prevLine, l) || /([,:&–-]|\b(and|of|the|for|in|to|with|by))$/i.test(prevLine.text));
  } else if (prev && prev.kind === 'P' && kind === 'P') {
    join = true;
  } else if (prev && prev.kind === 'b' && kind === 'b') {
    join = !deliberateBreak(prevLine, l); // same scope paragraph (also across a page break)
  }
  if (join) prev.lines.push(l); else blocks.push({ kind, heading: kind === 'H', lines: [l] });
}
for (const b of blocks) { b.text = b.lines.map(x => x.text).join(' ').replace(/\s+/g, ' ').trim(); b.pages = [...new Set(b.lines.map(x => x.page))]; }

// ---- structure ---------------------------------------------------------------------------------------------------
const papers = []; const issues = []; const notes = [];
let paper = null, module = null, unit = null;
const pad = n => String(n).padStart(2, '0');
const addUnit = (title, kind, pages, baselineIssue) => {
  unit = { id: `${module.id}::U${pad(module.units.length + 1)}`, title, kind, pages: [...pages], scope_text: '', body_fragments: [], baseline_issue: baselineIssue };
  module.units.push(unit);
  for (const p of pages) if (!module.pages.includes(p)) module.pages.push(p);
};
const addScope = b => {
  unit.scope_text = `${unit.scope_text} ${b.text}`.trim();
  unit.body_fragments.push(...b.lines.map(x => ({ page: x.page, text: x.text })));
  for (const p of b.pages) { if (!unit.pages.includes(p)) unit.pages.push(p); if (!module.pages.includes(p)) module.pages.push(p); }
};
for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i]; const next = blocks[i + 1];
  if (b.heading && PAPER_LINE.test(b.text)) {
    const id = PAPER_BY_NAME.find(([re]) => re.test(b.text))?.[1]; unit = null; module = null;
    if (!id) { issues.push(`p${b.pages[0]}: unrecognised paper heading "${b.text}"`); paper = null; continue; }
    if (papers.some(p => p.id === id)) issues.push(`p${b.pages[0]}: paper ${id} appears twice`);
    paper = { id, source_title: b.text, kind: /^compulsory/i.test(b.text) ? 'compulsory' : 'elective', page: b.pages[0], modules: [] };
    papers.push(paper); continue;
  }
  if (!paper) continue;
  const m = b.heading ? MODULE_LINE.exec(b.text) : null;
  if (m || (b.heading && APPENDIX_LINE.test(b.text))) {
    unit = null;
    const id = m ? `${paper.id}::MOD_${m[1].toUpperCase()}` : `${paper.id}::MOD_APPENDIX`;
    if (paper.modules.some(x => x.id === id)) issues.push(`p${b.pages[0]}: ${id} appears twice`);
    module = { id, label: m ? `Module ${m[1].toUpperCase()}` : 'Appendix', title: m ? m[2].trim() : (b.text.replace(/^appendi(x|ces)\s*[:\-–]?\s*/i, '').trim() || 'Appendix'), kind: m ? 'module' : 'appendix', pages: [...b.pages], units: [] };
    paper.modules.push(module); continue;
  }
  if (!module) { issues.push(`p${b.pages[0]}: text before any module in ${paper.id}: "${b.text.slice(0, 60)}"`); continue; }
  if (b.heading) { addUnit(b.text, 'named_section', b.pages, null); continue; }
  if (b.kind === 'P') {
    addUnit(b.text, 'named_section', b.pages, 'Printed in plain rather than bold type in the official syllabus; treated as a section heading.');
    notes.push(`${unit.id}: plain-type heading by override "${b.text.slice(0, 70)}" (p${b.pages[0]})`); continue;
  }
  // A plain (scope-type) paragraph.
  if (unit && !unit.scope_text) { addScope(b); continue; }
  if (next && next.kind === 'b') {
    addUnit(b.text, 'named_section', b.pages, 'Printed in plain rather than bold type in the official syllabus; treated as a section heading.');
    notes.push(`${unit.id}: plain-type heading "${b.text.slice(0, 70)}" (p${b.pages[0]})`); continue;
  }
  if (unit) { addScope(b); notes.push(`${unit.id}: second scope paragraph appended (p${b.pages[0]})`); continue; }
  addUnit(`${module.title} (topics listed without a section heading)`, 'editorial_container', b.pages, 'The official syllabus lists these topics directly under the heading above, without a section heading of their own.');
  addScope(b); notes.push(`${unit.id}: unheaded topic list kept in an editorial container (p${b.pages[0]})`);
}
for (const p of papers) for (const mod of p.modules) {
  if (!mod.units.length) issues.push(`${mod.id}: module has no sections`);
  for (const u of mod.units) if (!u.scope_text) notes.push(`${u.id}: "${u.title.slice(0, 60)}" has no scope text in the source (heading-only topic)`);
}
for (const id of ['ABM', 'BFM', 'ABFM', 'BRBL', 'RB', 'HRM', 'ITDB', 'RM', 'CB']) if (!papers.some(p => p.id === id)) issues.push(`paper ${id} not found in the document`);

const title = lines.slice(0, 8).map(l => l.text).filter(t => /^caiib$|rules\s*&\s*syllabus/i.test(t)).join(' — ');
const count = fn => papers.reduce((n, p) => n + p.modules.reduce((k, mod) => k + fn(mod), 0), 0);
const out = {
  source: { filename: pdfPath.split(/[\\/]/).pop(), title, pdf_pages: doc.numPages, sha256, creation_date: info.CreationDate ?? null, producer: info.Producer ?? null },
  extraction: { method: 'scripts/extract-syllabus.mjs: pdfjs text items; headings by font height >= 7.6pt; paragraphs by a line-fit test; plain-type headings by paragraph pairing', issues, notes },
  papers,
  counts: { papers: papers.length, modules: count(mod => (mod.kind === 'module' ? 1 : 0)), appendices: count(mod => (mod.kind === 'appendix' ? 1 : 0)), sections: count(mod => mod.units.length), named_sections: count(mod => mod.units.filter(u => u.kind === 'named_section').length) },
};
writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.log(`title: ${title}`);
for (const p of papers) console.log(`${p.id.padEnd(5)} p${String(p.page).padEnd(3)} ${p.modules.map(mod => `${mod.id.split('MOD_')[1]}:${mod.units.length}`).join(' ')}  = ${p.modules.reduce((k, mod) => k + mod.units.length, 0)}`);
console.log(`total: ${out.counts.papers} papers, ${out.counts.modules} modules, ${out.counts.appendices} appendices, ${out.counts.sections} sections; ${issues.length} issue(s), ${notes.length} note(s)`);
for (const i of issues) console.log(`  ! ${i}`);
for (const n of notes) console.log(`  - ${n}`);
