const $=id=>document.getElementById(id),ids=['parent','balanced','gentle'],names=['0.11 Gen tonal balanced','0.12 refined balanced','0.12 lighter refinement'];
const images=new Map();let evidenceData=null,renderId=0,sampleId=0,renderTimer,toastTimer,lastSample=null,lastRequestType='sample';
const hash=new URLSearchParams(location.hash.slice(1)),unit=(v,f)=>Number.isFinite(Number(v))&&v!==null?Math.min(1,Math.max(0,Number(v))):f;
const initialHue=hash.get('h')!==null&&Number.isFinite(Number(hash.get('h')))?((Number(hash.get('h'))%360)+360)%360:270;
const state={gamut:hash.get('gamut')==='full'?'full':'srgb',checkpoint:ids.includes(hash.get('checkpoint'))?hash.get('checkpoint'):'balanced',q:{H:initialHue,R:unit(hash.get('r'),.4),L:unit(hash.get('l'),.7)}};state.q.R=Math.min(state.q.R,state.q.L);
for(let i=0;i<3;i++)$('panels').insertAdjacentHTML('beforeend',`<section class="panel" id="panel${i}"><header><h2 id="title${i}">${names[i]}</h2><button class="select-panel" data-select="${i}">Pick here</button></header><div class="score" id="score${i}"></div><div class="vertex"><span>White</span><span>Vivid →</span></div><div class="canvas-wrap"><canvas class="triangle" id="tri${i}" tabindex="0" aria-label="${names[i]} color triangle"></canvas><span class="cursor" id="cursor${i}" hidden></span></div><div class="vertex"><span>Black</span></div><p class="gamut" id="gamut${i}"></p><div class="reading" id="read${i}">Move over the triangle to inspect a color; click to select it.</div><div class="barlabel" id="rlabel${i}"></div><canvas class="bar" id="reach${i}"></canvas><div class="barlabel" id="llabel${i}"></div><canvas class="bar" id="level${i}"></canvas><div class="barlabel">Black → vivid: R = L</div><canvas class="bar edge" id="edge${i}"></canvas><div class="barlabel">Near edge: R = 0.9 L</div><canvas class="bar edge" id="near${i}"></canvas><div class="barlabel">Add white: shade (R=L=.65) → white</div><canvas class="bar white" id="white${i}"></canvas><div class="panel-actions"><button data-save="${i}">Save triangle PNG</button><span class="hint" id="modelTag${i}"></span></div></section>`);
const worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function updateControls(){
 $('gamut').value=state.gamut;$('active').value=state.checkpoint;$('hue').value=state.q.H;$('number').value=Number(state.q.H.toFixed(4));
 for(const [a,n]of [['R','reach'],['L','level']]){$(n+'Value').value=state.q[a];$(n+'Number').value=Number(state.q[a].toFixed(6));}
 for(let i=0;i<3;i++){$('panel'+i).classList.toggle('selected',ids[i]===state.checkpoint);$('title'+i).textContent=i===0?(state.gamut==='srgb'?'0.11 Gen tonal balanced':'0.11 Gen tonal balanced'):names[i];$('modelTag'+i).textContent=state.gamut==='srgb'?'native sRGB':'full gamut';}
 $('displayNotice').innerHTML=state.gamut==='srgb'?'<strong>Native sRGB, not a clipped full triangle.</strong> Every valid address is generated inside sRGB using its own vivid boundary and the same learned R/L math as the full realization. The first panel is the unchanged Gen tonal balanced parent.':'<strong>Your display cannot show the whole full gamut.</strong> Actual full-domain XYZ is explicitly clipped to sRGB for preview only. The mask exposes those pixels. The underlying coordinates and benchmark distances do not use that clipped preview.';
 moveCursors();
}
function moveCursors(){for(let i=0;i<3;i++){const c=$('cursor'+i),d=images.get(i);c.hidden=!d||d.gamut!==state.gamut||Math.abs(d.H-state.q.H)>1e-8;if(!c.hidden){c.style.left=(100*state.q.R)+'%';c.style.top=(100*(1-state.q.L+state.q.R/2))+'%';}}}
function requestRender(){for(let i=0;i<3;i++)$('read'+i).textContent='Updating hue sheet…';
 clearTimeout(renderTimer);const id=++renderId;$('status').classList.remove('error');$('status').textContent=`Rendering ${state.gamut==='srgb'?'native sRGB':'full gamut'} at ${state.q.H.toFixed(1)}°…`;
 renderTimer=setTimeout(()=>worker.postMessage({type:'render',id,gamut:state.gamut,H:state.q.H,height:Number($('resolution').value),fixedL:Number($('fixedL').value),fixedR:Number($('fixedR').value)}),90);
}
function requestSample(type='sample'){
 lastRequestType=type;sampleId++;worker.postMessage({type,sampleId,gamut:state.gamut,checkpoint:state.checkpoint,q:state.q,hex:$('hexInput').value.trim(),neutralHue:state.q.H});
}
function setHue(value){if(!Number.isFinite(value))return;state.q.H=((value%360)+360)%360;updateControls();updateEvidence();requestSample();requestRender();}
$('hue').oninput=e=>setHue(Number(e.target.value));$('number').onchange=e=>setHue(Number(e.target.value));$('minus').onclick=()=>setHue(state.q.H-1);$('plus').onclick=()=>setHue(state.q.H+1);
$('gamut').onchange=()=>{state.gamut=$('gamut').value;images.clear();lastSample=null;updateControls();updateEvidence();requestSample();requestRender();};
$('active').onchange=()=>{state.checkpoint=$('active').value;updateControls();requestSample();};
for(const key of ['fixedL','fixedR','resolution'])$(key).oninput=requestRender;
for(const [base,axis]of [['reach','R'],['level','L']])for(const suffix of ['Value','Number'])$(base+suffix).oninput=e=>{
 const v=Number(e.target.value);if(!Number.isFinite(v))return;state.q[axis]=Math.min(1,Math.max(0,v));
 if(axis==='R')state.q.R=Math.min(state.q.R,state.q.L);else state.q.R=Math.min(state.q.R,state.q.L);
 updateControls();requestSample();
};
for(const H of [0,30,60,90,150,210,240,255,263,269,270,273,275,277,281,285,293,300,330]){const b=document.createElement('button');b.textContent=H+'°';b.onclick=()=>setHue(H);$('quick').appendChild(b);}
function paint(c,image){c.width=image.width;c.height=image.height;c.getContext('2d').putImageData(new ImageData(image.pixels,image.width,image.height),0,0);}
function drawTriangle(i){const d=images.get(i);if(!d)return;const pixels=new Uint8ClampedArray(d.tri.pixels);if($('mask').checked)for(let y=0;y<d.tri.height;y++)for(let x=0;x<d.tri.width;x++){const k=y*d.tri.width+x;if(d.tri.mask[k]&&(x+y)%9<3){pixels[4*k]=72;pixels[4*k+1]=43;pixels[4*k+2]=87;}}paint($('tri'+i),{...d.tri,pixels});moveCursors();}
$('mask').onchange=()=>{for(let i=0;i<3;i++)drawTriangle(i);};
worker.onmessage=({data:d})=>{
 if(d.type==='sample'){
  if(d.sampleId!==sampleId)return;if(d.error){toast(d.error);return;}if(d.gamut!==state.gamut)return;
  lastSample=d;
  if(lastRequestType==='import'){state.q={H:d.q.H,R:d.q.R,L:d.q.L};updateControls();updateEvidence();requestRender();}
  const item=d.readings[ids.indexOf(state.checkpoint)],hex='#'+item.rgb.map(x=>x.toString(16).padStart(2,'0')).join('');
  $('swatch').style.backgroundColor=hex;const light=item.rgb.reduce((a,v,i)=>a+[.2126,.7152,.0722][i]*(v/255),0)>.59;
  $('swatch').style.color=light?'#120f1a':'#fff';$('hexValue').textContent=hex.toUpperCase();$('swatchLabel').textContent=`${state.gamut==='srgb'?'NATIVE sRGB':'FULL GAMUT'} · ${state.checkpoint.toUpperCase()}`;
  $('swatchNote').textContent=item.outside?'Clipped sRGB display preview':'sRGB display output';
  $('selectedReadout').textContent=`${state.gamut} / ${state.checkpoint}\nH ${d.q.H.toFixed(6)}°   R ${d.q.R.toFixed(8)}   L ${d.q.L.toFixed(8)}\nRelative XYZ: ${item.xyz.map(v=>v.toPrecision(9)).join(', ')}${item.outside?'\nOutside sRGB: the hex value is only a display approximation.':''}`;
  moveCursors();return;
 }
 if(d.error){$('status').classList.add('error');$('status').textContent=d.error;return;}if(d.id!==renderId||d.gamut!==state.gamut)return;
 if(d.done){$('status').textContent=`Ready · ${state.gamut==='srgb'?'native sRGB':'full gamut'} · one shared R/L bank per candidate loaded.`;return;}
 images.set(d.index,d);drawTriangle(d.index);paint($('reach'+d.index),d.reach);paint($('level'+d.index),d.level);paint($('edge'+d.index),d.edge);paint($('near'+d.index),d.near);paint($('white'+d.index),d.white);$('read'+d.index).textContent=`H ${d.H.toFixed(2)}° · move over this rendered triangle for current XYZ.`;
 $('gamut'+d.index).textContent=state.gamut==='srgb'&&d.tri.clipped===0?'100% of this triangle is inside sRGB.':`${(100*d.tri.clipped/d.tri.inside).toFixed(1)}% outside display sRGB.`;
 $('rlabel'+d.index).textContent='Reach at L = '+$('fixedL').value;$('llabel'+d.index).textContent='Level at R = '+$('fixedR').value;
};
worker.onerror=e=>{$('status').classList.add('error');$('status').textContent='Worker failed: '+e.message;};
function pointer(e,i){
 const d=images.get(i);if(!d||d.gamut!==state.gamut||Math.abs(d.H-state.q.H)>1e-8)return null;
 const c=$('tri'+i),b=c.getBoundingClientRect(),x=Math.max(0,Math.min(c.width-1,Math.floor((e.clientX-b.left)/b.width*c.width))),y=Math.max(0,Math.min(c.height-1,Math.floor((e.clientY-b.top)/b.height*c.height))),k=y*c.width+x;
 if(!d.tri.pixels[4*k+3])return null;
 const q={H:d.H,R:x/(c.width-1),L:1-y/(c.height-1)+x/(c.width-1)/2},xyz=Array.from(d.tri.xyzs.slice(3*k,3*k+3));
 $('read'+i).textContent=`H ${q.H.toFixed(2)}° · R ${q.R.toFixed(4)} · L ${q.L.toFixed(4)}\nXYZ ${xyz.map(v=>v.toPrecision(5)).join(', ')}${d.tri.mask[k]?' · display clipped':''}`;return q;
}
for(let i=0;i<3;i++){
 const c=$('tri'+i);c.onpointermove=e=>{const q=pointer(e,i);if(q&&e.buttons===1){state.q=q;state.checkpoint=ids[i];updateControls();requestSample();}};
 c.onpointerdown=e=>{const q=pointer(e,i);if(!q)return;c.setPointerCapture(e.pointerId);state.q=q;state.checkpoint=ids[i];updateControls();requestSample();};
 c.onkeydown=e=>{const step=e.shiftKey ? .02 : .002;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();state.checkpoint=ids[i];if(e.key==='ArrowLeft')state.q.R=Math.max(0,state.q.R-step);if(e.key==='ArrowRight')state.q.R=Math.min(state.q.L,state.q.R+step);if(e.key==='ArrowUp')state.q.L=Math.min(1,state.q.L+step);if(e.key==='ArrowDown'){state.q.L=Math.max(0,state.q.L-step);state.q.R=Math.min(state.q.R,state.q.L);}updateControls();requestSample();};
}
for(const b of document.querySelectorAll('[data-select]'))b.onclick=()=>{state.checkpoint=ids[Number(b.dataset.select)];updateControls();requestSample();};
function save(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
for(const b of document.querySelectorAll('[data-save]'))b.onclick=()=>{const i=Number(b.dataset.save),d=images.get(i);if(!d||d.gamut!==state.gamut)return;$('tri'+i).toBlob(blob=>save(blob,`HRL-${d.gamut}-${ids[i]}-${d.H.toFixed(1)}.png`));};
$('importHex').onclick=()=>requestSample('import');$('hexInput').onkeydown=e=>{if(e.key==='Enter')requestSample('import');};
function colorRecord(){if(!lastSample||lastSample.gamut!==state.gamut||lastSample.sampleId!==sampleId)return null;const item=lastSample.readings[ids.indexOf(state.checkpoint)];return{profile:state.checkpoint==='parent'?'HRL-0.11-gen-tonal':'HRL-0.12-hue-fair',gamut:state.gamut,checkpoint:state.checkpoint==='parent'?'balanced':state.checkpoint,viewCheckpoint:state.checkpoint,sharedCalibration:true,referenceWhite:'D65',referenceWhiteNits:300,coordinates:lastSample.q,relativeXYZ:item.xyz,displaySRGB8:item.rgb,displayClipped:item.outside};}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copied.');}catch{const box=document.createElement('textarea');box.value=text;box.className='readout';$('selectedReadout').after(box);box.focus();box.select();const ok=document.execCommand('copy');if(ok){box.remove();toast('Copied.');}else toast('Copy the selected text below the readout.');}}
$('copyTuple').onclick=()=>{const r=colorRecord();if(!r)return toast('Wait for the selected color to finish updating.');copy(JSON.stringify({profile:r.profile,gamut:r.gamut,checkpoint:r.checkpoint,coordinates:r.coordinates}));};
$('exportColor').onclick=()=>{const r=colorRecord();if(!r)return toast('Wait for the selected color to finish updating.');save(new Blob([JSON.stringify(r,null,2)+'\n'],{type:'application/json'}),`HRL-${r.gamut}-${r.checkpoint}.json`);};
$('copyURL').onclick=()=>{const p=new URLSearchParams({gamut:state.gamut,checkpoint:state.checkpoint,h:state.q.H.toFixed(6),r:state.q.R.toFixed(8),l:state.q.L.toFixed(8)});history.replaceState(null,'','#'+p.toString());copy(location.href);};
const labels={hung_berns:'Hung–Berns hue',ebner_fairchild:'Ebner–Fairchild hue',munsell:'Munsell hue',xiao_unique_hues:'Xiao unique hues',osa_ucs_1974:'OSA-UCS spacing',bfd:'BFD-P STRESS',leeds:'Leeds STRESS',witt:'Witt STRESS',rit:'RIT-DuPont STRESS',macadam:'MacAdam 1974 STRESS',macadam1942:'MacAdam 1942',luo_rigg_ellipses:'Luo–Rigg',alder1982:'Alder',regan_1994_cvd_ellipses:'Regan',koenderink_2026_3d_metric_field:'Koenderink',brown_1957_12obs_ellipsoids:'Brown 1957',wyszecki_fielder_1971_ellipsoids:'Wyszecki–Fielder',brown_macadam_1949_ellipsoids:'Brown–MacAdam',huang_2012_cielab_ellipses:'Huang',berns_1991_rit_dupont_tolerance_vectors:'Berns tolerance',hong_2025_ellipsoids:'Hong'};
function updateEvidence(){
 if(!evidenceData)return;policyNotice();const p=evidenceData.profiles[state.gamut];
 for(let i=0;i<ids.length;i++){const m=p.models[ids[i]];$('score'+i).textContent=`COMBVD ${m.weighted.toFixed(4)} weighted / ${m.unweighted.toFixed(4)} unweighted · ${m.pairs} pairs · ${evidenceData.input_policy?"mapped":"historical strict"}`;}
 const a=p.models.parent,b=p.models.balanced;let rows='';
 for(const f of ['black','white','exchange','reach']){const v=a.visual[f],w=b.visual[f];rows+=`<tr><td>${f}</td><td>${(100*(w.meanCV/v.meanCV-1)).toFixed(1)}%</td><td>${(100*(w.meanStepJump/v.meanStepJump-1)).toFixed(1)}%</td></tr>`;}
 $('progress').innerHTML=`<p>Traditional weighted COMBVD, 0.11 balanced → 0.12 refined balanced: <strong>${a.weighted.toFixed(6)} → ${b.weighted.toFixed(6)}</strong>. COMBVD is fitted, not held-out.</p><div class="scroll"><table><tr><th>GenSpace path family</th><th>Mean step variation change</th><th>Mean step jump change</th></tr>${rows}</table></div><p class="hint">Negative percentages mean lower values. The diagnostic uses the actual inverse and the identical sample set for the parent and continuations. See the report for the exact grid and its overlap with training. GenSpace is a model-based ruler, not new observer data. Level still means inverse blackness, not Gen lightness.</p>`;
 const per=p.perHue;if(per){const nearest=per.reduce((a,b)=>Math.abs(((a.H-state.q.H+540)%360)-180)<Math.abs(((b.H-state.q.H+540)%360)-180)?a:b);let t=`<p>Nearest audited hue: <strong>${nearest.H.toFixed(2)}°</strong>. Mean variation over the four path families:</p><table><tr><th>Parent</th><th>Refined</th><th>Lighter refinement</th></tr><tr>`;for(const id of ids)t+=`<td>${nearest[id].toFixed(5)}</td>`;$('hueEvidence').innerHTML=t+'</tr></table>';}
 const board=$('board').value,keys=Object.keys(a[board]),table=document.createElement('table'),head=table.insertRow();
 for(const text of ['Dataset',...names]){const th=document.createElement('th');th.textContent=text;head.appendChild(th);}
 for(const key of keys){const tr=table.insertRow();tr.insertCell().textContent=labels[key]||key;for(const id of ids){const v=p.models[id][board][key],td=tr.insertCell();td.textContent=v.score===null?'N/A':v.score.toFixed(6)+(v.exact?'':' †');td.title=`${v.exact?'Unchanged input':(v.rejected?'Historical incomplete strict support':'All inputs converted; mapping applied')}; mapped ${v.mapped||0}; rejected ${v.rejected||0}; continued ${v.continued||0}`;if(!v.exact)td.className='support';}}
 $('benchTable').replaceChildren(table);
}
$('board').onchange=updateEvidence;
$('surround').onchange=()=>document.body.classList.toggle('neutral-surround',$('surround').checked);
// mapped-012-v1: evidence-policy selection never changes rendered colours.
let policyData=null;
$('benchDetails').insertAdjacentHTML('beforebegin','<label>Benchmark import <select id="benchPolicy"><option value="mapped">Mapped import (current)</option><option value="strict">Historical strict input</option></select></label><p id="policyNotice" class="hint"></p>');
function policyNotice(){if(!evidenceData)return;$('policyNotice').textContent=evidenceData.input_policy?'Mapped import: all forwarded inputs converted, with adjustments counted. All 3,813 COMBVD pairs are used in both gamuts. No fitting or triangle-rendering change. † means mapped input, not rejection.':'Historical strict results: unsupported inputs were rejected. Native COMBVD uses only 3,331 pairs. This is retained as a diagnostic, not the ordinary input policy.';}
$('benchPolicy').onchange=()=>{if(!policyData)return;evidenceData=policyData[$('benchPolicy').value];updateEvidence();policyNotice();};
Promise.all(['research/hue-fair-refine/results/site-data.json','research/mapped-012/results/site-data.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Evidence unavailable '+r.status);return r.json();}))).then(([strict,mapped])=>{
 policyData={strict,mapped};evidenceData=mapped;updateEvidence();policyNotice();
 const worst=strict.profiles.srgb.perHue.slice().sort((a,b)=>b.parent-a.parent).slice(0,8);
 for(const row of worst){const b=document.createElement('button');b.textContent=row.H.toFixed(2)+'°';b.onclick=()=>setHue(row.H);$('problemHues').appendChild(b);}
}).catch(e=>{$('progress').textContent=e.message;});

updateControls();requestSample();requestRender();

document.querySelector('footer').insertAdjacentHTML('beforeend','<p><a href="research/hue-fair-refine/NUMERICAL-LIMITS.md">Matched-coordinate conditioning and remaining blue limits</a></p>');

document.querySelector('footer').insertAdjacentHTML('beforeend','<p><a href="research/mapped-012/">Mapped-import ColorBench rerun and full policy report</a></p>');
