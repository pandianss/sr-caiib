import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {DraftImportBundle} from '../../src/types/contracts.ts';
const bundle:DraftImportBundle=JSON.parse(readFileSync(new URL('../../content/batches/BRBL-C-U06-B006/draft-bundle.json',import.meta.url),'utf8'));
test('SARFAESI borrower appeal calculations use lower debt base and distinguish granted reduction',()=>{
 const qs=bundle.items.filter(i=>i.item_type==='question'&&i.question_type==='numeric_input');assert.equal(qs.length,2);
 const inputs=[[1260000n,980000n,50n],[1540000n,1200000n,25n]] as const;
 for(const[index,[claim,determined,percent]]of inputs.entries()){const q=qs[index];assert.ok(q?.item_type==='question'&&q.question_type==='numeric_input');const base=claim<determined?claim:determined;assert.equal(q.numeric_rule.expected_answer,String(base*percent/100n));assert.equal(q.numeric_rule.unit_label,'INR');assert.equal(q.numeric_rule.precision_decimals,0);assert.equal(q.publication_state,'draft');assert.equal(q.review,null);}
 assert.match(qs[0]!.stem_md,/No reduction order/);assert.match(qs[1]!.stem_md,/Tribunal grants/);
 const worked=bundle.items.find(i=>i.item_type==='card'&&i.card_type==='worked_example');assert.ok(worked?.item_type==='card'&&worked.card_type==='worked_example');assert.equal(worked.final_answer_with_unit,`${760000n*50n/100n} INR`);
});
