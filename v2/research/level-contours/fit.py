"""Reconstructed shared physical-contour experiment. Observer scores are training.
Level contour coefficients depend on physical purity, not learned Reach spacing.
Finite-difference L-BFGS uses a physical GenSpace grid only for diagnostics; pair
coordinates and metric calculations use analytic transforms.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import argparse,copy,hashlib,json,time
import numpy as np
from scipy.optimize import minimize
from scipy.ndimage import map_coordinates,spline_filter
P=Path(__file__).resolve().parent; O=P/'results'
ap=argparse.ArgumentParser();ap.add_argument('--name',choices=['metric','strict'],required=True);ap.add_argument('--start',default='seed');ap.add_argument('--steps',type=int,default=180);args=ap.parse_args()
rec=json.loads((O/f'{args.start}.json').read_text());cache=json.loads((O/'cache.json').read_text());K=rec['harmonics'];shift=rec['neutral_shift'];H,N=cache['H']//2,cache['N']
codehash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
def features(h):
 t=np.asarray(h)*np.pi/180
 return np.stack([np.ones_like(t)]+[f(k*t) for k in range(1,K+1) for f in [np.cos,np.sin]],-1)
def warp(x,t):
 e=np.exp(-t);return x/(x+(1-x)*e)
def rawlevel(a):return np.where(a<=216/24389,24389*a/2700,(29*np.cbrt(a)-4)/25)
def cpower(s,c):return np.exp(s*s*2*np.tanh((c[...,0]+c[...,1]*(2*s-1))/2))
def cshift(s,c):return s*s*4*np.tanh((c[...,2]+c[...,3]*(2*s-1))/4)
def contour(L,s,c):return warp(warp(L,-shift)**cpower(s,c),cshift(s,c))
def rshift(L,c):
 v=2*L-1;return 6*np.tanh((c[...,4]+c[...,5]*v+c[...,6]*v*v)/6)
def forward(q,f,C):
 c=f@C.T;a=q[:,2];s=q[:,1]/np.maximum(a,1e-30);L=warp(warp(rawlevel(a),-cshift(s,c))**(1/cpower(s,c)),shift);U=warp(s,rshift(L,c));R=L*U;t=q[:,0]*np.pi/180
 return np.stack([np.sqrt(3)/2*R*np.cos(t),np.sqrt(3)/2*R*np.sin(t),L-R/2],-1)
profiles=[]
for g,p in cache['profiles'].items():
 p={k:np.asarray(p[k]) for k in ['a','b','dv','w']};p['gamut']=g
 p['fa']=features(p['a'][:,0]);p['fb']=features(p['b'][:,0])
 raw=(O/f'grid-{g}.f64').read_bytes();assert hashlib.sha256(raw).hexdigest()==cache['profiles'][g]['gridSHA256']
 J=np.frombuffer(raw,dtype='<f8').reshape(cache['H'],N,N,3)[::2,...,0];p['J']=spline_filter(J,order=3,mode='nearest');profiles.append(p)
levels=np.array([.005,.01,.02,.04,.08,.12,.2,.35,.55,.75,.95])
ss=np.unique(np.r_[np.linspace(0,.12,33),np.linspace(.12,.4,25),np.linspace(.4,1,33)])
hs=np.arange(H)*360/H;fc=features(hs)[:,None,None,:];sq=ss[None,None,:];Lq=levels[None,:,None]
hh=np.broadcast_to(np.arange(H)[:,None,None],(H,len(levels),len(ss)))
near=ss<=.25
def sample(p,s,l):
 shape=np.broadcast_shapes(s.shape,l.shape,hh.shape);s=np.broadcast_to(s,shape);l=np.broadcast_to(l,shape)
 coords=[hh.ravel(),(np.arccos(np.clip(1-2*l,-1,1))/np.pi*(N-1)).ravel(),(np.arccos(np.clip(1-2*s,-1,1))/np.pi*(N-1)).ravel()]
 return map_coordinates(p['J'],coords,order=3,mode='nearest',prefilter=False).reshape(shape)
def stress(d,v,w):return max(0,1-np.sum(w*d*v)**2/(np.sum(w*d*d)*np.sum(w*v*v)))
weight=2500. if args.name=='strict' else 12.
freq=np.array([1]+[k*k for k in range(1,K+1) for _ in [0,1]])
best=[float('inf'),None,None];start=time.monotonic();calls=0;trace=(O/f'{args.name}.jsonl').open('w')
def assess(x,log=False):
 global calls
 C=x.reshape(7,2*K+1);cs=fc@C.T;l=contour(Lq,sq,cs);total=0;stats={}
 for p in profiles:
  d=np.linalg.norm(forward(p['a'],p['fa'],C)-forward(p['b'],p['fb'],C),axis=-1)
  st=stress(d,p['dv'],p['w']);uw=stress(d,p['dv'],np.ones_like(d))
  j=sample(p,sq,l);dj=np.diff(j,axis=-1);turn=np.maximum(0,(np.abs(dj).sum(-1)-np.abs(j[...,-1]-j[...,0]))/2)
  jn=j[...,near];tn=np.maximum(0,(np.abs(np.diff(jn,axis=-1)).sum(-1)-np.abs(jn[...,-1]-jn[...,0]))/2)
  penalty=np.mean(turn**2)+np.mean(tn**2)*4+np.max(tn)**2*.05
  # Level ordering along fixed physical purity is built in. Check fixed public
  # U too, since a Level-dependent Reach map can change its physical path.
  s=warp(sq,-rshift(Lq,cs));lp=contour(Lq,s,cs);jp=sample(p,s,lp)
  order=np.mean(np.minimum(np.diff(jp,axis=1),0)**2)
  total+=.5*(st+.1*uw+weight*penalty+200*order)
  stats[p['gamut']]={'weighted':100*np.sqrt(st),'unweighted':100*np.sqrt(uw),'surrogateMeanTurn':float(turn.mean()),'surrogateNearTurn':float(tn.mean()),'surrogateWorstNearTurn':float(tn.max()),'orderPenalty':float(order)}
 total+=1e-6*np.mean((C*freq)**2)
 if not np.isfinite(total):raise FloatingPointError('Nonfinite objective')
 calls+=1
 if total<best[0]:best[:]=[float(total),x.copy(),stats]
 if log:
  row={'calls':calls,'seconds':time.monotonic()-start,'loss':float(total),'stats':stats};trace.write(json.dumps(row)+'\n');trace.flush();save();print(json.dumps(row),flush=True)
 return total
def save():
 r=copy.deepcopy(rec);r.update(id='HRL-v2-contours-reconstructed-'+args.name,variant=args.name,coefficients=best[1].reshape(7,2*K+1).tolist())
 r['research']={'reconstructed':True,'lost_run_not_reproduced':True,'fit':vars(args),'objective':'joint weighted STRESS squared + 0.1 unweighted STRESS squared + physical fixed-Level turn loss + Level ordering loss + weak frequency penalty','contourTurnWeight':weight,'trainingHues':H,'stats':best[2],'bestLoss':best[0],'calls':calls,'seconds':time.monotonic()-start,'codeSHA256':codehash,'cacheSHA256':hashlib.sha256((O/'cache.json').read_bytes()).hexdigest(),'populations':{'srgb_retained':3331,'full':3813},'limits':['COMBVD used for training; not held out','GenSpace turn regularizer is synthetic evidence, not a definition of Level','No new ColorBench run','Fresh reconstruction, not recovery of prior coefficients']}
 (O/f'{args.name}.json').write_text(json.dumps(r,indent=2)+'\n')
x=np.array(rec['coefficients']).ravel();assess(x,True)
res=minimize(assess,x,method='L-BFGS-B',bounds=[(-6,6)]*len(x),callback=lambda x:assess(x,True),options={'maxiter':args.steps,'maxfun':args.steps*90,'ftol':2e-10,'gtol':2e-6,'maxls':25})
save();trace.close();print('FINISHED',args.name,res.message,json.dumps(best[2]),flush=True)
