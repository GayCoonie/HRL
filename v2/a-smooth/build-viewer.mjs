/** Self-contained approved viewer; exact source tables, original formulas. */
import fs from 'node:fs';import {gzipSync} from 'node:zlib';
const root=new URL('./',import.meta.url),v2=new URL('../',root),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const strip=s=>s.replace(/^import .*?;\s*$/gm,'').replace(/export (class|function|const|async function)/g,'$1').replace(/^export \{[^}]*\}(?: from [^;]+)?;\s*$/gm,'');
const mods=[['lib/hue-field.mjs',['HueField','ReleaseRing']],['lib/srgb-triangles.mjs',['SRGBTriangles','SRGB_TO_XYZ','XYZ_TO_SRGB','mul3','decodeSRGB','encodeSRGB']],['lib/basr.mjs',['BASRModel','levelToNonblack','nonblackToLevel']],['lib/index.mjs',['expandReleaseAngles'],'async function v2Read'],['lib/research.mjs',['ResearchSRGBTriangles','SpectralCarrier','EqualSpanFull','AppearanceReadout','MonotoneAtlas','PathModel'],'async function readResearch'],['a-smooth/source-readout.mjs',['SourceAppearanceReadout']],['a-smooth/rl-core.mjs',['freeUnitWarp','FreeHueRing','freeCoordinates','OPALFreeModel']]];
const runtime=mods.map(([file,names,end])=>{let s=fs.readFileSync(new URL(file,v2),'utf8');if(end)s=s.split(end)[0];return `const {${names}}=(()=>{${strip(s)}\nreturn {${names}};})();`;}).join('\n');
const def=read('definitions.json'),scores=read('verification.json').models;
const data={field:read('../data/hue-field-0.6.json'),angles:read('../data/release1-angles.json'),readouts:read('../data/appearance-readouts.json'),brightness:def.brightness,'source-srgb':read('source-srgb.json'),'source-full':read('source-full.json'),models:def.models,scores:Object.fromEntries(Object.entries(scores).map(([k,v])=>[k,{weighted:v.weighted,unweighted:v.unweighted,same_3331:v.same_3331}])),csv:fs.readFileSync(new URL('COMBVD.csv',root),'utf8')};
const packed=gzipSync(Buffer.from(JSON.stringify(data)),{level:9}).toString('base64');
const html=fs.readFileSync(new URL('viewer-template.html',root),'utf8').replace('__RUNTIME__',()=>runtime).replace('__DATA_GZIP__',()=>packed);
if(html.includes('__RUNTIME__')||html.includes('__DATA_GZIP__'))throw Error('Unexpanded template');
fs.writeFileSync(new URL('../a-smooth.html',root),html);console.log('A Smooth viewer built',Buffer.byteLength(html));
