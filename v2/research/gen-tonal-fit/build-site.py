"""Add a four-way GenSpace-trained comparison; preserve all earlier entry points."""
from pathlib import Path
import re
P=Path(__file__).resolve().parent;V2=P.parents[1];ROOT=V2.parent;out=V2/'gen-tonal-ui';out.mkdir(exist_ok=True)
ids="['old-balanced','old-metric','balanced','metric']"
s=(V2/'shared-ui/worker.mjs').read_text()
s=s.replace("import {createHRLRefits} from '../refits.mjs';","import {createGenTonalHRL} from '../research/gen-tonal-fit/index.mjs';")
s=s.replace("['baseline','balanced','metric']",ids)
s=s.replace("checkpoint==='baseline'?createHRLRefits({gamut,checkpoint:'balanced',overflow:'reject',imaginary:'reject'}):createSharedHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'})","checkpoint.startsWith('old-')?createSharedHRL({gamut,checkpoint:checkpoint.slice(4),overflow:'reject',imaginary:'reject'}):createGenTonalHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'})")
s=s.replace("q=axis==='edge'?","q=axis==='white'?{H,R:fixed*(1-t),L:t+fixed*(1-t)}:axis==='edge'?")
s=s.replace("near=strip(ms[i],job.H,'edge',.9);","near=strip(ms[i],job.H,'edge',.9),white=strip(ms[i],job.H,'white',.65);")
s=s.replace('index:i,tri,reach,level,edge,near}', 'index:i,tri,reach,level,edge,near,white}').replace('near.pixels.buffer]','near.pixels.buffer,white.pixels.buffer]')
(out/'worker.mjs').write_text(s)
s=(V2/'shared-ui/app.mjs').read_text().replace("['baseline','balanced','metric']",ids).replace("names=['Previous separate balanced','Shared / dark-edge balanced','Shared / metric-leaning']","names=['0.10 balanced','0.10 metric','Gen tonal / balanced','Gen tonal / metric']")
s=s.replace('i<3','i<4').replace('Previous separate balanced','0.10 balanced').replace('The first panel is the previous separate balanced fit.','The first two panels are the unchanged shared 0.10 controls.')
s=s.replace('<div class="panel-actions">','<div class="barlabel">Add white: shade (R=L=.65) → white</div><canvas class="bar white" id="white${i}"></canvas><div class="panel-actions">')
s=s.replace("paint($('near'+d.index),d.near);","paint($('near'+d.index),d.near);paint($('white'+d.index),d.white);")
s=s.replace("profile:'HRL-0.10-shared-RL'","profile:state.checkpoint.startsWith('old-')?'HRL-0.10-shared-RL':'HRL-0.11-gen-tonal'").replace("sharedCalibration:state.checkpoint!=='baseline'","sharedCalibration:true")
a=s.index('function updateEvidence(){');b=s.index("$('board').onchange",a)
s=s[:a]+'''function updateEvidence(){
 if(!evidenceData)return;const p=evidenceData.profiles[state.gamut];
 for(let i=0;i<ids.length;i++){const m=p.models[ids[i]];$('score'+i).textContent=`COMBVD ${m.weighted.toFixed(4)} weighted / ${m.unweighted.toFixed(4)} unweighted · ${m.pairs} pairs`;}
 const a=p.models['old-balanced'],b=p.models.balanced;let rows='';
 for(const f of ['black','white','exchange','reach']){const v=a.visual[f],w=b.visual[f];rows+=`<tr><td>${f}</td><td>${(100*(w.meanCV/v.meanCV-1)).toFixed(1)}%</td><td>${(100*(w.meanStepJump/v.meanStepJump-1)).toFixed(1)}%</td></tr>`;}
 $('progress').innerHTML=`<p>Traditional weighted COMBVD, previous balanced → Gen tonal balanced: <strong>${a.weighted.toFixed(6)} → ${b.weighted.toFixed(6)}</strong>. COMBVD is fitted, not held-out.</p><div class="scroll"><table><tr><th>GenSpace path family</th><th>Mean step variation change</th><th>Mean step jump change</th></tr>${rows}</table></div><p class="hint">Negative percentages mean lower values. These direct-inverse tests use interleaved hues not used by the fit grid. GenSpace is a model-based ruler, not new observer data. Level still means inverse blackness, not Gen lightness.</p>`;
 const board=$('board').value,keys=Object.keys(a[board]),table=document.createElement('table'),head=table.insertRow();
 for(const text of ['Dataset',...names]){const th=document.createElement('th');th.textContent=text;head.appendChild(th);}
 for(const key of keys){const tr=table.insertRow();tr.insertCell().textContent=labels[key]||key;for(const id of ids){const v=p.models[id][board][key],td=tr.insertCell();td.textContent=v.score===null?'N/A':v.score.toFixed(6)+(v.exact?'':' †');td.title=`${v.exact?'Complete unchanged input support':'Incomplete support'}; mapped ${v.mapped||0}; rejected ${v.rejected||0}; continued ${v.continued||0}`;if(!v.exact)td.className='support';}}
 $('benchTable').replaceChildren(table);
}
'''+s[b:]
s=s.replace('research/shared-rl/results/site-data.json','research/gen-tonal-fit/results/site-data.json')
(out/'app.mjs').write_text(s)
(out/'style.css').write_text((V2/'shared-ui/style.css').read_text()+'\n.panels{grid-template-columns:repeat(4,minmax(0,1fr))}.barlabel{line-height:1.45}.white{height:28px}@media(max-width:1100px){.panels{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.panels{grid-template-columns:1fr}}\n')
s=(V2/'shared.html').read_text().replace('shared-ui/','gen-tonal-ui/').replace('HRL 0.10','HRL 0.11').replace('Shared R/L dark-edge refinement','GenSpace tonal fits').replace('Different gamuts. One R/L calibration.','One space. Both tonal directions.')
s=re.sub(r'<p class="intro">.*?</p>','<p class="intro">New shared checkpoints fitted with GenSpace, black dilution, white dilution, and neutral exchange. The first two panels preserve 0.10; the other two use new coefficients. Each candidate still has one learned bank across gamuts, and hue, neutral progression and vivid endpoints stay fixed.</p>',s,count=1)
s=s.replace('<option value="baseline">Previous separate balanced</option>','<option value="old-balanced">0.10 balanced</option><option value="old-metric">0.10 metric</option>')
s=s.replace('Shared / dark-edge balanced','Gen tonal balanced').replace('Shared / metric-leaning','Gen tonal metric').replace('Shared / dark-edge','Gen tonal').replace('Shared / metric','Gen tonal metric')
s=s.replace('research/shared-rl/','research/gen-tonal-fit/')
s=re.sub(r'<p class="hint"><strong>Tradeoff:</strong>.*?</p>','<p class="hint"><strong>Research checkpoints:</strong> only the new candidates were fitted in this experiment. Their full 3D GenSpace regularizer replaces the old scalar Oklab power target. The tables expose regressions and input exclusions; these are not newly measured blackness/whiteness ratings.</p>',s,count=1)
s=re.sub(r'<details><summary>Construction, provenance, and earlier work</summary>.*?</details>','''<details><summary>Construction, provenance, and earlier work</summary><p>R is chromaticness, K=1-L and W=L-R. Black dilution scales R and L. White dilution scales R and increases L toward one. Fixed-Reach Level is neutral exchange, not whole-colour white dilution.</p><p>One coefficient bank is fitted jointly to supported native and full COMBVD. Four generated-path families are regularized in the frozen HelmLab 1.0.0 GenSpace. No Oklab value or arbitrary lightness power target enters this fit. Corner progress uses full 3D distance, not mandatory increasing scalar lightness. The dark-edge continuation envelope is an engineering safeguard, not a new observer measurement.</p><p>Boundary/source normalization, hue identity, reference D65 and relative 100/300-nit scaling remain inherited. Full means the existing physical polygon for 0 ≤ relative Y ≤ 1. Display P3 remains outside the currently supported inherited polygon; no new gamut support is claimed. Adobe RGB transfer is tested without fitting.</p><p><a href="research/gen-tonal-fit/PLAN.md">Pre-fit plan</a> · <a href="research/gen-tonal-fit/README.md">Implementation and evidence</a> · <a href="research/gen-tonal-fit/results/REPORT.md">Full results</a> · <a href="research/gen-tonal-fit/results/verification.json">Numerical checks</a> · <a href="research/gen-tonal-fit/index.mjs">JavaScript library</a></p><p><a href="shared.html">Previous shared comparison</a> · <a href="research/tonal-semantics/">Black/white definitions lab</a> · <a href="refits.html">Older separate fits</a></p></details>''',s,flags=re.S)
(V2/'gen-tonal.html').write_text(s)
for path,url in [(ROOT/'index.html','v2/gen-tonal.html'),(V2/'index.html','gen-tonal.html'),(V2/'shared.html','gen-tonal.html')]:
 t=path.read_text();link=f'<a id="gen-tonal-link" href="{url}" style="color:#83e8ca;margin:12px;display:inline-block">GenSpace tonal fitted checkpoints</a>'
 if 'id="gen-tonal-link"' not in t:t=t.replace('</nav>',link+'</nav>',1) if '</nav>' in t else re.sub(r'(<body[^>]*>)',r'\1'+link,t,count=1);path.write_text(t)
print('Built additive four-way GenSpace tonal picker')
