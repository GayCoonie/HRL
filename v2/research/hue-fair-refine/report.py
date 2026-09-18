"""Report actual scored and direct-output results; no new observer evidence or composite rank."""
from pathlib import Path
import json,hashlib,numpy as np
P=Path(__file__).resolve().parent;R=P/'results';load=lambda p:json.loads((R/p).read_text())
b=load('colorbench.json');d=load('direct-final.json');s=load('sheet-final.json');v=load('verification.json');sel=load('SELECTION.json')
ids=['parent','balanced','gentle'];labels=['0.11 Gen tonal balanced','Refined balanced','Lighter regularization'];families=['black','white','exchange','reach'];site={'profiles':{},'selection':sel}
lines=['# HRL 0.12: balanced-parent hue-sheet refinement','','This is a new, fully logged continuation of Gen tonal balanced. It keeps one learned bank across gamuts and adds per-hue risk and whole-sheet regularity to the GenSpace tonal fit. Previous models are unchanged. The original interrupted transfer did not preserve its selected trial arrays; these are new runs, not invented reconstruction of those missing logs. See RECOVERY.md and the preserved PLAN.md.','','## Actual COMBVD','','Traditional weighted STRESS, same ColorBench-prepared pairs and source adaptation. COMBVD is fitted, not independent validation. Lower is better.','','| Candidate | Native weighted | Native unweighted | Full weighted | Full unweighted |','|---|---:|---:|---:|---:|']
for id,label in zip(ids,labels):
 a=b['models'][id+'-srgb']['combvd'];f=b['models'][id+'-full']['combvd'];lines.append(f"| {label} | {a['traditional_weighted']:.6f} | {a['unweighted']:.6f} | {f['traditional_weighted']:.6f} | {f['unweighted']:.6f} |")
 for g in ['srgb','full']:
  z=b['models'][id+'-'+g]['combvd'];assert z['audit']['mapped']==0;assert abs(z['traditional_weighted']-d['models'][id][g]['scores']['weighted'])<1e-6
  if id!='parent':
   rec=load(id+'.json');assert abs(z['traditional_weighted']-rec['research']['stats'][g]['stress'])<1e-6
lines+=['','Native: 3,331 supported pairs. Full: all 3,813 pairs. No COMBVD clipping and no change in retained masks. The two gamut totals have different support and are not a same-stimulus comparison.','','## Exact-runtime tonal paths','','All controls and candidates use identical samples through the real inverse, not the differentiable fit lookup. GenSpace is the external model-based ruler, not a definition of Level or a source of new observer ratings. R is chromaticness; K=1-L; W=L-R. Black dilution, white dilution, neutral exchange and Reach paths stay distinct.','','| Gamut | Candidate | Black CV | White CV | Neutral-exchange CV | Reach CV |','|---|---|---:|---:|---:|---:|']
for g in ['srgb','full']:
 site['profiles'][g]={'models':{},'perHue':[]}
 for id,label in zip(ids,labels):
  z=b['models'][id+'-'+g];c=z['combvd'];x=d['models'][id][g];m={'weighted':c['traditional_weighted'],'unweighted':c['unweighted'],'pairs':c['retained'],'visual':x['summaries'],'edge':x['edge'],'sheet':{k:y for k,y in s['models'][id][g].items() if k!='rows'}}
  lines.append('| '+g+' | '+label+' | '+' | '.join(f"{x['summaries'][f]['meanCV']:.6f}" for f in families)+' |')
  for board in ['generation','measurement']:
   m[board]={}
   for key,r in z[board].items():
    a=r.get('audit',{});m[board][key]={'score':r['score'],'exact':r['exact_input_support'],'mapped':a.get('mapped',0),'rejected':a.get('rejected',r.get('total',0)-r.get('retained',0)),'continued':a.get('continued',0)}
  site['profiles'][g]['models'][id]=m
 for i,row in enumerate(d['models']['parent'][g]['rows']):
  item={'H':row['H']}
  for id in ids:
   rr=d['models'][id][g]['rows'][i];item[id]=float(np.mean([p['cv'] for f in families for p in rr[f]]))
  site['profiles'][g]['perHue'].append(item)
lines+=['','CV is standard deviation of step lengths divided by their mean. Step jumps, reversals, and whole-sheet bending are separate measurements. A lower average does not prove all hues improved.','','### Hue-by-hue and whole-sheet checks','','The nine-point sheet stencil transforms derivatives to x=sqrt(3)R/2 and z=L-R/2 before computing the vector Hessian/gradient ratio at reference scale 1/32. These are synthetic numerical checks, not perceptual folds diagnosed from screenshots.','','| Gamut | Candidate | Hues with lower path CV / total | Mean sheet bending | 95th-percentile hue bending | Blue-region mean bending |','|---|---|---:|---:|---:|---:|']
for g in ['srgb','full']:
 for id,label in zip(ids,labels):
  rows=site['profiles'][g]['perHue'];count=sum(r[id]<r['parent'] for r in rows);x=s['models'][id][g]
  lines.append(f"| {g} | {label} | {'control' if id=='parent' else str(count)+'/'+str(len(rows))} | {x['mean']:.6f} | {x['p95Hue']:.6f} | {x['blueMean']:.6f} |")
lines+=['','Blue in this summary means H=255 through 295 degrees on the declared sample grid. The preview additionally inspects 273, 275 and 277 degrees, not only a round-number blue. Residual structures in those narrow sheets must not be hidden by aggregate gains.','','### Step jumps, corner retreats and dark-edge progress','','| Gamut | Candidate | Black step jump | White step jump | White retreat paths | Mean white retreat fraction | Gen L / vivid Gen L at R=L=.25 |','|---|---|---:|---:|---:|---:|---:|']
for g in ['srgb','full']:
 for id,label in zip(ids,labels):
  x=d['models'][id][g];k,w=x['summaries']['black'],x['summaries']['white'];lines.append(f"| {g} | {label} | {k['meanStepJump']:.6f} | {w['meanStepJump']:.6f} | {w['cornerRetreatPaths']}/{w['totalPaths']} | {w['meanRetreatFraction']:.8f} | {x['edge']['quarterGenLightness']:.6f} |")
hues=[r['H'] for r in d['models']['parent']['srgb']['rows']];overlap=sum(any(abs(h-3.75*i)<1e-8 for i in range(96)) for h in hues)
lines+=['',f"Path sampling: {d['hues']} hues, offset {d['hueOffset']} degrees, {d['samples']} samples per path, 20 paths per hue, three models and two gamuts. {overlap} sampled hues coincide with the 96-hue training grid. Numerical out-of-grid checks are not independent observer validation. Sheet sampling: {s['hues']} hues and {s['stencilsPerHue']} stencils per hue. No output clipping enters these calculations.",'','## Scored ColorBench','','Only five scored generation and sixteen scored measurement columns. The judges, bicone embedding and support policies are unchanged. A dagger denotes incomplete or changed input support. N/A is unavailable, never zero. Full clipping is reported as a separate pipeline.']
fmt=lambda r:'N/A' if r['score'] is None else f"{r['score']:.6f}"+('' if r['exact_input_support'] else ' †')
for g in ['srgb','full']:
 lines+=['',f'### {g}, strict inputs','','| Test | Parent | Refined | Lighter regularization |','|---|---:|---:|---:|']
 for board in ['generation','measurement']:
  for key in b['models']['parent-'+g][board]:lines.append('| '+key+' | '+' | '.join(fmt(b['models'][id+'-'+g][board][key]) for id in ids)+' |')
lines+=['','### Full, explicitly clipped inputs','','| Test | Refined | Lighter regularization |','|---|---:|---:|']
for board in ['generation','measurement']:
 for key in b['models']['balanced-full-clip'][board]:lines.append('| '+key+' | '+' | '.join(fmt(b['models'][id+'-full-clip'][board][key]) for id in ids[1:])+' |')
lines+=['','## Same-pair and full-only COMBVD','','| Candidate | Realization/subset | Pairs | Weighted STRESS |','|---|---|---:|---:|']
def stress(dv,v,w):return 100*np.sqrt(max(0,1-(w*dv*v).sum()**2/((w*dv*dv).sum()*(w*v*v).sum())))
for id,label in zip(ids,labels):
 n=np.load(R/f'{id}-srgb-combvd.npz');f=np.load(R/f'{id}-full-combvd.npz');common=n['retained'];extra=f['retained']&~common
 for desc,a,mask in [('native/common',n,common),('full/common',f,common),('full/full-only',f,extra)]:lines.append(f"| {label} | {desc} | {int(mask.sum())} | {stress(a['de'][mask],a['dv'][mask],a['weights'][mask]):.6f} |")
lines+=['','## Invariants and record','','Actual JS tests check random and near-black inverses, exact 16-bit conversions, hue labels, neutral progression, vivid anchors, positive sampled coordinate Jacobians and conditioning, circular continuity, shared-bank identity and an untrained Adobe RGB realization. Full is still the inherited polygonized cone with relative Y<=1; canonical P3 remains outside the current polygon at red. No boundary, source-white or hue-field changes are claimed.','','Detailed receipts: verification.json, python-js-parity.json, direct-final.json, sheet-final.json, and colorbench.json. A runner-browser pass is not a public Pages pass; public verification has its own receipt. All new trial arrays and evaluation JSONL logs are retained under trials/. Historical interrupted drafts are only under recovery/.','','```json',json.dumps(sel,indent=2),'```','',f"Pinned ColorBench: {b['colorbench_commit']}. Pool: {b['pool_commit']}. Prior development exposed these evaluation datasets; no pristine external validation or overall leaderboard rank is claimed."]
(R/'REPORT.md').write_text('\n'.join(lines)+'\n');(R/'site-data.json').write_text(json.dumps(site,indent=2)+'\n')
(P/'README.md').write_text('''# HRL 0.12: balanced-parent hue-sheet refinement

This continuation starts from the actual 0.11 Gen tonal balanced checkpoint. It adds per-hue mean/RMS risk, an equilateral whole-sheet bending penalty and additional blue-region attention, using the frozen HelmLab GenSpace ruler. One six-layer coefficient bank per candidate applies across gamuts. R is chromaticness, K=1-L and W=L-R; Level is not scalar lightness.

The recovered original fitter is preserved as fit-v1.py and fit-v2.py. New fits resume-a and resume-b use fit.py with an explicit soft per-gamut COMBVD ceiling. All new trial coefficients and JSONL objective logs are committed. They are not reconstructions of lost fair-c/fair-d arrays. RECOVERY.md distinguishes recovered sources from new experiments.

[Live comparison](../../hue-fair.html) | [Actual results](results/REPORT.md) | [Preserved plan](PLAN.md) | [Evidence and equations](EVIDENCE.md) | [Recovery](RECOVERY.md)

```js
import {createHueFairHRL, ADOBE_RGB1998} from './index.mjs';
const native = await createHueFairHRL({gamut:'srgb',checkpoint:'balanced'});
const full = await createHueFairHRL({gamut:'full',checkpoint:'balanced'});
const third = await createHueFairHRL({gamut:ADOBE_RGB1998,checkpoint:'balanced'});
```

The gentle candidate has lighter regularization, not necessarily lighter colours. Existing entry points and model coefficients remain unchanged. Actual inverse tests, scored-only ColorBench and UI checks are separate receipts. GenSpace and whole-sheet derivatives are synthetic diagnostics, not new observer ratings. User feedback motivates the blue weight; no per-hue user-preference table is invented. The inherited source-field and physical-polygon limitations remain.

The completion workflow contains exact commands and pinned versions. The large source grids can be rebuilt from cache.mjs and are not required by the runtime. Use the frozen model records for reproducing published numbers; rerunning optimization creates new log timestamps and may vary slightly across hardware.
''')
print('Compiled real scores, per-hue evidence and report')
