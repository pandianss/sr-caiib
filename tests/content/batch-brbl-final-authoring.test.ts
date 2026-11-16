import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {DraftImportBundle} from '../../src/types/contracts.ts';

const bundle=(batch:string):DraftImportBundle=>JSON.parse(readFileSync(new URL(`../../content/batches/${batch}/draft-bundle.json`,import.meta.url),'utf8'));
const minimum=(a:bigint,b:bigint)=>a<b?a:b;
const maximum=(a:bigint,b:bigint)=>a>b?a:b;
// Positive rational HALF_UP, returning the exact number of display minor units.
const rounded=(numerator:bigint,denominator:bigint,scale:bigint)=>
 (2n*numerator*scale+denominator)/(2n*denominator);
const decimal=(minor:bigint,places:number)=>{
 const digits=minor.toString().padStart(places+1,'0');
 return places?`${digits.slice(0,-places)}.${digits.slice(-places)}`:digits;
};
function checkNumeric(batch:string,expected:bigint,places=0,unit='INR'){
 const qs=bundle(batch).items.filter(i=>i.item_type==='question'&&i.question_type==='numeric_input');
 assert.equal(qs.length,1,`${batch}: account for every newly authored numeric key`);
 const item=qs[0];assert.ok(item?.item_type==='question'&&item.question_type==='numeric_input');
 assert.equal(item.numeric_rule.expected_answer,decimal(expected,places),batch);
 assert.equal(item.numeric_rule.precision_decimals,places);assert.equal(item.numeric_rule.unit_label,unit);
 assert.equal(item.numeric_rule.rounding_mode,'HALF_UP');assert.equal(item.review,null);assert.equal(item.publication_state,'draft');
}
function checkWorked(batch:string,expected:bigint,places=0){
 const cards=bundle(batch).items.filter(i=>i.item_type==='card'&&i.card_type==='worked_example');
 assert.equal(cards.length,1);const item=cards[0];assert.ok(item?.item_type==='card'&&item.card_type==='worked_example');
 const answer=decimal(expected,places);
 assert.ok(item.final_answer_with_unit.replaceAll(',','').includes(answer),`${batch}: worked answer ${answer}`);
 assert.equal(item.review,null);assert.equal(item.publication_state,'draft');
}

test('BRBL recovery and purchase examples credit costs and earnest money exactly once',()=>{
 checkNumeric('BRBL-C-U06-B008',5600000n*25n/100n-420000n);
 checkWorked('BRBL-C-U06-B008',4800000n*25n/100n-480000n);
 checkNumeric('BRBL-C-U06-B009',4120000n-145000n-3640000n);
 checkWorked('BRBL-C-U06-B009',3260000n-110000n-2870000n);
 checkNumeric('BRBL-D-U05-B002',224000n-179000n-11000n);
 checkWorked('BRBL-D-U05-B002',186000n-148000n-8000n);
 checkNumeric('BRBL-D-U03-B004',(252000n-44000n)/4n);
 checkWorked('BRBL-D-U03-B004',(180000n-42000n)/3n);
});

test('BRBL stipulated deposit,penalty and tax examples recompute with bounded integer arithmetic',()=>{
 checkNumeric('BRBL-C-U08-B002',maximum(10000000n,2n*4000000n)+(3n-1n)*100000n);
 checkWorked('BRBL-C-U08-B002',maximum(10000000n,2n*6500000n)+(4n-1n)*100000n);
 checkNumeric('BRBL-C-U14-B004',1180000n*50n/100n);checkWorked('BRBL-C-U14-B004',840000n*50n/100n);
 checkNumeric('BRBL-C-U15-B002',1360000n*25n/100n);checkWorked('BRBL-C-U15-B002',920000n*25n/100n);
 checkNumeric('BRBL-C-U19-B004',394000n*50n/100n);checkWorked('BRBL-C-U19-B004',286000n*50n/100n);
 checkNumeric('BRBL-C-U21-B005',36000n*18n/100n-1800n);checkWorked('BRBL-C-U21-B005',24000n*18n/100n-1200n);
 checkNumeric('BRBL-D-U26-B005',minimum(124n*250n,25000n));
});

test('BRBL voting displays use exact ratios and HALF_UP without rounding a threshold into compliance',()=>{
 checkNumeric('BRBL-C-U06-B010',rounded(6900000n*100n,12000000n,100n),2,'%');
 checkWorked('BRBL-C-U06-B010',rounded((2400000n+3600000n)*100n,10000000n,100n),2);
 checkNumeric('BRBL-C-U16-B004',rounded(6800000n*100n,10000000n,100n),2,'%');
 checkWorked('BRBL-C-U16-B004',rounded(8000000n*100n,12000000n,100n),2);
 // A display can round to 60.00 while the exact value remains below 60%; compare cross products.
 const approving=599999n,total=1000000n;
 assert.equal(decimal(rounded(approving*100n,total,100n),2),'60.00');
 assert.ok(approving*100n<total*60n);
});

test('BRBL partner-advance examples apply the stipulated simple month fraction',()=>{
 checkNumeric('BRBL-D-U11-B003',480000n*6n*7n/(100n*12n));
 checkWorked('BRBL-D-U11-B003',360000n*6n*9n/(100n*12n));
});
