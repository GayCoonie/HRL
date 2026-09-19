"""Increase only Reach freedom; retain the fitted physical Level contours exactly.
Adds a positive power before the Reach logit warp. No surrogate is needed for
COMBVD; all pair transforms are analytic. Results must pass a direct runtime audit.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import argparse,hashlib,json,time,copy
import numpy as np
from scipy.optimize import minimize
P=Path(__file__).resolve().parent;O=P/'results';ap=argparse.ArgumentParser();ap.add_argument('--name',required=True);args=ap.parse_args()
path=O/f'{args.name}.json';original=path.read_bytes();rec=json.loads(original);assert len(rec['coefficients'])==7
old=O/f'{args.name}-before-reach.json';old.write_bytes(original)
C0=np.array(rec['coefficients']);C0=np.r_[C0[:4],np.zeros_like(C0[4:]),C0[4:]];K=rec['harmonics'];shift=rec['neutral_shift'];cache=json.loads((O/'cache.json').read_text())
def f(h):
 t=h*np.pi/180;return np.stack([np.ones_like(t)]+[fn(k*t) for k in range(1,K+1) for fn in [np.cos,np.sin]],-1)
def warp(x,t):return x/(x+(1-x)*np.exp(-t))
def transform(q,feat,C):
 c=feat@C.T;a=q[:,2];s=q[:,1]/np.maximum(a,1e-30);l=np.where(a<=216/24389,24389*a/2700,(29*np.cbrt(a)-4)/25)
 powc=np.exp(s*s*2*np.tanh((c[:,0]+c[:,1]*(2*s-1))/2));shiftc=s*s*4*np.tanh((c[:,2]+c[:,3]*(2*s-1))/4)
 L=warp(warp(l,-shiftc)**(1/powc),shift);v=2*L-1
 power=np.exp(2*np.tanh((c[:,4]+c[:,5]*v+c[:,6]*v*v)/2));t=6*np.tanh((c[:,7]+c[:,8]*v+c[:,9]*v*v)/6)
 U=warp(s**power,t);R=L*U;h=q[:,0]*np.pi/180
 return np.stack([np.sqrt(3)/2*R*np.cos(h),np.sqrt(3)/2*R*np.sin(h),L-R/2],-1)
profiles=[]
for g,p in cache['profiles'].items():
 p={k:np.array(p[k]) for k in ['a','b','dv','w']};p.update(g=g,fa=f(p['a'][:,0]),fb=f(p['b'][:,0]));profiles.append(p)
def stress(d,v,w):return max(0,1-np.sum(w*d*v)**2/(np.sum(w*d*d)*np.sum(w*v*v)))
frequency=np.array([1]+[k*k for k in range(1,K+1) for _ in [0,1]])
best=[float('inf'),None,None];start=time.monotonic();calls=0
def loss(x):
 global calls
 C=C0.copy();C[4:]=x.reshape(6,2*K+1);total=0;stats={}
 for p in profiles:
  d=np.linalg.norm(transform(p['a'],p['fa'],C)-transform(p['b'],p['fb'],C),axis=-1);w=stress(d,p['dv'],p['w']);u=stress(d,p['dv'],np.ones_like(d));total+=.5*(w+.1*u);stats[p['g']]={'weighted':100*np.sqrt(w),'unweighted':100*np.sqrt(u)}
 total+=1e-6*np.mean((C[4:]*frequency)**2);calls+=1
 if total<best[0]:best[:]=[total,C.copy(),stats]
 return total
res=minimize(loss,C0[4:].ravel(),method='L-BFGS-B',bounds=[(-6,6)]*C0[4:].size,options={'maxiter':220,'maxfun':18000,'ftol':1e-11,'gtol':2e-6})
rec['coefficients']=best[1].tolist();rec['reach']='positive-power-then-logit';rec['research']['reachRefinement']={'fixedContourRows':4,'startSHA256':hashlib.sha256(original).hexdigest(),'codeSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'stats':best[2],'calls':calls,'seconds':time.monotonic()-start,'optimizerStatus':res.message,'limits':'Physical Level contours unchanged; public-U paths and fixed-R Level ordering require fresh direct audit'}
assert np.array_equal(best[1][:4],C0[:4]);path.write_text(json.dumps(rec,indent=2)+'\n');print('FINISHED REACH',args.name,json.dumps(rec['research']['reachRefinement']),flush=True)
