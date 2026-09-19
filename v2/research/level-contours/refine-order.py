"""Bounded Reach-only experiment with explicit fixed-R GenSpace J guard.
Keeps the strict contour rows frozen. Synthetic ordering diagnostics are training
constraints, not a definition of Level or evidence of universal monotonicity.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import json,hashlib,time,copy
import numpy as np
from scipy.optimize import minimize
from scipy.ndimage import map_coordinates,spline_filter
P=Path(__file__).resolve().parent; O=P/'results'; original=(O/'strict.json').read_bytes();rec=json.loads(original);C0=np.array(rec['coefficients']);K=rec['harmonics'];shift=rec['neutral_shift'];cache=json.loads((O/'cache.json').read_text());H=cache['H']//2;N=cache['N'];start=time.monotonic();calls=0

def feat(h):
 t=np.asarray(h)*np.pi/180;return np.stack([np.ones_like(t)]+[fn(k*t) for k in range(1,K+1) for fn in [np.cos,np.sin]],-1)
def warp(x,t):return x/(x+(1-x)*np.exp(-t))
def cp(s,c):return np.exp(s*s*2*np.tanh((c[...,0]+c[...,1]*(2*s-1))/2))
def ct(s,c):return s*s*4*np.tanh((c[...,2]+c[...,3]*(2*s-1))/4)
def rp(L,c):
 v=2*L-1;return np.exp(2*np.tanh((c[...,4]+c[...,5]*v+c[...,6]*v*v)/2))
def rt(L,c):
 v=2*L-1;return 6*np.tanh((c[...,7]+c[...,8]*v+c[...,9]*v*v)/6)
def forward(q,fc,C):
 c=fc@C.T;a=q[:,2];s=q[:,1]/np.maximum(a,1e-30);l=np.where(a<=216/24389,24389*a/2700,(29*np.cbrt(a)-4)/25)
 L=warp(warp(l,-ct(s,c))**(1/cp(s,c)),shift);R=L*warp(s**rp(L,c),rt(L,c));h=q[:,0]*np.pi/180
 return np.stack([np.sqrt(3)/2*R*np.cos(h),np.sqrt(3)/2*R*np.sin(h),L-R/2],-1)
def stress(d,v,w):return max(0,1-np.sum(w*d*v)**2/(np.sum(w*d*d)*np.sum(w*v*v)))
profiles=[]
for g,p in cache['profiles'].items():
 d={k:np.array(p[k]) for k in ['a','b','dv','w']};d.update(g=g,fa=feat(d['a'][:,0]),fb=feat(d['b'][:,0]));raw=(O/f'grid-{g}.f64').read_bytes();assert hashlib.sha256(raw).hexdigest()==p['gridSHA256'];J=np.frombuffer(raw,dtype='<f8').reshape(cache['H'],N,N,3)[::2,...,0];d['J']=spline_filter(J,order=3,mode='nearest');profiles.append(d)
R=np.array([.0001,.001,.01,.05,.2,.5,.8])[None,:,None];t=np.unique(np.r_[np.linspace(0,.1,25),np.linspace(.1,1,33)])[None,None,:];L=R+(1-R)*t;U=R/L;cs0=feat(np.arange(H)*360/H)[:,None,None,:];hh=np.broadcast_to(np.arange(H)[:,None,None],(H,7,t.size))
frequency=np.array([1]+[k*k for k in range(1,K+1) for _ in [0,1]]);best=[float('inf'),None,None];trace=(O/'guarded.jsonl').open('w')
def assess(x,log=False):
 global calls
 C=C0.copy();C[4:]=x.reshape(6,2*K+1);c=cs0@C.T;s=warp(U,-rt(L,c))**(1/rp(L,c));l=warp(warp(L,-shift)**cp(s,c),ct(s,c));coords=[hh.ravel(),(np.arccos(np.clip(1-2*l,-1,1))/np.pi*(N-1)).ravel(),(np.arccos(np.clip(1-2*s,-1,1))/np.pi*(N-1)).ravel()];total=0;stats={}
 for p in profiles:
  d=np.linalg.norm(forward(p['a'],p['fa'],C)-forward(p['b'],p['fb'],C),axis=-1);w=stress(d,p['dv'],p['w']);uw=stress(d,p['dv'],np.ones_like(d));j=map_coordinates(p['J'],coords,order=3,mode='nearest',prefilter=False).reshape(hh.shape);drop=np.maximum(0,-np.diff(j,axis=-1));excess=np.maximum(0,drop-.0005);penalty=5000*np.mean(excess**2)+100*np.max(excess)**2
  total+=.5*(w+.1*uw+penalty);stats[p['g']]={'weighted':100*np.sqrt(w),'unweighted':100*np.sqrt(uw),'surrogateNegativeSteps':int(np.sum(drop>1e-8)),'surrogateWorstDrop':float(drop.max()),'orderingPenalty':float(penalty)}
 total+=1e-6*np.mean((C[4:]*frequency)**2);calls+=1
 if total<best[0]:best[:]=[total,C.copy(),stats]
 if log:
  row={'calls':calls,'seconds':time.monotonic()-start,'loss':float(total),'stats':stats};trace.write(json.dumps(row)+'\n');trace.flush();print(json.dumps(row),flush=True)
 return total
assess(C0[4:].ravel(),True)
r=minimize(assess,C0[4:].ravel(),method='L-BFGS-B',bounds=[(-6,6)]*C0[4:].size,callback=lambda x:assess(x,True),options={'maxiter':100,'maxfun':9000,'ftol':2e-10,'gtol':2e-6})
rec['coefficients']=best[1].tolist();rec['id']='HRL-v2-contours-reconstructed-guarded';rec['variant']='guarded';rec['research']['orderingRefinement']={'fixedContourRows':4,'startSHA256':hashlib.sha256(original).hexdigest(),'codeSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'stats':best[2],'calls':calls,'seconds':time.monotonic()-start,'optimizerStatus':r.message,'limits':'Training grid at 18 hues; fresh offset-hue direct audit required'};assert np.array_equal(best[1][:4],C0[:4]);(O/'guarded.json').write_text(json.dumps(rec,indent=2)+'\n');trace.close();print('FINISHED',json.dumps(rec['research']['orderingRefinement']),flush=True)
