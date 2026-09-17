"""Add a shared-calibration page without replacing the earlier refit comparison."""
from pathlib import Path
import re
HERE=Path(__file__).resolve().parent;V2=HERE.parents[1];ROOT=V2.parent
out=V2/'shared-ui';out.mkdir(exist_ok=True)
worker=(V2/'refits-ui/worker.mjs').read_text()
worker=worker.replace("import {createHRLRefits} from '../refits.mjs';","import {createHRLRefits} from '../refits.mjs';\nimport {createSharedHRL} from '../research/shared-rl/source.mjs';")
worker=worker.replace("ids.map(checkpoint=>createHRLRefits({gamut,checkpoint,overflow:'reject',imaginary:'reject'}))","ids.map(checkpoint=>checkpoint==='baseline'?createHRLRefits({gamut,checkpoint:'balanced',overflow:'reject',imaginary:'reject'}):createSharedHRL({gamut,checkpoint,overflow:'reject',imaginary:'reject'}))")
worker=worker.replace("q=axis==='reach'?","q=axis==='edge'?{H,R:fixed*t,L:t}:axis==='reach'?")
worker=worker.replace("level=strip(ms[i],job.H,'level',job.fixedR);","level=strip(ms[i],job.H,'level',job.fixedR),edge=strip(ms[i],job.H,'edge',1),near=strip(ms[i],job.H,'edge',.9);")
worker=worker.replace('index:i,tri,reach,level}','index:i,tri,reach,level,edge,near}')
worker=worker.replace('reach.pixels.buffer,level.pixels.buffer]','reach.pixels.buffer,level.pixels.buffer,edge.pixels.buffer,near.pixels.buffer]')
(out/'worker.mjs').write_text(worker)
app=(V2/'refits-ui/app.mjs').read_text()
app=app.replace("names=['Before native refit','Balanced / smoother','Metric-leaning']","names=['Previous separate balanced','Shared / dark-edge balanced','Shared / metric-leaning']")
app=app.replace('<div class="panel-actions">','<div class="barlabel">Black → vivid: R = L</div><canvas class="bar edge" id="edge${i}"></canvas><div class="barlabel">Near edge: R = 0.9 L</div><canvas class="bar edge" id="near${i}"></canvas><div class="panel-actions">')
app=app.replace('HRL-0.9-dual-gamut-refits','HRL-0.10-shared-RL').replace('research/native-srgb-refit/results/site-data.json','research/shared-rl/results/site-data.json')
app=app.replace("paint($('level'+d.index),d.level);","paint($('level'+d.index),d.level);paint($('edge'+d.index),d.edge);paint($('near'+d.index),d.near);$('read'+d.index).textContent=`H ${d.H.toFixed(2)}° · move over this rendered triangle for current XYZ.`;")
app=app.replace('function requestRender(){',"function requestRender(){for(let i=0;i<3;i++)$('read'+i).textContent='Updating hue sheet…';")
app=app.replace('checkpoint:state.checkpoint,referenceWhite:','checkpoint:state.checkpoint,sharedCalibration:state.checkpoint!==\'baseline\',referenceWhite:')
app=app.replace('balanced and metric refits loaded.','one shared R/L bank per candidate loaded.')
app=app.replace("fetch('research/shared-rl/results/site-data.json')","$('surround').onchange=()=>document.body.classList.toggle('neutral-surround',$('surround').checked);\nfetch('research/shared-rl/results/site-data.json')")
for old in ['Previous native C1','Before full refit','Corrected solid, before refit']:app=app.replace("'"+old+"'","'Previous separate balanced'")
app=app.replace('using this profile’s own vivid boundary and fitted R/L progression. The full-domain checkpoints remain separately available.','using its own vivid boundary and the same learned R/L math as the full realization. The first panel is the previous separate balanced fit.')
needle="const board=$('board').value"
app=app.replace(needle,"const edge=p.edge;if(edge)$('progress').insertAdjacentHTML('beforeend',`<p>At R = L = 0.25, mean own-endpoint-normalized Oklab lightness changes from <strong>${edge.baseline.toFixed(4)} to ${edge.balanced.toFixed(4)}</strong>. This is a dark-edge diagnostic, not the definition of Level.</p>`);\n "+needle)
(out/'app.mjs').write_text(app)
(out/'style.css').write_text((V2/'refits-ui/style.css').read_text()+'\n.neutral-surround .canvas-wrap{background:#777;border-radius:4px}.edge{height:28px}.barlabel{line-height:1.4}\n')
html=(V2/'refits.html').read_text().replace('refits-ui/','shared-ui/')
html=html.replace('Native sRGB & full-gamut refits','Shared R/L dark-edge refinement')
html=html.replace('Explore independent native-sRGB and full-gamut HRL refits, with balanced and metric calibrations, color picking, and scored benchmarks.','One R/L calibration across gamut realizations, with explicit dark-edge control and auditable tradeoffs.')
html=html.replace('HRL 0.9 · gamut-relative research','HRL 0.10 · shared-calibration research').replace('Two gamuts. One hue family.','Different gamuts. One R/L calibration.')
html=re.sub(r'<p class="intro">.*?</p>','<p class="intro">The same learned coefficients now operate in native sRGB and the full relative-Y solid. The gamut supplies its boundary and deterministic own-anchor normalization, not another fitted head. Compare the previous separate balanced fit with two shared candidates, especially the black-to-vivid edge.</p>',html,count=1)
html=html.replace('Native refit source notes','Shared refinement source notes').replace('research/native-srgb-refit/README.md','research/shared-rl/README.md')
html=html.replace('<label class="mask">','<label class="mask"><input id="surround" type="checkbox">Neutral triangle surround</label><label class="mask">')
html=html.replace('Balanced / smoother</option>','Shared / dark-edge balanced</option>').replace('Metric-leaning</option>','Shared / metric-leaning</option>').replace('Previous calibration</option>','Previous separate balanced</option>')
html=html.replace('<section class="evidence">','<section class="evidence"><p class="hint"><strong>Tradeoff:</strong> this shared fit prioritizes the darker lower edge and one common calibration. Its COMBVD scores are worse than the separately fitted predecessors. Positive invertibility does not guarantee perfectly even visual contours; remaining local and full-gamut irregularities are reported.</p>')
html=re.sub(r'<details><summary>Construction, provenance, and earlier work</summary>.*?</details>','''<details><summary>Construction, provenance, and earlier work</summary>
<p>Reach is chromaticness and Level is brilliance / inverse blackness: K = 1 − L, W = L − R. The R = L edge has zero whiteness. U = R/L is only an internal saturation-like ratio; Level is not luminance Y or Oklab lightness.</p>
<p>Each candidate has one bank of learned R/L coefficients and one common hue-dependent dark-side curve. The own-anchor source atlases are deterministic geometry caches, rebuilt from the same path-integration math. A custom linear-RGB matrix can supply a new boundary without training. Adobe RGB (1998) is numerically tested as an untrained third gamut. Canonical P3 currently exceeds the inherited physical polygon slightly and is explicitly rejected; it is not silently clipped or claimed supported.</p>
<p>The regular-bicone metric remains <code>[L − R/2, √3 R cos(H)/2, √3 R sin(H)/2]</code>. The full solid covers the declared physical polygon over 0 ≤ relative Y ≤ 1, not unlimited absolute luminance. D65 and the 300-nit reference scale are retained.</p>
<p>The inverse dark correction is <code>φ(t) = t − a(H,U)t(1−t)²</code>, with <code>0 ≤ a ≤ 0.85 U²</code>. It is monotone, endpoint-preserving and neutral-preserving. Its target curve is an engineering response to the user's visual feedback, not newly measured observer data.</p>
<p><a href="research/shared-rl/PLAN.md">Preserved plan</a> · <a href="research/shared-rl/EVIDENCE.md">Ten-paper intake</a> · <a href="research/shared-rl/EXECUTION.md">Execution and trial history</a> · <a href="research/shared-rl/results/REPORT.md">Scored results</a> · <a href="research/shared-rl/results/verification.json">Numerical checks</a> · <a href="research/shared-rl/source.mjs">Shared library</a></p>
<p><a href="refits.html">Previous separate native/full refits</a> · <a href="a-smooth.html">A Smooth</a></p>
<p class="hint">Model-based path diagnostics and round-trip success are not evidence of perceptual uniformity. Earlier development-data exposure remains disclosed. The inherited wide-gamut hue continuation and polygonal boundary remain limitations.</p></details>''',html,flags=re.S)
(V2/'shared.html').write_text(html)
for path,url in [(ROOT/'index.html','v2/shared.html'),(V2/'index.html','shared.html'),(V2/'refits.html','shared.html')]:
 if not path.exists():continue
 text=path.read_text()
 if 'id="shared-rl-link"' not in text:
  link=f'<a id="shared-rl-link" href="{url}" style="color:#83e8ca;margin:12px;display:inline-block">Shared R/L + dark-edge comparison</a>'
  text=text.replace('</nav>',link+'</nav>',1) if '</nav>' in text else re.sub(r'(<body[^>]*>)',r'\1'+link,text,count=1)
  path.write_text(text)
for path,href in [(ROOT/'README.md','v2/shared.html'),(V2/'README.md','shared.html')]:
 if path.exists() and '<!-- shared-rl -->' not in path.read_text():
  with path.open('a') as f:f.write(f'\n<!-- shared-rl -->\n## Shared R/L dark-edge research\n\n[Live comparison]({href}) retains prior refits and adds one learned R/L bank per candidate across gamut realizations. See `research/shared-rl` under v2 for the plan, evidence, tests and explicit tradeoffs.\n')
print('Built shared page, worker, controls, and additive navigation')
