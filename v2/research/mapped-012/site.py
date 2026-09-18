"""Make the mapped results the default evidence; keep historical strict selectable."""
from pathlib import Path
P=Path(__file__).resolve().parent;V=P.parents[1]
f=V/'hue-fair-ui/app.mjs';s=f.read_text()
assert 'mapped-012-v1' not in s,'Already integrated'
start=s.index("fetch('research/hue-fair-refine/results/site-data.json')");end=s.index('\nupdateControls();',start)
s=s[:start]+'''// mapped-012-v1: evidence-policy selection never changes rendered colours.
let policyData=null;
$('benchDetails').insertAdjacentHTML('beforebegin','<label>Benchmark import <select id="benchPolicy"><option value="mapped">Mapped import (current)</option><option value="strict">Historical strict input</option></select></label><p id="policyNotice" class="hint"></p>');
function policyNotice(){if(!evidenceData)return;$('policyNotice').textContent=evidenceData.input_policy?'Mapped import: all forwarded inputs converted, with adjustments counted. All 3,813 COMBVD pairs are used in both gamuts. No fitting or triangle-rendering change. † means mapped input, not rejection.':'Historical strict results: unsupported inputs were rejected. Native COMBVD uses only 3,331 pairs. This is retained as a diagnostic, not the ordinary input policy.';}
$('benchPolicy').onchange=()=>{if(!policyData)return;evidenceData=policyData[$('benchPolicy').value];updateEvidence();policyNotice();};
Promise.all(['research/hue-fair-refine/results/site-data.json','research/mapped-012/results/site-data.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Evidence unavailable '+r.status);return r.json();}))).then(([strict,mapped])=>{
 policyData={strict,mapped};evidenceData=mapped;updateEvidence();policyNotice();
 const worst=strict.profiles.srgb.perHue.slice().sort((a,b)=>b.parent-a.parent).slice(0,8);
 for(const row of worst){const b=document.createElement('button');b.textContent=row.H.toFixed(2)+'°';b.onclick=()=>setHue(row.H);$('problemHues').appendChild(b);}
}).catch(e=>{$('progress').textContent=e.message;});
''' + s[end:]
s=s.replace("v.exact?'Complete unchanged input support':'Incomplete support'","v.exact?'Unchanged input':(v.rejected?'Historical incomplete strict support':'All inputs converted; mapping applied')")
s=s.replace('weighted / ${m.unweighted.toFixed(4)} unweighted · ${m.pairs} pairs`','weighted / ${m.unweighted.toFixed(4)} unweighted · ${m.pairs} pairs · ${evidenceData.input_policy?"mapped":"historical strict"}`')
s=s.replace("if(!evidenceData)return;const p=evidenceData.profiles[state.gamut];","if(!evidenceData)return;policyNotice();const p=evidenceData.profiles[state.gamut];")
s+="\ndocument.querySelector('footer').insertAdjacentHTML('beforeend','<p><a href=\"research/mapped-012/\">Mapped-import ColorBench rerun and full policy report</a></p>');\n"
f.write_text(s)
print('Default mapped evidence; original strict evidence remains selectable; worker unchanged')
