"""Add a parent/continuation comparison, leaving all accepted pages in place."""
from pathlib import Path
import re
P=Path(__file__).resolve().parent;V2=P.parents[1];ROOT=V2.parent;out=V2/'hue-fair-ui';out.mkdir(exist_ok=True)
oldids="['old-balanced','old-metric','balanced','metric']";newids="['parent','balanced','gentle']"
s=(V2/'gen-tonal-ui/worker.mjs').read_text().replace("import {createSharedHRL} from '../research/shared-rl/source.mjs';","import {createHueFairHRL} from '../research/hue-fair-refine/index.mjs';").replace(oldids,newids)
old="checkpoint.startsWith('old-')?createSharedHRL({gamut,checkpoint:checkpoint.slice(4),overflow:'reject',imaginary:'reject'}):createGenTonalHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'})"
new="checkpoint==='parent'?createGenTonalHRL({gamut,checkpoint:'balanced',overflow:'reject',imaginary:'reject'}):createHueFairHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'})"
assert old in s;s=s.replace(old,new);(out/'worker.mjs').write_text(s)
s=(V2/'gen-tonal-ui/app.mjs').read_text().replace(oldids,newids).replace("names=['0.10 balanced','0.10 metric','Gen tonal / balanced','Gen tonal / metric']","names=['0.11 Gen tonal balanced','0.12 refined balanced','0.12 lighter refinement']").replace('i<4','i<3')
s=s.replace("'0.10 balanced'","'0.11 Gen tonal balanced'").replace('The first two panels are the unchanged shared 0.10 controls.','The first panel is the unchanged Gen tonal balanced parent.')
s=s.replace("profile:state.checkpoint.startsWith('old-')?'HRL-0.10-shared-RL':'HRL-0.11-gen-tonal'","profile:state.checkpoint==='parent'?'HRL-0.11-gen-tonal':'HRL-0.12-hue-fair'")
s=s.replace("const a=p.models['old-balanced'],b=p.models.balanced","const a=p.models.parent,b=p.models.balanced")
s=s.replace('previous balanced → Gen tonal balanced','0.11 balanced → 0.12 refined balanced')
s=s.replace('These direct-inverse tests use 72 offset hues: 48 are absent from the training hue grid and 24 are shared, with finer path sampling throughout.','The diagnostic uses the actual inverse and the identical sample set for the parent and continuations. See the report for the exact grid and its overlap with training.')
s=s.replace('research/gen-tonal-fit/results/site-data.json','research/hue-fair-refine/results/site-data.json')
s=s.split("\ndocument.querySelector('.intro').insertAdjacentHTML")[0]
s=s.replace('updateControls();requestSample();requestRender();}', 'updateControls();updateEvidence();requestSample();requestRender();}')
needle=" const board=$('board').value,keys=Object.keys(a[board])"
addition=""" const per=p.perHue;if(per){const nearest=per.reduce((a,b)=>Math.abs(((a.H-state.q.H+540)%360)-180)<Math.abs(((b.H-state.q.H+540)%360)-180)?a:b);let t=`<p>Nearest audited hue: <strong>${nearest.H.toFixed(2)}°</strong>. Mean variation over the four path families:</p><table><tr><th>Parent</th><th>Refined</th><th>Lighter refinement</th></tr><tr>`;for(const id of ids)t+=`<td>${nearest[id].toFixed(5)}</td>`;$('hueEvidence').innerHTML=t+'</tr></table>';}
"""
assert needle in s;s=s.replace(needle,addition+needle)
s=s.replace("evidenceData=d;updateEvidence();", "evidenceData=d;updateEvidence();const worst=d.profiles.srgb.perHue.slice().sort((a,b)=>b.parent-a.parent).slice(0,8);for(const row of worst){const b=document.createElement('button');b.textContent=row.H.toFixed(2)+'°';b.onclick=()=>setHue(row.H);$('problemHues').appendChild(b);}")
# Final export identity and blue-neighbor controls
s=s.replace('checkpoint:state.checkpoint,sharedCalibration:true',"checkpoint:state.checkpoint==='parent'?'balanced':state.checkpoint,viewCheckpoint:state.checkpoint,sharedCalibration:true")
s=s.replace('state.q={H:d.q.H,R:d.q.R,L:d.q.L};updateControls();requestRender();','state.q={H:d.q.H,R:d.q.R,L:d.q.L};updateControls();updateEvidence();requestRender();')
s=s.replace('for(const H of [0,30,60,90,150,210,240,270,300,330])','for(const H of [0,30,60,90,150,210,240,255,263,269,270,273,275,277,281,285,293,300,330])')
s += '\ndocument.querySelector(\'footer\').insertAdjacentHTML(\'beforeend\',\'<p><a href="research/hue-fair-refine/NUMERICAL-LIMITS.md">Matched-coordinate conditioning and remaining blue limits</a></p>\');\n'
(out/'app.mjs').write_text(s)
(out/'style.css').write_text((V2/'gen-tonal-ui/style.css').read_text()+"\n.panels{grid-template-columns:repeat(3,minmax(0,1fr))}@media(max-width:1000px){.panels{grid-template-columns:1fr}}#problemHues{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}\n")
s=(V2/'gen-tonal.html').read_text().replace('gen-tonal-ui/','hue-fair-ui/').replace('HRL 0.11','HRL 0.12').replace('GenSpace tonal fits','Balanced-parent hue refinement').replace('One space. Both tonal directions.','Smoother sheets, hue by hue.')
s=re.sub(r'<p class="intro">.*?</p>','<p class="intro">Both continuations start from Gen tonal balanced. This pass adds hue-specific risk and whole-triangle regularity checks, with extra attention to the blue region, while preserving one learned bank across gamuts. The unchanged parent remains in the first panel.</p>',s,count=1)
s=re.sub(r'(<select id="active">).*?(</select>)',r'\1<option value="parent">0.11 Gen tonal balanced</option><option value="balanced" selected>0.12 refined balanced</option><option value="gentle">0.12 lighter refinement</option>\2',s,flags=re.S)
s=s.replace('research/gen-tonal-fit/','research/hue-fair-refine/')
s=s.replace('<div class="panels" id="panels">','<p class="hint">Explore the parent’s eight least-even native hues by the current path diagnostic:</p><div id="problemHues"></div><div class="panels" id="panels">')
s=s.replace('<div id="panels"','<p class="hint">Explore the parent’s eight least-even native hues by the current path diagnostic:</p><div id="problemHues"></div><div id="panels"')
if 'id="problemHues"' not in s:s=s.replace('<section id="panels"','<p class="hint">Explore the parent’s eight least-even native hues:</p><div id="problemHues"></div><section id="panels"')
s=s.replace('<div id="progress">','<div id="hueEvidence"></div><div id="progress">')
if 'id="hueEvidence"' not in s:s=s.replace('<section class="evidence">','<section class="evidence"><div id="hueEvidence"></div>',1)
s=re.sub(r'<details><summary>Construction, provenance, and earlier work</summary>.*?</details>','''<details><summary>Construction, provenance, and earlier work</summary><p>R is chromaticness, K=1-L and W=L-R. GenSpace is an external ruler, not a redefinition of Level. Black dilution, white dilution, neutral exchange and Reach paths stay distinct. The hue field/ring, source atlases, neutral progression, vivid endpoints and D65 handling are unchanged.</p><p>The new synthetic constraints assess mean and high-error hues, local equilateral-sheet bending, corner retreats and departures from the parent’s dark edge. Extra blue attention follows user feedback, not invented observer measurements. Human-data fitting remains COMBVD. All other scored boards are evaluation only in this continuation, with previous development exposure disclosed.</p><p>Each continuation has a single learned coefficient bank used in both gamuts. The full solid remains the inherited physical polygon over relative Y from zero to one. Native output is generated inside sRGB; full previews use explicitly labelled display clipping. Untrained Adobe RGB transfer is checked; no new P3 support is claimed.</p><p><a href="research/hue-fair-refine/PLAN.md">Pre-fit plan</a> · <a href="research/hue-fair-refine/EVIDENCE.md">Evidence and equations</a> · <a href="research/hue-fair-refine/README.md">Implementation</a> · <a href="research/hue-fair-refine/results/REPORT.md">Complete results and regressions</a> · <a href="research/hue-fair-refine/results/verification.json">Numerical checks</a> · <a href="research/hue-fair-refine/index.mjs">JavaScript library</a></p><p><a href="gen-tonal.html">0.11 fitted comparison</a> · <a href="shared.html">0.10 shared comparison</a> · <a href="research/tonal-semantics/">Tonal-operations lab</a></p></details>''',s,flags=re.S)
s=s.replace('with an Oklab step-size diagnostic','with the frozen HelmLab GenSpace step-size diagnostic')
s=s.replace('Their full 3D GenSpace regularizer replaces the old scalar Oklab power target.','The parent already uses GenSpace; these continuations add per-hue risk and whole-triangle regularity controls.')
assert 'id="problemHues"' in s and 'id="hueEvidence"' in s
(V2/'hue-fair.html').write_text(s)
for path,url in [(ROOT/'index.html','v2/hue-fair.html'),(V2/'index.html','hue-fair.html'),(V2/'gen-tonal.html','hue-fair.html')]:
 t=path.read_text();link=f'<a id="hue-fair-link" href="{url}" style="color:#83e8ca;margin:12px;display:inline-block">Balanced-parent hue-sheet refinement</a>'
 if 'id="hue-fair-link"' not in t:
  t=t.replace('</nav>',link+'</nav>',1) if '</nav>' in t else re.sub(r'(<body[^>]*>)',r'\1'+link,t,count=1);path.write_text(t)
print('Built three-way balanced-parent comparison')

# Correct an inherited explanatory caption only; old conversion/score data stay untouched.
oldpage=V2/'gen-tonal.html';t=oldpage.read_text();oldpage.write_text(t.replace('with an Oklab step-size diagnostic','with the frozen HelmLab GenSpace step-size diagnostic'))
oldbuilder=V2/'research/gen-tonal-fit/build-site.py';t=oldbuilder.read_text();needle="(V2/'gen-tonal.html').write_text(s)"
if "s=s.replace('with an Oklab step-size diagnostic'" not in t:
 assert needle in t;oldbuilder.write_text(t.replace(needle,"s=s.replace('with an Oklab step-size diagnostic','with the frozen HelmLab GenSpace step-size diagnostic')\n"+needle))
