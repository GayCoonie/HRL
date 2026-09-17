/** Build one offline HTML viewer; only model JSON and our own JS are embedded. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=require(process.env.ESBUILD_MODULE||'esbuild');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..');
const jsonFiles=['v2/a-smooth/definitions.json','v2/data/hue-field-0.6.json','v2/data/release1-angles.json','v2/data/appearance-readouts.json','v2/a-smooth/source-full.json','v2/research/rl-c1/candidate.json','v2/research/relative-domain/results/source-full.json','v2/research/relative-refit/results/balanced.json','v2/research/relative-refit/results/metric.json'];
const assets=Object.fromEntries(jsonFiles.map(p=>['https://hrl.invalid/'+p,fs.readFileSync(path.join(root,p),'utf8')]));
const bundled=await build({entryPoints:[path.join(here,'viewer-worker.mjs')],bundle:true,write:false,format:'iife',platform:'browser',target:['es2022'],external:['node:*'],plugins:[{name:'preserve-source-urls',setup(b){b.onLoad({filter:/\.mjs$/},args=>({contents:fs.readFileSync(args.path,'utf8').replaceAll('import.meta.url',JSON.stringify('https://hrl.invalid/'+path.relative(root,args.path).split(path.sep).join('/'))),loader:'js'}));}}]});
const shim=`const MODEL_ASSETS=${JSON.stringify(assets)};globalThis.fetch=async function(resource){const key=String(resource);if(!(key in MODEL_ASSETS))throw new Error('Unbundled model resource: '+key);return new Response(MODEL_ASSETS[key],{headers:{'Content-Type':'application/json'}});};\n`;
const worker=shim+bundled.outputFiles[0].text;
let html=fs.readFileSync(path.join(here,'viewer.html'),'utf8');
const needle="new Worker(new URL('./viewer-worker.mjs',import.meta.url),{type:'module'})";
if(!html.includes(needle))throw Error('Worker entry not found');
html=html.replace(needle,`new Worker(URL.createObjectURL(new Blob([${JSON.stringify(worker).replaceAll('</','<\\/')}],{type:'text/javascript'})))`);
const evidence=fs.readFileSync(path.join(here,'results/summary.json'),'utf8').replaceAll('</','<\\/');
html=html.replace('<script type="module">',`<script>globalThis.HRL_EVIDENCE=${evidence};</script><script type="module">`);
for(const file of ['README.md','results/REPORT.md','results/verification.json'])html=html.replaceAll(`href="${file}"`,`href="https://github.com/GayCoonie/HRL/blob/main/v2/research/relative-refit/${file}"`);
fs.writeFileSync(path.join(here,'standalone.html'),html);console.log('Standalone bytes',Buffer.byteLength(html));
