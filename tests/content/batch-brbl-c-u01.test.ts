import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {DraftImportBundle} from '../../src/types/contracts.ts';
const bundle=(n:number):DraftImportBundle=>JSON.parse(readFileSync(new URL(`../../content/batches/BRBL-C-U01-B${String(n).padStart(3,'0')}/draft-bundle.json`,import.meta.url),'utf8'));
const capped=(n:bigint,limit:bigint)=>n<limit?n:limit;

test('BRBL C U01: worked compensation upper amount caps components separately and excludes principal',()=>{
 const worked=bundle(7).items.find(i=>i.item_type==='card'&&i.card_type==='worked_example');
 assert.ok(worked?.item_type==='card'&&worked.card_type==='worked_example');
 assert.match(worked.core_explanation_md,/2,350,000/);assert.match(worked.core_explanation_md,/80,000/);
 const consequential=capped(2350000n,2000000n),additional=capped(80000n,100000n);
 assert.equal(worked.worked_steps.find(s=>s.step_number===1)?.intermediate_result,`${consequential} INR`);
 assert.equal(worked.worked_steps.find(s=>s.step_number===2)?.intermediate_result,`${additional} INR`);
 assert.equal(worked.final_answer_with_unit,`${consequential+additional} INR`);
 assert.match(worked.core_explanation_md,/excluding transaction principal/);assert.match(worked.core_explanation_md,/not an automatic award/);
});

test('BRBL C U01: both numerical ceilings recompute exactly, including below and above each cap',()=>{
 const qs=bundle(7).items.filter(i=>i.item_type==='question'&&i.question_type==='numeric_input');
 assert.equal(qs.length,2);
 const inputs=[[1650000n,45000n],[2680000n,140000n]] as const;
 for(const [index,[loss,extra]]of inputs.entries()){
  const q=qs[index];assert.ok(q?.item_type==='question'&&q.question_type==='numeric_input');
  assert.ok(q.stem_md.includes(loss.toLocaleString('en-US')));assert.ok(q.stem_md.includes(extra.toLocaleString('en-US')));
  assert.equal(q.numeric_rule.expected_answer,String(capped(loss,2000000n)+capped(extra,100000n)));
  assert.equal(q.numeric_rule.unit_label,'INR');assert.equal(q.numeric_rule.precision_decimals,0);
  assert.match(q.stem_md,/2021/);assert.match(q.stem_md,/excluding/);
 }
});

test('BRBL C U01: source versions and independent case questions remain in unreviewed drafts',()=>{
 const bundles=Array.from({length:9},(_,i)=>bundle(i+1));
 assert.equal(bundles.reduce((sum,b)=>sum+b.items.length,0),42);
 for(const b of bundles){
  assert.ok(b.source_batch.facts.every(f=>f.evidence_status==='needs_review'));
  for(const i of b.items){assert.equal(i.publication_state,'draft');assert.equal(i.review,null);assert.equal(i.unit_id,'BRBL::MOD_C::U01');}
 }
 const transition=bundle(1);assert.ok(transition.source_batch.facts.some(f=>f.source_id==='RBI_IOS_2026'));
 assert.ok(transition.source_batch.unresolved.some(x=>/future-effective/.test(x)));
 const c=bundle(6).items.find(i=>i.item_type==='case_study');assert.ok(c?.item_type==='case_study');
 assert.equal(c.question_ids.length,2);
 for(const id of c.question_ids){const q=bundle(6).items.find(i=>i.id===id);assert.ok(q?.item_type==='question');assert.equal(q.case_study_id,c.id);}
});
