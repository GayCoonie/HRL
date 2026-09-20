"""Build a reviewable comparison from frozen direct audits, not fitter estimates."""
from pathlib import Path
import json,hashlib,html
import mistune
P=Path(__file__).resolve().parent;O=P/'results'
def read(n):return json.loads((O/n).read_text())
b=read('audit-beta1.json')['models']['beta1'];a=read('audit-joint.json')['models']['joint'];d=read('audit-joint-dense.json')['models']['joint-dense'];old=json.loads((P/'../level-contours/results/comparison.json').read_text())['models']['strict'];rec=read('joint.json');sha=hashlib.sha256((O/'joint.json').read_bytes()).hexdigest()
assert all(r['recordSHA256']==sha for r in a.values())
comparison={'schema':'hrl-joint-comparison-v1','selected':rec['variant'],'selectedSHA256':sha,'trainingOnly':True,'models':{'beta1':b,'joint':a,'joint-dense':d,'strict':old}}
# UI summaries intentionally omit large per-path raw arrays; exact audits retain them.
for name,gs in comparison['models'].items():
 for g,r in gs.items():gs[g]={k:v for k,v in r.items() if k not in ['rows','whole','orderRows','critical']}
(O/'comparison.json').write_text(json.dumps(comparison,indent=2)+'\n')
f=lambda v:f'{v:.6f}';pct=lambda x,y:f'{100*(1-x/y):.2f}%'
score='| Population | Beta 1 | Joint fit | Change |\n|---|---:|---:|---:|\n'
for name,bb,aa in [('Native sRGB, **3,331 retained**',b['srgb']['score']['weighted'],a['srgb']['score']['weighted']),('Full, **3,813 retained**',b['full']['score']['weighted'],a['full']['score']['weighted']),('Native sRGB, 3,813 mapped inputs',b['srgb']['score']['mappedAll']['weighted'],a['srgb']['score']['mappedAll']['weighted'])]:score+=f'| {name} | {f(bb)} | {f(aa)} | {abs(100*(1-aa/bb)):.2f}% {"lower" if aa<bb else "higher"} |\n'
visual='| Diagnostic | sRGB Beta 1 | sRGB joint | Full Beta 1 | Full joint |\n|---|---:|---:|---:|---:|\n'
for label,part,key in [('Mean near-gray J backtracking','nearGray','meanTurn'),('Worst near-gray J backtracking','nearGray','worstTurn'),('Paths exceeding .001 J, out of 504','nearGray','overThreshold'),('Near-gray vector-gradient variation','nearGray','meanGradientVariation'),('Mean whole-contour J backtracking','wholeContour','meanTurn'),('Mean whole-contour color-step CV','wholeContour','meanStepCV'),('Worst relative adjacent color-step jump','wholeContour','worstRelativeStepJump'),('Worst fixed-Reach adjacent J drop','levelOrdering','worstDrop'),('Mean total fixed-Reach J retreat','levelOrdering','meanTotalRetreat'),('Worst total fixed-Reach J retreat','levelOrdering','worstTotalRetreat'),('Negative fixed-Reach J steps','levelOrdering','negativeSteps'),('Worst fixed-Reach adjacent Y drop','levelOrdering','worstYDrop')]:
 vals=[r[g][part][key] for g in ['srgb','full'] for r in [b,a]];visual+='| '+label+' | '+' | '.join(str(v) if isinstance(v,int) else f(v) for v in vals)+' |\n'
oa=read('audit-offgrid-joint.json')['models']['joint'];ob=read('audit-offgrid-beta1.json')['models']['beta1']
off='| Offset geometry check | Native sRGB | Full |\n|---|---:|---:|\n'
for label,part,key in [('Near-gray mean reduction','nearGray','meanTurn'),('Worst Level-step J drop: Beta 1 → joint','levelOrdering','worstDrop'),('Worst total J retreat: Beta 1 → joint','levelOrdering','worstTotalRetreat'),('Worst Level-step Y drop: Beta 1 → joint','levelOrdering','worstYDrop')]:
 vals=[pct(oa[g][part][key],ob[g][part][key]) if key=='meanTurn' else f(ob[g][part][key])+' → '+f(oa[g][part][key]) for g in ['srgb','full']];off+='| '+label+' | '+' | '.join(vals)+' |\n'
assert all(a[g]['score']['weighted']<b[g]['score']['weighted'] and a[g]['nearGray']['meanTurn']<.1*b[g]['nearGray']['meanTurn'] for g in ['srgb','full'])
text=f'''# HRL joint visual and observer fit — 20 September 2026

The expanded shared model improves retained-pair COMBVD in both realizations while strongly reducing the near-gray ridges. The saved selection is **{rec['variant']}**. These are directly evaluated runtime results, not interpolated fitting statistics. Beta 1 remains the named release.

[Interactive comparison](../../joint.html) · [Model and objective](METHOD.md) · [Reproduction](REPRODUCE.md) · [Independent review](INDEPENDENT_REVIEW.md)

## Observer results

COMBVD weighted STRESS, lower is better. The native retained population is reported separately from the all-input mapped population.

{score}
Unweighted retained STRESS: native {f(b['srgb']['score']['unweighted'])} → **{f(a['srgb']['score']['unweighted'])}**; full {f(b['full']['score']['unweighted'])} → **{f(a['full']['score']['unweighted'])}**. The observer pairs are training data. No held-out accuracy or fresh ColorBench run is claimed.

## Direct visual measurements

The primary near-gray audit uses 72 offset hues × seven dark Levels × 257 samples across U=R/L from 0 to .25. Mean J backtracking falls **{pct(a['srgb']['nearGray']['meanTurn'],b['srgb']['nearGray']['meanTurn'])} in sRGB** and **{pct(a['full']['nearGray']['meanTurn'],b['full']['nearGray']['meanTurn'])} in full**. Whole-contour checks use 360 paths with 129 points; fixed-Reach checks use 504 paths with 65 points. Each comparison uses identical sample sets for both models.

{visual}
J diagnoses tonal travel that reverses direction; it does not define Level. Level remains absence of blackness. Vector-gradient variation examines changes in all three GenSpace components. Color-step CV measures uneven spacing along entire contours. Integrated retreat avoids the misleading improvement that can occur when a bad descent is merely split into smaller adjacent steps. Scalar diagnostics complement actual hue-sheet and gradient inspection.

## Additional geometry coverage

The extra audit changes hue offsets to 1.25° plus multiples of 5°, uses seven different near-gray Levels and seven different fixed-Reach values. These geometry paths were absent from the optimization grid. This is additional synthetic coverage, not held-out observer evidence.

{off}
A concrete residual is full H=171.25°, R=.35, L=.35→.36015625: the selected fit loses .028449 J while Beta 1 rises .004230 J at the same coordinates. Aggregate gains therefore coexist with a new local reversal. The worst relative adjacent color-step jump also remains a limitation despite improved mean CV. The raw audits record exact worst locations, all path rows and physical-Y measurements. Remaining negative steps, uneven spacing or counterexamples must remain visible; the result is not a proof of perfect ordering or a universal perceptual preference. Full-domain image pixels are clipped to an sRGB display, while curves are evaluated before clipping.

## Why the earlier apparent tradeoff was avoidable

The previous raw-contour family discarded deterministic own-anchor normalization and could not reproduce Beta 1's interior geometry. This experiment restores that scaffold and expands the invertible mapping around it: finite-endpoint positive powers, richer Level/Reach coupling, interior circle maps and a learnable shared gray calibration. The expanded seed exactly reproduces Beta 1. One coefficient bank serves both realizations; gamut identity never enters the learned mapping.

Only vivid-ring angles and the general bicone/pseudoRGB architecture were treated as fixed. Interior hue, gray calibration, tonal shapes, coefficients and the optimization method were open. The sampled vivid XYZ difference is exactly zero. Shared gray values at the same numerical Level change by up to {f(a['srgb']['grayXYZChange'])} in an XYZ component in the declared gray probe; this is an intended open degree of freedom.

Initial sparse fits obtained better COMBVD but missed sharp reversals between training hues. Independent diagnosis showed that public-hue coverage and a partition-dependent ordering statistic were the main causes. The corrected fit covers the entire hue circle every 2.5°, weights angular means by interval size, penalizes integrated negative travel, and uses a finer physical lookup. An Adam warm-up/alternative avoids relying solely on a stalled line search. All provisional records and their fitting-code versions are retained with honest failure scopes.

The earlier **joint-dense** is also inspectable: it scores {d['srgb']['score']['weighted']:.6f}/{d['full']['score']['weighted']:.6f} on retained sRGB/full and has strong contour gains, but whole-contour spacing remains less uniform than Beta 1. It is useful evidence that joint observer/contour gains were attainable before the later spacing refinement.

## Identity and verification

Selected record SHA256: `{sha}`. The `joint.json` alias is byte-identical to its originating checkpoint; no coefficient averaging or unrecorded refit occurs. Runtime inversion, fixed ring, shared bank, Python/JS coordinate parity and finite-difference gradients are checked separately from visual measurements. Direct audits bind the selected record hash. Finite samples do not prove uniform numerical conditioning.

Use the interactive page to inspect fixed-Level Reach paths, fixed-Reach Level paths, full hue sheets and display-clipping marks. Source grids and fit statistics are approximate; the saved direct audits and actual rendering remain authoritative. The next research question is the residual structure visible in these exact records, not whether the earlier restricted family established an unavoidable tradeoff.
'''
(P/'RESULTS.md').write_text(text)
body=mistune.create_markdown(plugins=['table'])(text)
page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HRL · Joint visual and observer results</title><link rel="stylesheet" href="../../tonal-next.css"><style>main{max-width:1100px}table{display:block;overflow:auto;border-collapse:collapse}th,td{padding:10px;border:1px solid var(--line)}h2{margin-top:36px}p{margin:16px 0}pre{overflow:auto}code{overflow-wrap:anywhere}</style></head><body><main>'+body+'</main></body></html>'
(P/'RESULTS.html').write_text(page)
print('Summaries bind',rec['variant'],sha)
