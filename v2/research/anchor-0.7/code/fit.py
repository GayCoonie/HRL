"""Constrained, hue-preserving R/L calibration with explicit gamut-relative inputs.
No XYZ distance substitute: the objective uses the native equilateral bicone.
The neutral ramp and all vertices are fixed by algebra, for every coefficient.
COMBVD is development data; source-family omissions are retrospective checks.
"""
import json, os, sys, time, hashlib
from pathlib import Path
import numpy as np
import torch
from scipy.optimize import minimize
ROOT=Path(__file__).resolve().parents[1]
torch.set_num_threads(1);torch.set_default_dtype(torch.float64)
K=4;NF=2*K+1

def coord(qs):return torch.tensor([[q['H'],q['R'],q['L']] for q in qs])
def features(q):
 h=q[:,0]*np.pi/180
 return torch.stack([torch.ones_like(h)]+[v for k in range(1,K+1) for v in (torch.cos(k*h),torch.sin(k*h))],1)
def warp(q,c):
 L=q[:,2];U=q[:,1]/torch.clamp(L,min=1e-15);F=features(q)
 a=F@c[:2].T;tL=U*(a[:,0]+a[:,1]*(2*U-1))
 e=torch.exp(tL);ln=L*e/(1-L+L*e)
 b=F@c[2:].T;tU=b[:,0]+b[:,1]*(2*ln-1)+b[:,2]*(2*ln-1)**2
 e=torch.exp(tU);un=U*e/(1-U+U*e)
 return torch.stack([q[:,0],ln*un,ln],1)
def embed(q):
 h=q[:,0]*np.pi/180;R=q[:,1];L=q[:,2]
 return torch.stack([L-R/2,np.sqrt(3)/2*R*torch.cos(h),np.sqrt(3)/2*R*torch.sin(h)],1)
def dist(a,b):return torch.sqrt(((embed(a)-embed(b))**2).sum(1)+1e-30)
def sloss(d,v,w):
 dv=(w*d*v).sum();dd=(w*d*d).sum();vv=(w*v*v).sum();scale=dv/dd
 return ((w*(scale*d-v)**2).sum()/vv),scale

def main(gamut,omit='',geom=1.,do_fit=True):
 data=json.loads((ROOT/f'results/fit-input-{gamut}.json').read_text());rows=data['pairs'];A=coord([r['a'] for r in rows]);B=coord([r['b'] for r in rows]);V=torch.tensor([r['dv'] for r in rows]);W=torch.tensor([r['weight'] for r in rows]);inds=np.array([r['index'] for r in rows]);
 mask=np.array([not(r['dataset'].startswith(omit)) if omit else True for r in rows]);mask=torch.tensor(mask)
 pa=coord([r['input'] for r in data['probes']]);pe=embed(coord([r['target'] for r in data['probes']]));pw=torch.tensor([2 if r['arm'] else 1 for r in data['probes']])
 intervals={}
 for r in data['intervals']:
  if r['admitted']:intervals.setdefault(r['track'],[]).append(r)
 intervals=[(coord([r['a'] for r in rows]),coord([r['b'] for r in rows]),torch.tensor([r['difference'] for r in rows])) for rows in intervals.values()]
 frequency=torch.tensor([1]+[1+k*k for k in range(1,K+1) for _ in range(2)])
 history=[];t0=time.time()
 def loss_np(x):
  c=torch.tensor(x.reshape(5,NF),requires_grad=True)
  aa=warp(A,c);bb=warp(B,c);d=dist(aa,bb);main_loss,_=sloss(d[mask],V[mask],W[mask])
  reg=.00012*(c*c*frequency[None,:]).mean()
  p=embed(warp(pa,c));keep=geom*((p-pe)**2*pw[:,None]).sum(1).mean()
  il=[]
  for a,b,v in intervals:il.append(sloss(dist(warp(a,c),warp(b,c)),v,torch.ones_like(v))[0])
  rloss=.04*torch.stack(il).mean()
  loss=main_loss+reg+keep+rloss
  loss.backward();return float(loss.detach()),c.grad.detach().numpy().ravel()
 res=minimize(loss_np,np.zeros(5*NF),method='L-BFGS-B',jac=True,bounds=[(-2,2)]*(5*NF),options={'maxiter':400,'ftol':1e-12,'gtol':2e-7,'maxls':30})
 c=torch.tensor(res.x.reshape(5,NF));d=dist(warp(A,c),warp(B,c));s,scale=sloss(d,V,W);scores={}
 for ds in sorted(set(r['dataset'] for r in rows)):
  keep=torch.tensor([r['dataset']==ds for r in rows]);val,_=sloss(d[keep],V[keep],torch.ones_like(V[keep]));scores[ds]={'n':int(keep.sum()),'stress':100*float(torch.sqrt(val))}
 probe_error=torch.sqrt(((embed(warp(pa,c))-pe)**2).sum(1)).numpy()
 intervalscores={}
 for name,rows in {name:[r for r in data['intervals'] if r['track']==name and r['admitted']] for name in ('Red','Yellow','Green','Blue','Neutral')}.items():
  a=coord([r['a'] for r in rows]);b=coord([r['b'] for r in rows]);v=torch.tensor([r['difference'] for r in rows]);s1,_=sloss(dist(a,b),v,torch.ones_like(v));s2,_=sloss(dist(warp(a,c),warp(b,c)),v,torch.ones_like(v));intervalscores[name]={'before':100*float(torch.sqrt(s1)),'after':100*float(torch.sqrt(s2))}
 record={'id':'OPAL-0.7-anchor-joint-fit','gamut':gamut,'harmonics':K,'coefficients':c.numpy().tolist(),'omitted_family':omit or None,'geometry_weight':geom,'fitted_to_COMBVD':True,'training_mask':{'n':int(mask.sum()),'excluded_family':omit or None,'ordered_indices_sha256':hashlib.sha256(json.dumps(inds[mask].tolist(),separators=(',',':')).encode()).hexdigest(),'reconstruction':'Admitted rows for this gamut from fit-input, excluding omitted family when set'},'stress_all_weighted':100*float(torch.sqrt(s)),'stress_all_unweighted':100*float(torch.sqrt(sloss(d,V,torch.ones_like(V))[0])),'pooled_scale':float(scale),'subsets':scores,'rogers_interval_stress':intervalscores,'geometry_deviation':{'rms':float(np.sqrt(np.mean(probe_error**2))),'p95':float(np.quantile(probe_error,.95)),'max':float(probe_error.max())},'optimizer':{'success':bool(res.success),'message':str(res.message),'iterations':int(res.nit),'seconds':time.time()-t0,'loss':float(res.fun)},'input_sha256':hashlib.sha256((ROOT/f'results/fit-input-{gamut}.json').read_bytes()).hexdigest(),'brightness_sha256':hashlib.sha256((ROOT/'results/brightness-readout.json').read_bytes()).hexdigest(),'formula':'L1=T(L,U*(a0(H)+a1(H)*(2U-1))); U1=T(U,b0(H)+b1(H)*(2L1-1)+b2(H)*(2L1-1)^2); R1=L1*U1; T(x,t)=x*exp(t)/(1-x+x*exp(t)); U=R/L. H unchanged.'}
 if omit:
  val,sc=sloss(d[~mask],V[~mask],W[~mask]);record['omitted_stress']=100*float(torch.sqrt(val))
 out=ROOT/f"results/fit-{gamut}{'-omit-'+omit if omit else ''}-g{geom:g}.json";out.write_text(json.dumps(record,indent=2)+'\n');
 print(gamut,omit,geom,record['stress_all_weighted'],record['geometry_deviation'],record.get('omitted_stress'),record['optimizer'],flush=True)
 return record
if __name__=='__main__':main(sys.argv[1],sys.argv[2] if len(sys.argv)>2 and sys.argv[2]!='-' else '',float(sys.argv[3]) if len(sys.argv)>3 else 1.)
