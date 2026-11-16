import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {parseCatalogueArgs} from '../src/import/catalogue-cli.mjs';

test('authoring defaults preserve batch arguments and use the generated public catalogue',()=>{
 const root=resolve('SYNTHETIC_ROOT');
 assert.deepEqual(parseCatalogueArgs(['one','two'],root),{paths:['one','two'],cataloguePath:join(root,'public/content/catalogue.json')});
});
test('an explicit snapshot resolves independently of option position without consuming batch paths',()=>{
 const root=resolve('SYNTHETIC_ROOT'),snapshot=resolve(root,'tmp/snapshot/catalogue.json');
 assert.deepEqual(parseCatalogueArgs(['one','--catalogue','tmp/snapshot/catalogue.json','two'],root),{paths:['one','two'],cataloguePath:snapshot});
 assert.deepEqual(parseCatalogueArgs(['--catalogue',snapshot,'one'],root),{paths:['one'],cataloguePath:snapshot});
});
test('unknown, duplicate or incomplete authoring options fail before input/output access',()=>{
 const root=resolve('SYNTHETIC_ROOT');
 for(const args of [['--catalogue'],['--catalogue',''],['--catalogue','--unknown'],['--unknown','file'],['--catalogue','a','--catalogue','b']])assert.throws(()=>parseCatalogueArgs(args,root));
});
