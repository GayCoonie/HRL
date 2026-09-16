import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=n=>JSON.parse(fs.readFileSync(root+'/data/'+n));
const strip=s=>s.replace(/^import .*?;\s*$/gm,'').replace(/export (class|function|const|async function)/g,'$1').replace(/^export \{[^}]*\}(?: from [^;]+)?;\s*$/gm,'');
// index factory omitted because import.meta is not valid in the classic standalone bundle.
let index=fs.readFileSync(root+'/lib/index.mjs','utf8').split('async function v2Read')[0];
let research=fs.readFileSync(root+'/lib/research.mjs','utf8').split('async function readResearch')[0];
const runtime=[fs.readFileSync(root+'/lib/hue-field.mjs','utf8'),fs.readFileSync(root+'/lib/srgb-triangles.mjs','utf8'),fs.readFileSync(root+'/lib/basr.mjs','utf8'),index,research].map(strip).join('\n');
// Isolate module scopes and expose their named public symbols, avoiding helper-name collisions.
const mods=[['hue-field.mjs',['HueField','ReleaseRing']],['srgb-triangles.mjs',['SRGBTriangles','SRGB_TO_XYZ','XYZ_TO_SRGB','mul3','decodeSRGB','encodeSRGB']],['basr.mjs',['BASRModel','levelToNonblack','nonblackToLevel']],['index.mjs',['expandReleaseAngles']],['research.mjs',['ResearchSRGBTriangles','SpectralCarrier','EqualSpanFull','AppearanceReadout','MonotoneAtlas','PathModel']]];
const packed=mods.map(([file,names])=>{let s=fs.readFileSync(root+'/lib/'+file,'utf8');if(file==='index.mjs')s=s.split('async function v2Read')[0];if(file==='research.mjs')s=s.split('async function readResearch')[0];return `const {${names}}=(()=>{${strip(s)}\nreturn {${names}};})();`;}).join('\n');
const data={fieldOld:read('hue-field.json'),fieldNew:read('hue-field-0.6.json'),angles:read('release1-angles.json'),readouts:read('appearance-readouts.json'),scores:JSON.parse(fs.readFileSync(root+'/research/equal-span/results/combvd-baseline.json'))};
for(const v of ['equal-span','opal'])for(const g of ['srgb','full'])data[v+'-'+g]=read(v+'-'+g+'.json');
const template=fs.readFileSync(root+'/source/opal-template.html','utf8');
const result=template.replace('__RUNTIME__',packed).replace('__DATA__',JSON.stringify(data).replaceAll('</','<\\/'));
for(const n of ['opal','equal-span'])fs.writeFileSync(root+'/'+n+'.html',result);
console.log('Standalone page bytes',result.length);
