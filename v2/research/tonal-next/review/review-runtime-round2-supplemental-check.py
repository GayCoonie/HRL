from pathlib import Path
import hashlib,json,math,datetime
import numpy as np
ROOT=Path('/workspace/scratch/20abb8fd27ac'); OUT=ROOT/'hrl-optimization'; SRC=ROOT/'hrl-v2-next/v2/research'
checks=0; failures=[]; max_scaled_error=0.; hash_checks=[]; receipt_hashes={}; edge_results={}; cond_results={}
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def check(ok,label,details=None):
 global checks
 checks+=1
 if not ok: failures.append({'check':label,'details':details})
def eq(a,b,label,atol=1e-12,rtol=1e-12):
 global max_scaled_error
 if isinstance(a,dict):
  check(set(a)==set(b),label+'.keys',{'actual':list(a),'expected':list(b)})
  for k in set(a)&set(b):eq(a[k],b[k],label+'.'+k,atol,rtol)
 elif isinstance(a,list):
  check(len(a)==len(b),label+'.length')
  for i,(x,y) in enumerate(zip(a,b)):eq(x,y,label+f'[{i}]',atol,rtol)
 elif isinstance(a,(float,int)) and not isinstance(a,bool):
  err=abs(a-b);max_scaled_error=max(max_scaled_error,err/max(1,abs(b)))
  check(math.isfinite(a) and math.isfinite(b) and err<=atol+rtol*abs(b),label,{'actual':a,'expected':b,'absError':err})
 else: check(a==b,label,{'actual':a,'expected':b})
def hashcheck(p,h,label):
 actual=sha(p);hash_checks.append({'label':label,'path':str(p),'recorded':h,'actual':actual,'matches':actual==h});check(actual==h,label)
def load_receipt(name):
 p=OUT/name;receipt_hashes[str(p)]=sha(p);return json.loads(p.read_text())
def mean(v):return sum(v)/len(v)
def quant(v,p):return sorted(v)[math.floor(p*(len(v)-1))]
regular=list(range(1,357,5));critical=[263,269,273,275,277,281,285,293];hues=sorted(set(regular+critical))
centres=[(L*U,L,U) for L in [.02,.3] for U in [.18,.4,.65,.84,.94,.985]]+[(L*U,L,U) for L in [.04,.08,.12,.18] for U in [.94,.985]]
offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
stencils=[]
for R,L,U in centres:
 radius=min(1/64,R/2,(L-R)/3,(1-L)/2);stencils.append({'R':R,'L':L,'U':U,'radius':radius,'points':[{'R':R+a*radius,'L':L+b*radius} for a,b in offsets]})
historical=[(R/16,L/16) for L in range(2,16) for R in range(1,L)]+[(L*U,L) for L in [.04,.08,.12,.18] for U in [.18,.4,.65,.84]]
check(len(historical)==121,'historical_centres_count')
check(not set((R,L) for R,L,U in centres)&set(historical),'edge_centres_disjoint_from_historical121')
manifest_path=SRC/'boundary-tonal/results/colorbench.json';manifest=json.loads(manifest_path.read_text())['frozen_source_hashes']
check(len(manifest)==148,'frozen_manifest_count')
for p,h in manifest.items():hashcheck(SRC/'boundary-tonal'/p,h,'frozen_manifest:'+p)
candidate_identity={}
for label in ['sheet-raw','sheet-robust']:
 d=load_receipt('audit-edge-'+label+'.json');check(d['status']=='completed',label+'.completed');check(d['schema']=='hrl-tonal-next-edge-audit-v1',label+'.schema')
 eq(d['frozenIdentity'],{'checked':148,'mismatches':[]},label+'.frozenIdentity')
 for p,h in d['hashes'].items():hashcheck(p,h,label+'.source:'+p)
 hashcheck(d['baseline']['file'],d['baseline']['sha256'],label+'.baseline')
 eq(d['sampling'],{'regularHues':regular,'criticalHues':critical,'uniqueHues':hues,'stencils':stencils,'offsets':offsets,'referenceScale':1/32,'stencilsPerGamut':1580,'xyzEvaluationsPerGamut':14220},label+'.sampling')
 check(set(d['models'])=={label},label+'.models');model=d['models'][label];hashcheck(model['file'],model['sha256'],label+'.record');check(model['isFrozenMetric']==False,label+'.isFrozenMetric')
 main=load_receipt('audit-'+label+'.json')['models'][label]
 eq(main['file'],model['file'],label+'.mainRecordPath');eq(main['sha256'],model['sha256'],label+'.mainRecordHash');candidate_identity[label]={'file':model['file'],'sha256':model['sha256']}
 check(set(model['profiles'])=={'srgb','full'},label+'.profiles');edge_results[label]={}
 for gamut,p in model['profiles'].items():
  rows=p['rows'];eq([r['H'] for r in rows],hues,label+'.'+gamut+'.hues')
  for r in rows:
   v=r['values'];check(len(v)==20 and all(math.isfinite(x) and x>=0 for x in v),label+'.'+gamut+f'.{r["H"]}.values')
   eq({k:r[k] for k in ['mean','rms','p95','max']},{'mean':mean(v),'rms':math.sqrt(mean([x*x for x in v])),'p95':quant(v,.95),'max':max(v)},label+'.'+gamut+f'.{r["H"]}.summary')
  for group,hs in [('regular',regular),('critical',critical)]:
   subset=[r for r in rows if r['H'] in hs];v=[r['mean'] for r in subset];expected={'hues':len(v),'mean':mean(v),'rms':math.sqrt(mean([x*x for x in v])),'p95Hue':quant(v,.95),'worstHue':max(v),'maxStencil':max(x for r in subset for x in r['values'])};eq(p[group],expected,label+'.'+gamut+'.'+group)
  worst=max(((v,r['H'],i) for r in rows for i,v in enumerate(r['values'])))
  edge_results[label][gamut]={'regular':p['regular'],'critical':p['critical'],'maxStencilLocation':{'value':worst[0],'H':worst[1],'stencilIndex':worst[2],'centre':stencils[worst[2]]},'rows':len(rows),'values':sum(len(r['values']) for r in rows)}
d=load_receipt('conditioning-sheet-candidates.json');check(d['nodeExit']==0,'conditioning.nodeExit')
for p,h in d['sourceHashes'].items():hashcheck(p,h,'conditioning.source:'+p)
check(set(d['models'])=={'parent','balanced','metric','sheet-raw','sheet-robust'},'conditioning.models')
points=[];point_index={}
def add(q,label):
 key=tuple(float(x) for x in q)
 if key not in point_index:point_index[key]=len(points);points.append({'id':len(points),'q':list(key),'labels':[]})
 points[point_index[key]]['labels'].append(label)
historic=json.loads((SRC/'boundary-tonal/results/conditioning-same-grid.json').read_text())
for name in ['parent','balanced','metric']:
 q=historic['models'][name]['worst']['q'];add([q['H'],q['R'],q['L']],'historical-'+name+'-maximum')
chues=[30,90,156,216,263,269,273,275,277,281,285,293,330];levels=[.001,.02,.05,.25,.5,.95];ratios=[.05,.5,.95,.999];factors=[1e-2,1e-3,1e-4,1e-5,1e-6]
for H in chues:
 for L in levels:
  for U in ratios:add([H,L*U,L],'control-grid')
 add([H,.5*.001,.5],'near-neutral-control')
for k,v in [('samplesPerModel',325),('hues',chues),('levels',levels),('ratios',ratios),('stepFactors',factors)]:eq(d[k],v,'conditioning.'+k)
A=np.array([[math.sqrt(3)/2,0],[-.5,1.]]);Ai=np.linalg.inv(A);eq(d['basisMatrix'],A.tolist(),'conditioning.basis')
def measure(E):
 singular=np.linalg.svd(E,compute_uv=False);check(bool(np.isfinite(singular).all() and singular[-1]>0),'matrix.valid_singular')
 return {'equilateralJacobian':E.tolist(),'singularValues':singular.tolist(),'condition':float(singular[0]/singular[-1]),'logCondition':float(np.log(singular[0]/singular[-1])),'determinant':float(np.linalg.det(E))}
def comparison(value,reference):
 E=np.asarray(value['equilateralJacobian']);F=np.asarray(reference['equilateralJacobian'])
 return {'scaledJacobianError':float(np.max(np.abs(E-F))/max(1.,np.max(np.abs(F)))),'logConditionError':abs(value['logCondition']-reference['logCondition']),'relativeConditionError':abs(value['condition']/reference['condition']-1),'relativeDeterminantError':abs(value['determinant']/reference['determinant']-1)}
for name,model in d['models'].items():
 hashcheck(model['record'],model['recordSha256'],'conditioning.record:'+name)
 if name in candidate_identity:eq(model['recordSha256'],candidate_identity[name]['sha256'],name+'.conditioningRecordHash')
 rows=model['rows'];check(len(rows)==325,name+'.conditioning.rows')
 for row,point in zip(rows,points,strict=True):
  pre=name+f'.row{point["id"]}';eq({k:row[k] for k in ['id','q','labels']},point,pre+'.point');H,R,L=row['q']
  analytic=row['analytic'];automatic=row['autograd'];eq({k:analytic[k] for k in ['equilateralJacobian','singularValues','condition','logCondition','determinant']},measure(np.array(analytic['equilateralJacobian'])),pre+'.analytic_matrix',1e-10,1e-10)
  eq({k:automatic[k] for k in ['equilateralJacobian','singularValues','condition','logCondition','determinant']},measure(A@np.array(automatic['rawRLJacobian'])@Ai),pre+'.autograd_matrix',1e-10,1e-10)
  eq(analytic['vsAutograd'],comparison(analytic,automatic),pre+'.vsAutograd')
  eq(analytic['propagatedLogVsSvdError'],abs(analytic['propagatedLogCondition']-analytic['logCondition']),pre+'.propagatedLog')
  eq(analytic['propagatedDetVsSvdMatrixError'],abs(analytic['propagatedDeterminant']/analytic['determinant']-1),pre+'.propagatedDet')
  eq(row['forwardMaxAbsoluteDifference'],max(abs(x-y) for x,y in zip(row['pythonOutput'],row['javascriptOutput'],strict=True)),pre+'.forwardParity')
  check(len(row['numerical'])==5,pre+'.numerical_count')
  for item,factor in zip(row['numerical'],factors,strict=True):
   eq(item['factor'],factor,pre+'.factor');eq(item['h'],factor*min(R,L-R,1-L),pre+'.h');h=item['h'];check(0<R-h<R+h<L and 0<R<L-h<L+h<1,pre+'.legal_stencil')
   eq({k:item[k] for k in ['equilateralJacobian','singularValues','condition','logCondition','determinant']},measure(A@np.array(item['rawRLJacobian'])@Ai),pre+'.numerical_matrix',1e-10,1e-10)
   eq(item['vsAnalytic'],comparison(item,analytic),pre+'.vsAnalytic')
 maximum=lambda getter:max(getter(row) for row in rows)
 expected={'maxForwardAbsoluteDifference':maximum(lambda r:r['forwardMaxAbsoluteDifference']),'maxAnalyticAutogradScaledJacobianError':maximum(lambda r:r['analytic']['vsAutograd']['scaledJacobianError']),'maxAnalyticAutogradLogConditionError':maximum(lambda r:r['analytic']['vsAutograd']['logConditionError']),'maxAnalyticAutogradRelativeDeterminantError':maximum(lambda r:r['analytic']['vsAutograd']['relativeDeterminantError']),'maxPropagatedLogVsSvdError':maximum(lambda r:r['analytic']['propagatedLogVsSvdError']),'maxPropagatedDetVsSvdMatrixError':maximum(lambda r:r['analytic']['propagatedDetVsSvdMatrixError']),'maxAnalyticCondition':maximum(lambda r:r['analytic']['condition']),'minAnalyticDeterminant':min(r['analytic']['propagatedDeterminant'] for r in rows),'numericalByFactor':{str(f):{key:max(row['numerical'][i]['vsAnalytic'][key] for row in rows) for key in ['scaledJacobianError','logConditionError','relativeConditionError','relativeDeterminantError']} for i,f in enumerate(factors)},'historicalExtremeRows':[r['id'] for r in rows if any(s.startswith('historical') for s in r['labels'])]}
 eq(model['summary'],expected,name+'.conditioning.summary');s=expected
 gates={'forwardParity':s['maxForwardAbsoluteDifference']<1e-10,'analyticAutogradJacobian':s['maxAnalyticAutogradScaledJacobianError']<1e-8,'analyticAutogradLogCondition':s['maxAnalyticAutogradLogConditionError']<1e-6,'analyticAutogradDeterminant':s['maxAnalyticAutogradRelativeDeterminantError']<1e-7,'propagatedCondition':s['maxPropagatedLogVsSvdError']<1e-6,'propagatedDeterminant':s['maxPropagatedDetVsSvdMatrixError']<1e-7,'positiveDeterminants':s['minAnalyticDeterminant']>0}
 eq(d['implementationChecks'][name],gates,name+'.implementationChecks');check(all(gates.values()),name+'.implementationPass')
 worst=max(rows,key=lambda r:r['analytic']['condition']);cond_results[name]={'summary':s,'worstConditionPoint':worst['q'],'checks':gates}
result={'reviewUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Completed second-round supplemental receipts; main audits used only for model-record hash identity. No full audits, autograd, or runtime map re-execution.','checks':checks,'failures':failures,'maxScaledArithmeticDifference':max_scaled_error,'receiptHashes':receipt_hashes,'sourceAndRecordHashChecks':hash_checks,'edge':edge_results,'conditioning':cond_results,'counts':{'edgeRows':316,'edgeStencilValues':6320,'conditioningRows':1625,'conditioningNumericMatrices':8125,'conditioningAllMatrices':11375,'implementationChecks':35}}
p=OUT/'review-runtime-round2-supplemental-evidence.json';p.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n');print(json.dumps({'output':str(p),'checks':checks,'failures':len(failures),'hashChecks':len(hash_checks),'maxScaledArithmeticDifference':max_scaled_error,'firstFailures':failures[:10]},indent=2));raise SystemExit(bool(failures))
