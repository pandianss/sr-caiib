// Usage: node apply.mjs <patches.jsonl> [--dry]
// Patch lines: {"sid":N,"new":"..."}  (span replacement)  or  {"id":"item_..","path":"stem_md","new":"..."} (whole field)
import { readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const retry = fn => { for (let i = 0; ; i++) { try { return fn(); } catch (e) { if (i >= 8) throw e; sleep(400); } } };
import { fileURLToPath } from 'node:url';
const W = dirname(fileURLToPath(import.meta.url)), root = join(W, '..', '..');
const dry = process.argv.includes('--dry');
const work = new Map(JSON.parse(readFileSync(join(W, process.env.WORK || 'work.json'), 'utf8')).map(s => [s.sid, s]));
const patches = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(l => l.trim()).map((l, n) => { try { return JSON.parse(l); } catch (e) { throw new Error(`line ${n + 1}: ${e.message}`); } });
// item -> batch index
const idxPath = join(W, 'item-batch.json');
let idx;
if (existsSync(idxPath)) idx = JSON.parse(readFileSync(idxPath, 'utf8'));
else { idx = {}; for (const b of readdirSync(join(root, 'content/batches'))) { const p = join(root, 'content/batches', b, 'draft-bundle.json'); if (!existsSync(p)) continue; for (const m of JSON.parse(readFileSync(p, 'utf8')).draft_item_map) idx[m.item_id] = b; } writeFileSync(idxPath, JSON.stringify(idx)); }
const get = (o, path) => path.match(/[^.[\]]+/g).reduce((a, k) => a[k], o);
// current values come from the draft bundles (source of truth), keyed by item
const bundles = new Map();
const bundle = b => { if (!bundles.has(b)) { const dir = join(root, 'content/batches', b); bundles.set(b, { dir, bundleText: retry(() => readFileSync(join(dir, 'draft-bundle.json'), 'utf8')), stagingText: retry(() => readFileSync(join(dir, 'staging.json'), 'utf8')) }); const x = bundles.get(b); x.bundle = JSON.parse(x.bundleText); x.staging = JSON.parse(x.stagingText); } return bundles.get(b); };
const edits = new Map(); // id|path -> {b, orig, cur}
let errors = 0;
for (const p of patches) {
  const sp = p.sid != null ? work.get(p.sid) : null;
  if (p.sid != null && !sp) { console.error(`unknown sid ${p.sid}`); errors++; continue; }
  if (p.q) { const c = Object.keys(idx).filter(k => k.startsWith('item_' + p.q)); if (c.length !== 1) { console.error(`prefix ${p.q}: ${c.length} matches`); errors++; continue; } p.id = c[0]; }
  const id = sp ? sp.id : p.id, path = sp ? sp.path : p.path, b = idx[id];
  if (!b) { console.error(`no batch for ${id}`); errors++; continue; }
  const B = bundle(b), item = B.bundle.items.find(i => i.id === id);
  const key = id + '|' + path;
  if (!edits.has(key)) { const orig = get(item, path); if (typeof orig !== 'string') { console.error(`not a string: ${key}`); errors++; continue; } edits.set(key, { b, id, path, orig, cur: orig }); }
  const e = edits.get(key);
  if (sp) { if (!e.cur.includes(sp.span)) { console.error(`skip sid ${p.sid}: span no longer present`); continue; } e.cur = e.cur.replace(sp.span, () => p.new); }
  else e.cur = p.new;
}
if (errors) { console.error(`${errors} errors; nothing written`); process.exit(1); }
const touched = new Map();
for (const e of edits.values()) { if (e.cur === e.orig) continue; if (!touched.has(e.b)) touched.set(e.b, []); touched.get(e.b).push(e); }
let n = 0;
for (const [b, list] of touched) {
  const B = bundle(b);
  let st = B.stagingText, bt = B.bundleText;
  const rep = (text, e) => { const needle = JSON.stringify(e.orig), val = JSON.stringify(e.cur); let c = 0, out = '', pos = 0, i; while ((i = text.indexOf(needle, pos)) !== -1) { if (text[i - 1] === String.fromCharCode(92)) { out += text.slice(pos, i + 1); pos = i + 1; continue; } out += text.slice(pos, i) + val; pos = i + needle.length; c++; } return [out + text.slice(pos), c]; };
  for (const e of list) { let s, d; [st, s] = rep(st, e); [bt, d] = rep(bt, e); if (s < 1 || d < 2) console.error(`WARN ${b} ${e.id.slice(5, 13)} ${e.path}: staging ${s}, bundle ${d} replacements`); n++; }
  JSON.parse(st); JSON.parse(bt);
  if (!dry) { retry(() => writeFileSync(join(B.dir, 'staging.json'), st)); retry(() => writeFileSync(join(B.dir, 'draft-bundle.json'), bt));
    for (const e of list) appendFileSync(join(W, 'applied.jsonl'), JSON.stringify({ batch: b, id: e.id, path: e.path, old: e.orig, new: e.cur }) + String.fromCharCode(10)); }
}
console.log(`${dry ? 'DRY: ' : ''}${n} fields changed in ${touched.size} batches`);
