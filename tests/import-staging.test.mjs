import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { importStaging, parseJsonDocument } from '../src/import/staging.mjs';
import { validatePack } from '../src/validation/contracts.ts';

const fixture = await Promise.all(['staging-batch.sample.json','catalogue.sample.json','import-config.sample.json'].map(async n => JSON.parse(await readFile(new URL(`../data/${n}`, import.meta.url), 'utf8'))));
const fresh = () => structuredClone(fixture);
const run = () => importStaging(...fresh());
test('maps each draft to the explicitly selected unit and objective, including the second unit', () => {
  const result = run();
  for (const row of result.draft_item_map) {
    const mapping = fixture[2].mappings.find(m => m.draft_id === row.draft_id);
    const item = result.items.find(i => i.id === row.item_id);
    assert.equal(item.unit_id, mapping.unit_id);
    assert.deepEqual(item.objective_ids, mapping.objective_ids);
  }
  assert.equal(result.items[2].unit_id, fixture[1].units[1].id);
});
test('preserves evidence flags, unresolved issues, exact source metadata and supplied context', () => {
  const [batch, catalogue, config] = fresh();
  batch.facts[0].evidence_status = 'needs_review'; batch.unresolved = ['Manual originality and source review pending'];
  config.sources[0].title = 'Exact editor-supplied source title';
  config.context.regulatory_cutoff_date = '2026-03-15';
  const out = importStaging(batch, catalogue, config);
  assert.deepEqual(out.source_batch, batch); assert.deepEqual(out.import_config, config);
  assert.equal(out.items[0].citations[0].title, config.sources[0].title);
  assert.deepEqual(out.items[0].context, config.context);
  assert.ok(out.items.every(i => i.publication_state === 'draft' && i.review === null));
});
test('preserves worked steps and resolves case and self-check references in both directions', () => {
  const out = run(), ids = Object.fromEntries(out.draft_item_map.map(r => [r.draft_id, r.item_id]));
  const byId = Object.fromEntries(out.items.map(i => [i.id, i]));
  assert.deepEqual(byId[ids.D003].worked_solution_steps, fixture[0].drafts[2].payload.worked_solution_steps);
  assert.deepEqual(byId[ids.CS1].question_ids, [ids.D002, ids.D003]);
  assert.equal(byId[ids.D002].case_study_id, ids.CS1); assert.equal(byId[ids.D003].case_study_id, ids.CS1);
  assert.equal(byId[ids.D001].self_check.question_id, ids.D002);
});
test('retries produce stable IDs; different batches and namespaces produce distinct IDs', () => {
  const ids = run().items.map(i => i.id); assert.deepEqual(run().items.map(i => i.id), ids);
  const [b,c,m] = fresh(); b.batch_id += '-next'; m.batch_id = b.batch_id;
  assert.ok(importStaging(b,c,m).items.every(i => !ids.includes(i.id)));
  [b.batch_id,m.batch_id] = [fixture[0].batch_id,fixture[0].batch_id];m.content_namespace += '-other';
  assert.ok(importStaging(b,c,m).items.every(i => !ids.includes(i.id)));
});
test('case and punctuation differences in draft IDs cannot collapse into the same canonical ID', () => {
  const [b,c,m] = fresh(); const other = structuredClone(b.drafts[0]);
  other.draft_id = 'd001'; b.drafts.push(other);m.mappings.push({...m.mappings[0],draft_id:'d001'});
  const out = importStaging(b,c,m); assert.equal(new Set(out.items.map(i=>i.id)).size, out.items.length);
});
const bad = [
  ['missing MCQ key', b => { delete b.drafts[1].payload.correct_option_id; }, /correct_option_id/],
  ['missing numerical answer', b => { delete b.drafts[2].payload.numeric_rule; }, /numeric_rule/],
  ['missing question options', b => { delete b.drafts[1].payload.options; }, /options/],
  ['missing formula fields', b => { b.drafts[0].variant='formula'; }, /formula_spec/],
  ['missing worked-example result', b => { b.drafts[0].variant='worked_example';b.drafts[0].payload.worked_steps=b.drafts[2].payload.worked_solution_steps; }, /final_answer_with_unit/],
  ['unknown variant', b => { b.drafts[0].variant='made_up'; }, /Unknown card variant/],
  ['missing case backlink', b => { delete b.drafts[1].payload.case_study_id; }, /backlink/],
  ['parent case missing membership', b => { b.drafts[3].payload.question_ids=['D003']; }, /Parent case/],
  ['dangling case ID', b => { b.drafts[1].payload.case_study_id='missing'; }, /same batch/],
  ['question ID targeting a card', b => { b.drafts[3].payload.question_ids=['D001']; }, /Expected a question/],
  ['payload metadata injection', b => { b.drafts[0].payload.publication_state='published'; }, /Unsupported field/],
  ['unknown payload field is not silently discarded', b => { b.drafts[0].payload.extra_evidence='preserve me'; }, /Unsupported field/],
  ['missing card prerequisites', b => { delete b.drafts[0].payload.prerequisite_objective_ids; }, /prerequisite_objective_ids/],
];
for (const [name, mutate, error] of bad) test(`rejects ${name} without inventing a replacement`, () => {
  const [b,c,m]=fresh();mutate(b);assert.throws(()=>importStaging(b,c,m),error);
});
const badMappings = [
  ['missing explicit mapping', m=>m.mappings.pop(), /Explicit mapping missing/],
  ['duplicate draft mapping', m=>m.mappings.push(m.mappings[0]), /Duplicate draft mapping/],
  ['unknown unit', m=>m.mappings[0].unit_id='BFM::MOD_TEST::U99', /Exact catalogue unit/],
  ['objective from another unit', m=>m.mappings[0].objective_ids=m.mappings[2].objective_ids, /wrong unit/],
  ['missing exam cutoff', m=>delete m.context.regulatory_cutoff_date, /cutoff_date/],
  ['missing source title', m=>delete m.sources[0].title, /title/],
  ['missing context evidence', m=>delete m.context_source, /context_source/],
  ['missing syllabus evidence', m=>delete m.syllabus_source, /syllabus_source/],
  ['missing source registry entry', m=>m.sources.shift(), /Missing exact source metadata/],
  ['wrong batch ID', m=>m.batch_id='wrong', /Must match this staging batch/],
];
for (const [name,mutate,error] of badMappings) test(`rejects ${name}`,()=>{
  const [b,c,m]=fresh();mutate(m);assert.throws(()=>importStaging(b,c,m),error);
});
test('synthetic fixtures cannot become published delivery content by changing publication flags',()=>{
  const out=run();const items=out.items.map(i=>({...i,publication_state:'published',review:{verified_at:'2026-11-09T00:00:00Z',reviewer_id:'SYNTHETIC_TEST',method:'automated',source_verified:true,answer_checked:true,calculations:'verified'}}));
  const result=validatePack({schema_version:'2.0.0',pack_id:'TEST',pack_version:'1',syllabus_version:fixture[1].syllabus_version,exam_context_id:fixture[2].context.exam_context_id,paper_id:'BFM',items},fixture[1]);
  assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.message.includes('Synthetic fixtures')));
});
test('accepts a single Markdown JSON fence and rejects surrounding prose or partial fences',()=>{
  assert.deepEqual(parseJsonDocument('```json\n{"a":1}\n```'),{a:1});
  assert.deepEqual(parseJsonDocument('\ufeff {"a":1}'),{a:1});
  assert.throws(()=>parseJsonDocument('Here is JSON:\n```json\n{"a":1}\n```'));
  assert.throws(()=>parseJsonDocument('```json\n{"a":1}'));
});
test('CLI rejects invalid input before writing and preserves an existing output',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'caiib-import-test-'));
  try {
    const names=['batch.json','catalogue.json','config.json'].map(n=>join(dir,n));
    for(let i=0;i<3;i++)await writeFile(names[i],JSON.stringify(fixture[i]));
    const output=join(dir,'output.json');const cli=fileURLToPath(new URL('../scripts/import-staging.mjs',import.meta.url));
    const invoke=(args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
    const good=invoke([...names,output]);assert.equal(good.status,0,good.stderr);
    assert.equal(JSON.parse(await readFile(output,'utf8')).items.length,4);
    const before=await readFile(output,'utf8');const repeated=invoke([...names,output]);
    assert.equal(repeated.status,1);assert.equal(await readFile(output,'utf8'),before);
    const invalid=structuredClone(fixture[0]);delete invalid.drafts[1].payload.correct_option_id;
    await writeFile(names[0],JSON.stringify(invalid));
    const missing=join(dir,'not-written.json');const bad=invoke([...names,missing]);
    assert.equal(bad.status,1);await assert.rejects(access(missing));
    assert.equal(invoke(names.slice(0,2)).status,2);
  } finally {await rm(dir,{recursive:true,force:true});}
});
