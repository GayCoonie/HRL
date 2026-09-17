"""Finalize interpretation notes after the numerical run. No coefficients change."""
from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parent;V2=P.parents[1];ROOT=V2.parent
frozen={n:hashlib.sha256((P/f'results/{n}.json').read_bytes()).hexdigest() for n in ['balanced','metric']}
d=json.loads((P/'results/direct-final.json').read_text())
hues=[r['H'] for r in d['models']['balanced']['srgb']['rows']]
shared=sum(any(abs(h-7.5*i)<1e-9 for i in range(48)) for h in hues)
assert len(hues)==72 and shared==24
sampling={'trainingHueCount':48,'diagnosticHueCount':72,'diagnosticHuesAbsentFromTraining':48,'diagnosticHuesAlsoInTraining':24,'diagnosticHueOffsetDegrees':2.5,'diagnosticHueStepDegrees':5,'samplesPerPath':257,'meaning':'Denser mixed-grid numerical check, not a wholly held-out hue set or independent observer validation.'}
(P/'results/sampling.json').write_text(json.dumps(sampling,indent=2)+'\n')
old='These direct-inverse tests use interleaved hues not used by the fit grid.'
new='These direct-inverse tests use 72 offset hues: 48 are absent from the training hue grid and 24 are shared, with finer path sampling throughout.'
for path in [V2/'gen-tonal-ui/app.mjs',P/'build-site.py']:
 text=path.read_text()
 if old in text:assert text.count(old)==1;path.write_text(text.replace(old,new))
notes=['## Sampling and dark-edge interpretation','','The diagnostic samples 72 hues at 5-degree intervals with a 2.5-degree offset. **48 are absent from the 48-hue training grid; 24 coincide with it.** The entire set is therefore not a held-out hue set. All path families also use finer parameter sampling and the actual inverse instead of the fit lookup.','','These fits redistribute the dark-side progression; they do not force every low-Level colour to get darker. In particular, the mean R=L=.25 output is lighter by the same GenSpace ruler than in 0.10 balanced. This is a real change of the colours, not merely a switch of rulers: both controls and candidates below are rerated identically.','','| Gamut | Candidate | Mean Gen lightness / vivid Gen lightness at R=L=.25 | Mean Gen distance from black / vivid distance |','|---|---|---:|---:|']
for gamut in ['srgb','full']:
 for name in ['old-balanced','old-metric','balanced','metric']:
  e=d['models'][name][gamut]['edge'];notes.append(f"| {gamut} | {name} | {e['quarterGenLightness']:.6f} | {e['quarterGenDistance']:.6f} |")
notes+=['','Neither diagnostic is the definition of Level. The new balanced and metric versions are closer to each other on this dark-edge progress measure; human preference is still a separate question. Blue and cyan should be inspected against both old controls rather than declared universally repaired.','','The balanced candidate has slightly larger fixed-Reach neutral-exchange CV than its same-role predecessor (native and full), despite smaller mean adjacent step jumps. Its full-gamut black-family mean total retreat magnitude also increases slightly even though the number of affected paths decreases. These are counterexamples to a blanket all-metrics-improved claim. The raw per-path and worst-step data remain available.','']
text='\n'.join(notes);(P/'FINDINGS.md').write_text(text)
report=P/'results/REPORT.md';body=report.read_text();marker='\n\n## Sampling and dark-edge interpretation'
if marker in body:body=body.split(marker)[0]
report.write_text(body.rstrip()+'\n\n'+text)
compiler=P/'report.py';body=compiler.read_text();needle="(R/'REPORT.md').write_text('\\n'.join(lines));"
if "if (P/'FINDINGS.md').exists():" not in body:
 assert needle in body
 body=body.replace(needle,"if (P/'FINDINGS.md').exists():lines += ['',(P/'FINDINGS.md').read_text()]\n"+needle)
 compiler.write_text(body)
js="\ndocument.querySelector('.intro').insertAdjacentHTML('afterend','<p class=\"hint\" id=\"gen-tonal-dark-note\">The lower black-to-vivid region is lighter on average than in 0.10 balanced. This fit targets smoother tonal progression, not uniform additional darkening. Compare blue and cyan against the old controls. <a href=\"research/gen-tonal-fit/FINDINGS.md\">Sampling and dark-edge details</a></p>');\n"
app=V2/'gen-tonal-ui/app.mjs'
if 'gen-tonal-dark-note' not in app.read_text():app.write_text(app.read_text()+js)
builder=P/'build-site.py';body=builder.read_text();needle="(out/'app.mjs').write_text(s)"
if 'gen-tonal-dark-note' not in body:
 assert body.count(needle)==1;builder.write_text(body.replace(needle,'s += '+repr(js)+'\n'+needle))
readme=ROOT/'README.md';body=readme.read_text()
if '<!-- gen-tonal-fit -->' not in body:
 body+='\n\n<!-- gen-tonal-fit -->\n## HRL 0.11 GenSpace tonal research\n\n[Four-way fitted comparison](https://gaycoonie.github.io/HRL/v2/gen-tonal.html) preserves both shared 0.10 controls and adds newly fitted balanced/metric checkpoints. One learned coefficient bank per candidate operates across gamuts. [Source and method](v2/research/gen-tonal-fit/README.md), [scored report](v2/research/gen-tonal-fit/results/REPORT.md), and [sampling/dark-side tradeoffs](v2/research/gen-tonal-fit/FINDINGS.md) are retained. The Release 1 entry point and all earlier checkpoints remain unchanged.\n'
 readme.write_text(body)
assert all(hashlib.sha256((P/f'results/{n}.json').read_bytes()).hexdigest()==h for n,h in frozen.items())
print('Finalized sampling, dark-side and residual-regression notes; frozen models unchanged.')
