import {resolve,join} from 'node:path';

/** Optional explicit catalogue snapshot for authoring alongside other content builds. */
export function parseCatalogueArgs(args,root){
 const paths=[];let cataloguePath=join(root,'public/content/catalogue.json'),specified=false;
 for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==='--catalogue'){
   if(specified)throw new Error('Specify --catalogue only once');
   const value=args[++i];
   if(typeof value!=='string'||!value.trim()||value.startsWith('--'))throw new Error('--catalogue requires a JSON path');
   cataloguePath=resolve(root,value);specified=true;
  }else{
   if(typeof arg!=='string'||!arg.trim()||arg.startsWith('--'))throw new Error(`Unknown authoring argument: ${arg}`);
   paths.push(arg);
  }
 }
 return{paths,cataloguePath};
}
