"""Compile actual scored and direct-runtime results, preserving support distinctions."""
from pathlib import Path
import json,hashlib,numpy as np
P=Path(__file__).resolve().parent;R=P/'results'
load=lambda name:json.loads((R/name).read_text())
bench=load('colorbench.json');direct=load('direct-final.json');selection=load('SELECTION.json');verify=load('verification.json')
ids=['old-balanced','old-metric','balanced','metric'];labels=['0.10 balanced','0.10 metric','Gen tonal balanced','Gen tonal metric'];site={'profiles':{},'selection':selection}
lines=['# HRL 0.11: GenSpace-trained tonal checkpoints','','These are newly fitted coefficients, not a rerating or relabeling of the unchanged 0.10 candidates. Previous models and entry points are retained. The source geometry, hue field and ring, neutral progression, vivid endpoints and one-bank-per-candidate architecture are unchanged.','','## What was fitted','','Human training: supported COMBVD pairs only. Synthetic regularizers: full three-dimensional frozen HelmLab 1.0.0 GenSpace trajectories for black dilution, white dilution, neutral exchange and fixed-Level Reach. Oklab and the former scalar lightness power target are absent from this fit. ZCAM motivates the semantics but its predicted attribute ratings were not relabeled as new human observations.','','The traditional weighted STRESS-squared objective has equal native/full weights. Each recipe records its path, corner-retreat and dark-envelope weights. The broad dark continuation envelope uses previous user-reviewed candidates, not a paper-derived curve. R=chromaticness, K=1-L and W=L-R remain the meaning of the coordinates.','','## COMBVD: actual runtime, unchanged support','','| Candidate | Native weighted | Native unweighted | Full weighted | Full unweighted |','|---|---:|---:|---:|---:|']
for id,label in zip(ids,labels):
 n=bench['models'][id+'-srgb']['combvd'];f=bench['models'][id+'-full']['combvd'];lines.append(f"| {label} | {n['traditional_weighted']:.6f} | {n['unweighted']:.6f} | {f['traditional_weighted']:.6f} | {f['unweighted']:.6f} |")
 for g in ['srgb','full']:
  a=bench['models'][id+'-'+g]['combvd'];assert a['audit']['mapped']==0;assert abs(a['traditional_weighted']-direct['models'][id][g]['scores']['weighted'])<1e-6
lines+=['','Native retains the same 3,331/3,813 supported pairs, full retains all 3,813. No COMBVD clipping. The native and full overall values have different support and are not a same-stimulus gamut comparison. COMBVD is in-sample. Earlier project development exposed other evaluation results; the scored rerun is not pristine independent validation.','','## Direct GenSpace paths','','72 hues offset 2.5 degrees from the nominal grid, five paths in each of four families, 257 samples, four models, two gamuts: 2,960,640 XYZ evaluations including repeated endpoints. Actual inverse runtime, not the training lookup grid. Two endpoint steps are trimmed for step-variation statistics, but not for direction checks. No display clipping or unavailable-path deletion.','','| Gamut | Candidate | Black CV | White CV | Neutral-exchange CV | Reach CV |','|---|---|---:|---:|---:|---:|']
for g in ['srgb','full']:
 site['profiles'][g]={'models':{}}
 for id,label in zip(ids,labels):
  d=direct['models'][id][g];s=d['summaries'];b=bench['models'][id+'-'+g];c=b['combvd']
  lines.append('| '+g+' | '+label+' | '+' | '.join(f"{s[f]['meanCV']:.6f}" for f in ['black','white','exchange','reach'])+' |')
  m={'weighted':c['traditional_weighted'],'unweighted':c['unweighted'],'pairs':c['retained'],'visual':s,'edge':d['edge']}
  for board in ['generation','measurement']:
   m[board]={}
   for key,r in b[board].items():
    a=r.get('audit',{});m[board][key]={'score':r['score'],'exact':r['exact_input_support'],'mapped':a.get('mapped',0),'rejected':a.get('rejected',r.get('total',0)-r.get('retained',0)),'continued':a.get('continued',0)}
  site['profiles'][g]['models'][id]=m
lines+=['','CV is step-size standard deviation divided by its mean. Lower is more even by this external ruler, not proof of human preference. Unlike the preceding audit, the path ratios and offset hues are revised; all old controls are rerun on the identical new diagnostic sample set.','','### Step jumps and corner direction','','| Gamut | Candidate | Black mean step jump | White mean step jump | Black retreat paths / 360 | White retreat paths / 360 | Mean white retreat / start distance |','|---|---|---:|---:|---:|---:|---:|']
for g in ['srgb','full']:
 for id,label in zip(ids,labels):
  s=direct['models'][id][g]['summaries'];b,w=s['black'],s['white'];lines.append(f"| {g} | {label} | {b['meanStepJump']:.6f} | {w['meanStepJump']:.6f} | {b['cornerRetreatPaths']} | {w['cornerRetreatPaths']} | {w['meanRetreatFraction']:.8f} |")
lines+=['','A corner retreat is movement back toward black on a black-origin path, or away from the endpoint on a white-directed path in full GenSpace distance. It is not a topological fold. Both counts and magnitudes matter. A larger or smaller scalar Gen lightness value is not substituted for blackness or whiteness.','','### Matching-role changes','','| Gamut | New candidate vs same-role 0.10 | Weighted COMBVD change | Black CV change | White CV change |','|---|---|---:|---:|---:|']
for g in ['srgb','full']:
 for id in ['balanced','metric']:
  a=site['profiles'][g]['models']['old-'+id];b=site['profiles'][g]['models'][id];lines.append(f"| {g} | {id} | {b['weighted']-a['weighted']:+.6f} | {100*(b['visual']['black']['meanCV']/a['visual']['black']['meanCV']-1):+.2f}% | {100*(b['visual']['white']['meanCV']/a['visual']['white']['meanCV']-1):+.2f}% |")
lines+=['','Do not infer that every hue or every local step improved from an average. Raw per-hue and per-path results are in direct-final.json, including worst-step measures and residual reversals. Interleaved synthetic samples are a numerical out-of-grid check, not independent observer data.','','## Scored ColorBench','','Only the five scored generation and sixteen scored measurement columns. The scored judges are unchanged, not redefined in GenSpace. Strict native/full inputs are shown below. A dagger denotes incomplete or mapped support; N/A is unavailable, not zero. Full clipped results are a separate pipeline. No overall leaderboard rank is constructed.']
def fmt(v):return 'N/A' if v['score'] is None else f"{v['score']:.6f}"+('' if v['exact_input_support'] else ' †')
for g in ['srgb','full']:
 lines+=['',f'### {g}: strict inputs','','| Test | '+ ' | '.join(labels)+' |','|---|---:|---:|---:|---:|']
 for board in ['generation','measurement']:
  for key in bench['models']['old-balanced-'+g][board]:lines.append('| '+key+' | '+' | '.join(fmt(bench['models'][id+'-'+g][board][key]) for id in ids)+' |')
lines+=['','### Full: explicitly mapped pipeline','','| Test | Gen tonal balanced | Gen tonal metric |','|---|---:|---:|']
for board in ['generation','measurement']:
 for key in bench['models']['balanced-full-clip'][board]:lines.append('| '+key+' | '+' | '.join(fmt(bench['models'][id+'-full-clip'][board][key]) for id in ['balanced','metric'])+' |')
lines+=['','## Same-pair overlap and full-only check','','| Candidate | Realization / subset | Pairs | Weighted STRESS |','|---|---|---:|---:|']
def stress(d,v,w):return 100*np.sqrt(max(0,1-(w*d*v).sum()**2/((w*d*d).sum()*(w*v*v).sum())))
for id,label in zip(ids,labels):
 n=np.load(R/f'{id}-srgb-combvd.npz');f=np.load(R/f'{id}-full-combvd.npz');common=n['retained'];extra=f['retained']&~common
 for desc,a,mask in [('srgb / common',n,common),('full / common',f,common),('full / full-only',f,extra)]:lines.append(f"| {label} | {desc} | {int(mask.sum())} | {stress(a['de'][mask],a['dv'][mask],a['weights'][mask]):.6f} |")
lines+=['','## Verification','','The actual JavaScript checks cover 8,192 random triangle round-trips per model/gamut (256 near black), 4,096 exact 16-bit round-trips, 1,025 neutrals, 720 vivid anchors, 1,200 interior Jacobians, and circular continuity. Also: 2,048 identical normalized tuples across gamuts, 2,048 untrained Adobe RGB linear round-trips, and 1,024 relative 100/300-nit identity checks per candidate.','','| Candidate | Native maximum embedding error | Full maximum embedding error | Native min determinant | Full min determinant |','|---|---:|---:|---:|---:|']
for name,r in verify['models'].items():
 a,b=r['profiles']['srgb'],r['profiles']['full'];lines.append(f"| {name} | {a['maxEmbeddingError']:.4g} | {b['maxEmbeddingError']:.4g} | {a['minDet']:.6g} | {b['minDet']:.6g} |")
lines+=['','The Python training equations were separately compared against JavaScript, and the implicit inverse derivative was checked by finite differences. This verifies the training math, not the psychophysical validity of its synthetic targets.','','Inherited limitations: full is still the polygonized physical solid with relative Y<=1. Canonical P3 remains explicitly outside that polygon at red; this pass does not claim new P3 support. High-magnitude hue continuation is retained and separately counted by the benchmark adapter. Source/white/neutral/hue definitions were not refitted.','','## Records','','PLAN.md was committed before optimization. All five trial recipes and final coefficient arrays are retained in the downloadable review bundle; per-evaluation JSONL traces are preserved there and hashed in trials/registry.json. They are actual logs of this turn, not reconstructed logs from the previous interruptions. The differentiable grid is reproducible through cache.mjs and not required by the runtime library.','','Frozen selection:','','```json',json.dumps(selection,indent=2),'```','','Pinned ColorBench: `12b2de215cc5020682e3d245a8c78bce5f0ebbc9`. Pinned pool: `8641f4e8ebd9d85a34dc0fedc116fa0e58493190`.','']
if (P/'FINDINGS.md').exists():lines += ['',(P/'FINDINGS.md').read_text()]
(R/'REPORT.md').write_text('\n'.join(lines));(R/'site-data.json').write_text(json.dumps(site,indent=2)+'\n')
print('Report and four-way site evidence compiled.')
