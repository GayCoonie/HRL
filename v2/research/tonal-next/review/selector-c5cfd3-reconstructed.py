"""Reduce completed raw audits to the predeclared, readable comparison receipt."""
from pathlib import Path
import argparse,json,hashlib,datetime
p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);p.add_argument('--candidate',action='append',required=True);p.add_argument('--out',required=True);a=p.parse_args()
receipts=[Path(a.baseline),*map(Path,a.candidate)]
x=[json.loads(p.read_text()) for p in receipts]
assert all(r['status']=='completed' for r in x)
allmodels={k:v for r in x[1:] for k,v in r['models'].items()};baseline=x[0]['models']['metric']
models={};selection={}
for name,m in {'beta1':baseline,**allmodels}.items():
 for g,z in m['profiles'].items():
  models[name+'-'+g]={'retained_combvd':z['retained'],'tonal':{'blueSheetMean':z['sheet']['globalRegular']['blueMean'],**{f+'CV':z['paths']['globalRegular'][f]['meanCV'] for f in ['black','white','exchange','reach']}},'recordSHA256':m['sha256'],'mappedAllInput':z.get('mappedAllInput')}
 if name=='beta1':continue
 improvement=1-models[name+'-srgb']['tonal']['blueSheetMean']/models['beta1-srgb']['tonal']['blueSheetMean']
 guards=[]
 for g in ['srgb','full']:
  now,base=models[name+'-'+g],models['beta1-'+g]
  d=now['retained_combvd']['weighted']-base['retained_combvd']['weighted'];guards.append({'metric':g+' weighted STRESS delta','value':d,'maximum':.15,'pass':d<=.15})
  for f in ['black','white','exchange','reach']:
   ratio=now['tonal'][f+'CV']/base['tonal'][f+'CV'];guards.append({'metric':g+' '+f+' CV ratio','value':ratio,'maximum':1.03,'pass':ratio<=1.03})
 selection[name]={'blueBendingImprovementFraction':improvement,'blueImprovementPass':improvement>=.05,'guards':guards,'eligible':improvement>=.05 and all(q['pass'] for q in guards)}
eligible=[k for k,v in selection.items() if v['eligible']]
selected=max(eligible or list(selection),key=lambda k:selection[k]['blueBendingImprovementFraction'])
status='eligible' if eligible else 'no-eligible-candidate'
note='This research candidate meets the declared smoothness and accuracy checks. Beta 1 remains the frozen default.' if eligible else 'Neither research candidate meets every declared improvement check. Beta 1 remains the default; the measured tradeoffs are available for inspection.'
out={'schemaVersion':1,'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'selectedCandidate':selected,'status':status,'selectionNote':note,'models':models,'selection':selection,'limits':['COMBVD is reused development/training data, not held-out validation.','Native retained3331 and full3813 differ; mapped native3813 is a separate pipeline.','Path CV and blue sheet bending are synthetic GenSpace diagnostics, not observer preference scores.','Finite sampled contracts and conditioning do not prove whole-domain behavior.'],'receiptSHA256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in receipts}}
Path(a.out).parent.mkdir(parents=True,exist_ok=True);Path(a.out).write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'status':status,'selectedCandidate':selected,'selection':selection},indent=2))
