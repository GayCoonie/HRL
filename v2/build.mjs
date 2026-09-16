/** Rebuild the self-contained research pages; optionally add navigation to v1. */
import {readFile,writeFile} from 'node:fs/promises';
import {expandReleaseAngles} from './lib/index.mjs';
const root=new URL('./',import.meta.url), repo=new URL('../',root);
const read=p=>readFile(new URL(p,root),'utf8');
const field=JSON.parse(await read('data/hue-field.json'));
const ring=expandReleaseAngles(JSON.parse(await read('data/release1-angles.json')));
const strip=s=>s.replace(/^import .*?;\s*$/gm,'').replace(/\bexport /g,'');
const fieldJS=await read('lib/hue-field.mjs'),nativeJS=await read('lib/srgb-triangles.mjs'),basrJS=await read('lib/basr.mjs');
for(const [template,output,code] of [
 ['native-template.html','native-0.2.html',fieldJS+'\n'+nativeJS],
 ['basr-template.html','basr.html',fieldJS+'\n'+nativeJS+'\n'+basrJS]
]){
 let html=await read('source/'+template);
 html=html.replace('__RUNTIME__',strip(code)).replace('__FIELD__',JSON.stringify(field)).replace('__RING__',JSON.stringify(ring));
 await writeFile(new URL(output,root),html);
}
let html=await read('source/field-template.html');
html=html.replace('__SOURCE__',strip(fieldJS)).replace('__RECORD__',JSON.stringify(field));
await writeFile(new URL('hue-field-0.1.html',root),html);
if(process.argv.includes('--link-root')){
 const url=new URL('index.html',repo),old=await readFile(url,'utf8');
 if(!old.includes('<!-- HRL V2 RESEARCH LINKS -->')){
  const pattern=/<nav class="nav" aria-label="Project">([\s\S]*?)<\/nav>/;
  if(!pattern.test(old))throw new Error('Unexpected v1 navigation; refusing to rewrite it');
  const updated=old.replace(pattern,(whole,inner)=>'<nav class="nav" aria-label="Project">'+inner+'<!-- HRL V2 RESEARCH LINKS --><a href="v2/basr.html">V2 prototype · BASR</a><a href="v2/index.html">V2 research pages &amp; libraries</a></nav>');
  await writeFile(url,updated);
 }
 const readmeURL=new URL('README.md',repo),text=await readFile(readmeURL,'utf8');
 if(!text.includes('<!-- HRL V2 RESEARCH -->'))await writeFile(readmeURL,text+'\n\n<!-- HRL V2 RESEARCH -->\n## HRL v2 research (separate from Release 1)\n\nThe root picker and `src/` library remain **R15-D Release 1**. New research pages and libraries live under `v2/`; they do not replace v1.\n\n- [BASR 0.4 picker](https://gaycoonie.github.io/HRL/v2/basr.html): Black-Anchored Semantic Remap.\n- [V2 research hub](https://gaycoonie.github.io/HRL/v2/): native 0.2 and observer 0.1 comparisons, version notes, and module links.\n- [V2 library and reproducibility](v2/README.md).\n\nImport `createHRLv2` from `./v2/lib/index.mjs` for the prototype. The default v1 entry point is unchanged.\n');
}
console.log('Built BASR 0.4, native 0.2, and observer 0.1 pages.');
