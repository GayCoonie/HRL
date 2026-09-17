"""Compile score and visual evidence without ranking incompatible datasets."""
from pathlib import Path
import json
import numpy as np
HERE=Path(__file__).resolve().parent;R=HERE/'results'
load=lambda n:json.loads((R/n).read_text())
bench=load('colorbench.json');audit=load('audit-old-balanced-balanced-metric.json')
ids=['old-balanced','balanced','metric'];labels=['Previous separate balanced','Shared dark-edge balanced','Shared metric-leaning']
site={'profiles':{},'definition':'Shared coefficients, deterministic own-gamut geometry; no learned gamut identity.'}
lines=['# Shared R/L and dark-edge refinement: executed results','','The pre-fit plan is retained in `../PLAN.md`; literature roles are in `../EVIDENCE.md`, and trial history and limitations in `../EXECUTION.md`.','','## Main tradeoff','','One R/L bank operates across native sRGB, the full relative-Y solid, and an untrained third gamut. The balanced candidate is substantially darker on the low-Level black-to-vivid edge, particularly native blue. **COMBVD is worse than the separately fitted predecessors. Whole-sheet regularity is mixed, not uniformly improved.**','','COMBVD was fitted; no other observer dataset enters this continuation objective. A first scored round and earlier development exposure remain disclosed. This is not pristine external validation. All scores use the actual bicone embedding.','','## COMBVD: identical retained pairs, no clipping','','| Realization | Candidate | Weighted STRESS | Unweighted STRESS | Pairs |','|---|---|---:|---:|---:|']
for g in ['srgb','full']:
 vis=load(f'visual-{g}-dense-old-balanced-balanced-metric.json')['models'];profile={'models':{},'edge':{}};site['profiles'][g]=profile
 for id,label in zip(ids,labels):
  m=bench['models'][id+'-'+g];c=m['combvd'];v=vis[id]['summary'];a=audit['models'][id][g];assert c['audit']['mapped']==0
  lines.append(f"| {g} | {label} | {c['traditional_weighted']:.6f} | {c['unweighted']:.6f} | {c['retained']}/{c['total']} |")
  value={'weighted':c['traditional_weighted'],'unweighted':c['unweighted'],'pairs':c['retained'],'visual':v,'edge':{k:v for k,v in a.items() if k!='rows'}}
  for board in ['generation','measurement']:
   value[board]={}
   for k,r in m[board].items():
    au=r.get('audit',{});value[board][k]={'score':r['score'],'exact':r['exact_input_support'],'mapped':au.get('mapped',0),'rejected':au.get('rejected',r.get('total',0)-r.get('retained',0)),'continued':au.get('continued',0)}
    for t in ['retained','total']:
     if t in r:value[board][k][t]=r[t]
  key='baseline' if id=='old-balanced' else id;profile['models'][key]=value;profile['edge'][key]=a['edgeQuarterMean']
lines+=['','Native retains the same 3,331 supported pairs; full retains all 3,813. These are ColorBench-preprocessed inputs, not the legacy exact-HRL-white convention.','','## Common and full-only COMBVD','','| Candidate | Realization / subset | Pairs | Weighted STRESS |','|---|---|---:|---:|']
def stress(d,v,w):return float(100*np.sqrt(max(0,1-np.sum(w*d*v)**2/(np.sum(w*d*d)*np.sum(w*v*v)))))
for id,label in zip(ids,labels):
 n=np.load(R/f'{id}-srgb-combvd.npz');f=np.load(R/f'{id}-full-combvd.npz');common=n['retained'];extra=f['retained']&~common
 for desc,a,mask in [('srgb / common',n,common),('full / common',f,common),('full / full-only',f,extra)]:lines.append(f"| {label} | {desc} | {int(mask.sum())} | {stress(a['de'][mask],a['dv'][mask],a['weights'][mask]):.6f} |")
lines+=['','## Dark edge and conditioning','','The edge statistic is Oklab lightness divided by the lightness of the same hue/gamut ray endpoint, not the definition of Level. Curves use 72 hues, four ratios R/L, and 129 samples through actual XYZ without display clipping. Blue means H=260 through 295 degrees at five-degree intervals.','','| Realization | Candidate | Mean at R=L=.25 | Blue mean at .25 | Mean edge step jump | Min determinant | Worst condition number |','|---|---|---:|---:|---:|---:|---:|']
for g in ['srgb','full']:
 for id,label in zip(ids,labels):
  a=audit['models'][id][g];lines.append(f"| {g} | {label} | {a['edgeQuarterMean']:.6f} | {a['blueQuarterMean']:.6f} | {a['edgeMeanJump']:.6f} | {a['minDet']:.6g} | {a['maxCondition']:.3f} |")
lines+=['','Jacobians are normalized source R/L to final R/L at 900 interior samples, excluding the black singularity. The previous fits also have positive sampled determinants: apparent folds were not proof of a negative Jacobian. Local Y decreases remain and are separately counted in the raw audit.','','## Actual generated-path check','','48 interleaved hues; 288 Reach and 288 Level ramps per realization; 257 samples each. Fitting used an interpolated surrogate, but these diagnostics use the actual inverse.','','| Realization | Candidate | Reach CV | Level CV | Reach step jump | Level step jump |','|---|---|---:|---:|---:|---:|']
for g in ['srgb','full']:
 for key,label in zip(['baseline','balanced','metric'],labels):
  v=site['profiles'][g]['models'][key]['visual'];lines.append(f"| {g} | {label} | {v['reach']['mean_cv']:.6f} | {v['level']['mean_cv']:.6f} | {v['reach']['mean_step_jump']:.6f} | {v['level']['mean_step_jump']:.6f} |")
lines+=['','Darker edges do not imply every interior metric improves. Full blue retains inherited trajectory irregularities. The metric alternate is rougher than balanced and is not presented as a universal visual improvement.','','## Scored ColorBench panels','','Only five generation and sixteen measurement columns were run. No unscored appearance, application, ordinal or physics-gate suite was added. † = mapped input; ‡ = incomplete strict support. N/A is not zero.']
def fmt(v):
 s=v['score'];a=v.get('audit',{});mark=' †' if a.get('mapped',0) else ' ‡' if not v['exact_input_support'] else ''
 return 'N/A' if s is None else f'{s:.6f}'+mark
for g in ['srgb','full']:
 lines+=['',f'### {g}: strict inputs','','| Dataset | Previous separate | Shared balanced | Shared metric |','|---|---:|---:|---:|']
 for board in ['generation','measurement']:
  for k in bench['models']['old-balanced-'+g][board]:lines.append('| '+k+' | '+' | '.join(fmt(bench['models'][id+'-'+g][board][k]) for id in ids)+' |')
lines+=['','### Full: explicitly clipped pipeline','','| Dataset | Shared balanced / clip | Shared metric / clip |','|---|---:|---:|']
for board in ['generation','measurement']:
 for k in bench['models']['balanced-full-clip'][board]:lines.append('| '+k+' | '+' | '.join(fmt(bench['models'][id+'-full-clip'][board][k]) for id in ['balanced','metric'])+' |')
lines+=['','## Invariants and scope','','`verification.json` records exact round-trips, neutral/vivid/hue preservation, one-bank identity, and an untrained Adobe RGB (1998) linear-RGB realization. `source-gamut-verification.json` records regeneration of both source caches with the same algorithm. Canonical P3 red lies slightly outside the inherited polygon and is explicitly rejected, not silently clipped.','','The full solid remains the physical polygon over 0<=relative Y<=1. The 300-nit context and relative 100-nit invariance are retained. High-magnitude hue continuation remains a declared limitation, not new observer evidence.','','## Frozen selection','','```json',json.dumps(load('SELECTION.json'),indent=2),'```','',f"ColorBench `{bench['colorbench_commit']}`; pool `{bench['pool_commit']}`. Full runtime source hashes and versions are in `colorbench.json`."]
(R/'site-data.json').write_text(json.dumps(site,indent=2)+'\n');(R/'REPORT.md').write_text('\n'.join(lines)+'\n')
print('Compiled report, overlap checks and site data')
