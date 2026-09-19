import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {pathToFileURL,fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
const {canonicalScale}=await import(pathToFileURL(root+'/v2/codes.mjs'));
function environment(beta1=false){
 const nodes=new Map(),messages=[];
 function node(id=''){
  if(nodes.has(id))return nodes.get(id);
  const classes=new Set(),attrs=new Map();
  const n={id,value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},style:{},children:[],
   classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){if(on??!classes.has(x))classes.add(x);else classes.delete(x)}},
   setAttribute(k,v){attrs.set(k,String(v))},getAttribute:k=>attrs.get(k),
   addEventListener(){},appendChild(c){this.children.push(c)},replaceChildren(...cs){this.children=cs},
   getContext(){return{putImageData(){}}}};
  nodes.set(id,n);return n;
 }
 const c={console,canonicalScale,URL,URLSearchParams,Number,Math,Blob,
  document:{getElementById:node,querySelector:()=>node('sheets'),querySelectorAll:()=>[],createElement:()=>node(Symbol()),documentElement:{dataset:{hrlRelease:beta1?'beta1':''}},body:node('body')},
  window:{addEventListener(){}},location:{hash:''},navigator:{},
  Worker:class{constructor(){c.worker=this}postMessage(m){messages.push(structuredClone(m))}terminate(){}},
  fetch:()=>new Promise(()=>{}),setTimeout:()=>1,clearTimeout(){}};
 return {context:c,node,messages};
}
async function loadApp(path,beta1=false){
 const env=environment(beta1);
 const source=(await readFile(root+'/'+path,'utf8')).replace(/^import .*;\n/gm,'').replace(/^export /gm,'').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(root+'/'+path).href));
 vm.createContext(env.context);
 vm.runInContext(source+(beta1?'\nglobalThis.review={state,ids,tables};':''),env.context);
 return env;
}
const failures=[];
async function test(name,run){try{await run();console.log('PASS',name)}catch(e){failures.push(name);console.error('FAIL',name+'\n'+e.message)}}
await test('Beta1 accepts code reply after previous render completion',async()=>{
 const {context:c,node,messages}=await loadApp('v2/boundary-tonal-ui/app.mjs',true);
 const oldRender=messages.find(m=>m.type==='render');
 node('shortCode').value='Y00AAAZZZ';node('importCode').onclick();const code=messages.at(-1);
 assert.equal(code.type,'code');
 c.worker.onmessage({data:{type:'rendered',request:oldRender.request,gamut:'srgb',H:275}});
 c.worker.onmessage({data:{type:'imported',request:code.request,gamut:'srgb',id:'metric',q:{H:0,R:0,L:1}}});
 assert.deepEqual(JSON.parse(JSON.stringify(c.review.state.q)),{H:0,R:0,L:1},'An older render must not cancel the latest requested code import');
});
await test('Beta1 refreshes evidence for successful cross-gamut code import',async()=>{
 const {context:c,node,messages}=await loadApp('v2/boundary-tonal-ui/app.mjs',true);
 const data=JSON.parse(await readFile(root+'/v2/research/boundary-tonal/results/colorbench.json','utf8'));
 node('board').value=Object.keys(data.models['parent-srgb']).find(k=>data.models['parent-srgb'][k]&&typeof data.models['parent-srgb'][k]==='object'&&Object.values(data.models['parent-srgb'][k]).some(v=>v&&typeof v==='object'&&'audit'in v));
 c.reviewEvidence=data;vm.runInContext('evidence=reviewEvidence;tables();',c);
 const before=node('score-metric').textContent;
 node('shortCode').value='AAAAAAAAZZZZ';node('importCode').onclick();const code=messages.at(-1);
 c.worker.onmessage({data:{type:'imported',request:code.request,gamut:'full',id:'metric',q:{H:20.9,R:0,L:1}}});
 assert.equal(c.review.state.gamut,'full');
 assert.equal(Number(node('reach').max),4569.75);
 assert.notEqual(node('score-metric').textContent,before,'Full-mode import retained the native sRGB evidence table');
 assert.ok(node('score-metric').textContent.includes(data.models['metric-full'].retained_combvd.weighted.toFixed(4)));
});
await test('Global failed code import does not strand a pending render',async()=>{
 const {context:c,node,messages}=await loadApp('v2/global.mjs');
 const oldRender=messages.find(m=>m.type==='render');
 node('short-code').value='ZZZZZZZZZZZZ';node('import-code').onclick();const decode=messages.at(-1);
 assert.equal(decode.type,'decode');
 c.worker.onmessage({data:{type:'error',operation:'decode',request:decode.request,message:'Unassigned full hue slot'}});
 c.worker.onmessage({data:{type:'rendered',request:oldRender.request}});
 // Recovery may accept the still-valid old render or replace it with a new one.
 const latestRender=messages.filter(m=>m.type==='render').at(-1);
 c.worker.onmessage({data:{type:'rendered',request:latestRender.request}});
 assert.equal(node('sheets').dataset.ready,'true','No current render can complete after failed decode');
});
console.log(JSON.stringify({checks:3,failures}));
if(failures.length)process.exitCode=1;
