"""Joint COMBVD and perceptual-path fitting with shared interior freedom.
All selected observer pairs are training. Runtime audits remain authoritative.
"""
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
from pathlib import Path
import argparse,json,hashlib,time,math
import numpy as np
import torch
import torch.nn.functional as F
from core import coordinates,embed,expand_record
P=Path(__file__).resolve().parent;O=P/'results'
def stress(d,v,w):return 1-(w*d*v).sum().square()/((w*d*d).sum()*(w*v*v).sum())
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--name',required=True);ap.add_argument('--start',default='../boundary-tonal/results/metric.json');ap.add_argument('--steps',type=int,default=350);ap.add_argument('--turn',type=float,default=1200);ap.add_argument('--order',type=float,default=100);ap.add_argument('--smooth',type=float,default=.001);ap.add_argument('--no-hue',action='store_true');args=ap.parse_args()
 torch.set_default_dtype(torch.float64);torch.set_num_threads(1);torch.manual_seed(260920);torch.use_deterministic_algorithms(True)
 sp=(P/args.start).resolve();raw=sp.read_bytes();rec=json.loads(raw)
 if rec.get('schema')=='hrl-joint-interior-v1':C,D,N,A=[torch.tensor(rec[k]) for k in ['coefficients','dark','neutral','hue_coefficients']]
 else:C,D,N,A=expand_record(rec)
 for x in [C,D,N,A]:x.requires_grad_(True)
 hue_enabled=not args.no_hue
 profiles=[];cachepath=P/'../boundary-tonal/results/cache.json';cache=json.loads(cachepath.read_text())
 for g,p in cache['profiles'].items():
  gr=json.loads((O/f'grid-{g}.json').read_text());b=(O/f'source-{g}.f64').read_bytes();assert hashlib.sha256(b).hexdigest()==gr['sha256'];hh=torch.tensor(gr['hues']+[360.]);n=gr['N'];a=np.frombuffer(b,dtype='<f8').copy().reshape(len(gr['hues']),n,n,4);a=np.concatenate([a,a[:1]],axis=0);im=torch.tensor(a).permute(3,0,1,2)[None].contiguous()
  pp={k:torch.tensor(p[k]) for k in ['a','b','dv','w']};pp.update(g=g,image=im,hs=hh,grid=gr);profiles.append(pp)
 hs=sorted(set(list(np.arange(0,360,15.))+[289.5,290.57,291.5,292.5,294.,296.]))
 nearU=np.unique(np.r_[np.linspace(0,.25,33),.0001,.0005,.001,.0025]);nearL=[.005,.01,.02,.04,.08,.12,.2];wholeU=np.linspace(0,1,41);wholeL=[.02,.08,.2,.5,.8];orderT=np.unique(np.r_[np.linspace(0,1,33),.0005,.001,.0025,.005,.01]);rr=[.0001,.001,.01,.05,.2,.5,.8]
 near=torch.tensor([[[h,L*u,L] for u in nearU] for h in hs for L in nearL]);whole=torch.tensor([[[h,L*u,L] for u in wholeU] for h in hs for L in wholeL]);order=torch.tensor([[[h,R,R+(1-R)*t] for t in orderT] for h in hs for R in rr]);shapes=[q.shape for q in [near,whole,order]];lens=[q.numel()//3 for q in [near,whole,order]];queries=torch.cat([q.reshape(-1,3) for q in [near,whole,order]])
 K=(C.shape[-1]-1)//2;freq=torch.tensor([1]+[k*k for k in range(1,K+1) for _ in range(2)]);calls=0;best=None;start=time.monotonic();trace=(O/f'{args.name}.jsonl').open('w');codehash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
 def sample(b,p):
  h=torch.remainder(b[:,0],360);L=b[:,2];U=b[:,1]/L.clamp_min(1e-30);idx=torch.searchsorted(p['hs'],h.contiguous(),right=True).clamp(1,len(p['hs'])-1)-1;hi=p['hs'][idx];step=p['hs'][idx+1]-hi;z=(idx+(h-hi)/step)/(len(p['hs'])-1)*2-1
  x=2*torch.acos((1-2*U).clamp(-1+1e-14,1-1e-14))/math.pi-1;y=2*torch.acos((1-2*L).clamp(-1+1e-14,1-1e-14))/math.pi-1
  coords=torch.stack([x,y,z],-1).reshape(1,1,1,-1,3);return F.grid_sample(p['image'],coords,mode='bilinear',padding_mode='border',align_corners=True)[0,:,0,0,:].T
 def turn(v):
  j=v[...,0];return .5*((j[:,1:]-j[:,:-1]).abs().sum(-1)-(j[:,-1]-j[:,0]).abs()).clamp_min(0)
 def assess():
  b=coordinates(queries,C,D,N,A,True,hue_enabled);total=0;stats={}
  for p in profiles:
   aa=coordinates(p['a'],C,D,N,A,hue_enabled=hue_enabled);bb=coordinates(p['b'],C,D,N,A,hue_enabled=hue_enabled);d=((embed(aa)-embed(bb)).square().sum(-1)+1e-30).sqrt();st=stress(d,p['dv'],p['w']);uw=stress(d,p['dv'],torch.ones_like(d))
   values=sample(b,p);parts=torch.split(values,lens);vn,vw,vo=[v.reshape(*shape[:-1],4) for v,shape in zip(parts,shapes)];tn=turn(vn);tw=turn(vw);nearpen=tn.square().mean()+.03*tn.max().square();wholepen=tw.square().mean()+.01*tw.max().square()
   grad=(vn[:,1:,:3]-vn[:,:-1,:3])/torch.tensor(np.diff(nearU))[None,:,None];scale=grad.square().sum(-1).mean(-1).clamp_min(1e-8);rough=(grad[:,1:]-grad[:,:-1]).square().sum(-1).mean(-1)/scale
   neg=F.relu(vo[:,:-1,0]-vo[:,1:,0]);yp=F.relu(vo[:,:-1,3]-vo[:,1:,3]);ordering=neg.square().mean()+.01*neg.max().square()+yp.square().mean()
   loss=st+.1*uw+args.turn*nearpen+args.turn*.04*wholepen+args.smooth*rough.mean()+args.order*ordering
   total=total+.5*loss;stats[p['g']]={'weighted':float(100*st.clamp_min(0).sqrt().detach()),'unweighted':float(100*uw.clamp_min(0).sqrt().detach()),'nearMeanTurn':float(tn.mean().detach()),'nearWorstTurn':float(tn.max().detach()),'nearAbove001':int((tn>.001).sum().detach()),'nearPaths':tn.numel(),'wholeMeanTurn':float(tw.mean().detach()),'gradientVariation':float(rough.mean().detach()),'fixedRWorstDrop':float(neg.max().detach())}
  total=total+1e-7*(C*freq).square().mean()+1e-5*A.square().mean()+1e-7*D.square().mean();return total,stats
 def save():
  if best is None:return
  loss,cs,ds,ns,As,stats,call=best;r={'schema':'hrl-joint-interior-v1','id':'HRL-joint-'+args.name,'variant':args.name,'harmonics':K,'hue_enabled':hue_enabled,'coefficients':cs.tolist(),'dark':ds.tolist(),'neutral':ns.tolist(),'hue_coefficients':As.tolist(),'gamut_calibration':'shared','ring_logits':None,'source':'deterministic-own-anchor-normalized','research':{'startSHA256':hashlib.sha256(raw).hexdigest(),'codeSHA256':codehash,'coreSHA256':hashlib.sha256((P/'core.py').read_bytes()).hexdigest(),'cacheSHA256':hashlib.sha256(cachepath.read_bytes()).hexdigest(),'fit':vars(args),'stats':stats,'bestLoss':loss,'bestCall':call,'calls':calls,'seconds':time.monotonic()-start,'trainingHues':hs,'nearLevels':nearL,'nearU':nearU.tolist(),'gridSHA256':{p['g']:p['grid']['sha256'] for p in profiles},'populations':{'srgb_retained':3331,'full':3813},'limits':['COMBVD training data','Approximate trilinear GenSpace regularizer; direct audits required','No new ColorBench run','Synthetic gradient/J diagnostics do not define HRL Level']}};(O/f'{args.name}.json').write_text(json.dumps(r,indent=2)+'\n')
 params=[C,D,N]+([A] if hue_enabled else []);optimizer=torch.optim.LBFGS(params,lr=.7,max_iter=args.steps,history_size=25,line_search_fn='strong_wolfe',tolerance_grad=2e-8,tolerance_change=1e-12)
 def closure():
  nonlocal calls,best
  optimizer.zero_grad();loss,stats=assess();assert torch.isfinite(loss);loss.backward();assert all(torch.isfinite(x.grad).all() for x in params);calls+=1;value=float(loss.detach())
  if best is None or value<best[0]:best=(value,C.detach().clone(),D.detach().clone(),N.detach().clone(),A.detach().clone(),stats,calls)
  row={'call':calls,'seconds':time.monotonic()-start,'loss':value,'stats':stats};trace.write(json.dumps(row)+'\n');trace.flush()
  if calls%25==1:save();print(json.dumps(row),flush=True)
  return loss
 optimizer.step(closure);save();trace.close();print('FINISHED',args.name,json.dumps(best[-2]),flush=True)
if __name__=='__main__':main()
