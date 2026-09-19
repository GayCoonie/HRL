from pathlib import Path
import json,copy,subprocess,hashlib,sys,datetime
scratch=Path('/workspace/scratch/20abb8fd27ac/hrl-optimization')
repo=scratch.parent/'hrl-v2-next'
script=repo/'v2/research/tonal-next/make-comparison.py'
baseline=json.loads((scratch/'audit-baseline.json').read_text())
def small(m):
 return {'sha256':m['sha256'],'profiles':{g:{'retained':p['retained'],'paths':{'globalRegular':p['paths']['globalRegular']},'sheet':{'globalRegular':p['sheet']['globalRegular'],'critical':p['sheet']['critical']},**({'mappedAllInput':p['mappedAllInput']} if 'mappedAllInput' in p else {})} for g,p in m['profiles'].items()}}
base={'schema':baseline['schema'],'status':'completed','models':{'metric':small(baseline['models']['metric'])},'syntheticReviewFixture':True}
fixtures={};expected={}
def candidate(name,blue=.06,stress=0,cv=1):
 m=copy.deepcopy(base['models']['metric']);m['sha256']='synthetic-review-'+name
 for g,p in m['profiles'].items():
  p['retained']['weighted']+=stress
  for f in ['black','white','exchange','reach']:p['paths']['globalRegular'][f]['meanCV']*=cv
 m['profiles']['srgb']['sheet']['globalRegular']['blueMean']*=1-blue
 fixtures[name]=m;expected[name]=True
 return m
candidate('threshold_pass',.05,.15,1.03)
candidate('just_inside',.05000001,.14999999,1.02999999)
m=candidate('blue_fail',.04999999);expected['blue_fail']=False
for g in ['srgb','full']:
 m=candidate(g+'_stress_fail');m['profiles'][g]['retained']['weighted']+=.15000001;expected[g+'_stress_fail']=False
 for f in ['black','white','exchange','reach']:
  name=g+'_'+f+'_fail';m=candidate(name);m['profiles'][g]['paths']['globalRegular'][f]['meanCV']*=1.03000001;expected[name]=False
m=candidate('critical_independent');m['profiles']['srgb']['sheet']['critical']['mean']=1e9
m=candidate('mapped_independent');m['profiles']['srgb']['mappedAllInput']['weighted']=1e9
basepath=scratch/'review-runtime-gate-baseline.json';candpath=scratch/'review-runtime-gate-candidates.json';outpath=scratch/'review-runtime-gate-output.json'
basepath.write_text(json.dumps(base));candpath.write_text(json.dumps({'schema':baseline['schema'],'status':'completed','models':fixtures,'syntheticReviewFixture':True}))
cmd=[sys.executable,str(script),'--baseline',str(basepath),'--candidate',str(candpath),'--out',str(outpath)]
r=subprocess.run(cmd,text=True,capture_output=True);assert r.returncode==0,r.stderr
out=json.loads(outpath.read_text());actual={k:v['eligible'] for k,v in out['selection'].items()};assert actual==expected,(actual,expected)
assert all(len(v['guards'])==10 for v in out['selection'].values())
assert out['models']['beta1-full']['mappedAllInput'] is None
assert out['models']['beta1-srgb']['retained_combvd']['pairs']==3331
assert out['models']['beta1-full']['retained_combvd']['pairs']==3813
assert out['models']['beta1-srgb']['mappedAllInput']['pairs']==3813
assert out['models']['beta1-srgb']['mappedAllInput']['mappedPairs']==482
for name in actual:
 for g in ['srgb','full']:
  m=fixtures[name]['profiles'][g];b=base['models']['metric']['profiles'][g]
  stress=m['retained']['weighted']-b['retained']['weighted']<=.15
  cv=all(m['paths']['globalRegular'][f]['meanCV']/b['paths']['globalRegular'][f]['meanCV']<=1.03 for f in ['black','white','exchange','reach'])
  assert all(q['pass'] for q in out['selection'][name]['guards'] if q['metric'].startswith(g+' '))==(stress and cv)
receipt={'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':cmd,'exitCode':r.returncode,'scriptSHA256':hashlib.sha256(script.read_bytes()).hexdigest(),'syntheticTestsOnly':True,'caseCount':len(actual),'actualEligible':actual,'allExpectedMatched':True,'guardsPerCandidate':10,'mappedFullNull':True,'populationCounts':{'nativeRetained':3331,'fullRetained':3813,'nativeMappedAllInput':3813,'nativeMappedPairs':482},'thresholdPass':out['selection']['threshold_pass']}
(scratch/'review-runtime-gate-evidence.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt,indent=2))
