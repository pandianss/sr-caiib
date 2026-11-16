import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {DraftImportBundle} from '../../src/types/contracts.ts';
const bundle=(n:number):DraftImportBundle=>JSON.parse(readFileSync(new URL(`../../content/batches/BRBL-C-U02-B${String(n).padStart(3,'0')}/draft-bundle.json`,import.meta.url),'utf8'));
// Integer rational compounding, rounding once at the end in paise.
function interest(principal:bigint,monthlyNumerator:bigint,monthlyDenominator:bigint,months:bigint){
 const den=monthlyDenominator**months;
 const numerator=principal*100n*((monthlyDenominator+monthlyNumerator)**months-den);
 const paise=(2n*numerator+den)/(2n*den);
 return `${paise/100n}.${String(paise%100n).padStart(2,'0')}`;
}
test('MSMED full-month exercises compound exactly and grade interest rather than total balance',()=>{
 const b=bundle(7);const qs=b.items.filter(i=>i.item_type==='question'&&i.question_type==='numeric_input');
 const expected=[interest(80000n,15n,1000n,2n),interest(125000n,2n,100n,3n)];
 assert.deepEqual(expected,['2418.00','7651.00']);assert.equal(qs.length,2);
 for(const[index,q]of qs.entries()){assert.ok(q.item_type==='question'&&q.question_type==='numeric_input');assert.equal(q.numeric_rule.expected_answer,expected[index]);assert.equal(q.numeric_rule.precision_decimals,2);assert.equal(q.numeric_rule.unit_label,'INR');assert.match(q.stem_md,/stipulated RBI bank rate/);assert.match(q.stem_md,/interest alone/);}
 const worked=b.items.find(i=>i.item_type==='card'&&i.card_type==='worked_example');assert.ok(worked?.item_type==='card'&&worked.card_type==='worked_example');assert.equal(worked.final_answer_with_unit,`${interest(40000n,15n,1000n,2n)} INR`);
});
test('MSMED challenge deposits are computed as exact percentages, independently of balance forgiveness',()=>{
 const b=bundle(9);const q=b.items.find(i=>i.item_type==='question'&&i.question_type==='numeric_input');assert.ok(q?.item_type==='question'&&q.question_type==='numeric_input');
 const depositPaise=318450n*100n*75n/100n;assert.equal(q.numeric_rule.expected_answer,`${depositPaise/100n}.${String(depositPaise%100n).padStart(2,'0')}`);
 const w=b.items.find(i=>i.item_type==='card'&&i.card_type==='worked_example');assert.ok(w?.item_type==='card'&&w.card_type==='worked_example');assert.equal(w.final_answer_with_unit,`${240000n*75n/100n}.00 INR`);
});
test('MSMED case has reciprocal links; all 35 items remain unreviewed drafts in the exact catalogue unit',()=>{
 const batches=Array.from({length:11},(_,i)=>bundle(i+1));assert.equal(batches.reduce((s,b)=>s+b.items.length,0),35);
 for(const b of batches)for(const item of b.items){assert.equal(item.unit_id,'BRBL::MOD_C::U02');assert.equal(item.publication_state,'draft');assert.equal(item.review,null);}
 const b=bundle(11);const c=b.items.find(i=>i.item_type==='case_study');assert.ok(c?.item_type==='case_study');assert.equal(c.question_ids.length,2);
 for(const id of c.question_ids){const q=b.items.find(i=>i.id===id);assert.ok(q?.item_type==='question');assert.equal(q.case_study_id,c.id);}
 assert.ok(bundle(2).source_batch.facts.some(f=>f.source_id==='MSME_SO_1364E_2025'));
});
