"""Joint shared-gamut COMBVD + GenSpace tonal-operation fit.
No Oklab, ZCAM pseudo-observations, or new human-rating data are used.
The differentiable grid is an approximation for regularization only.
"""
from pathlib import Path
import argparse,copy,json,time,hashlib,math,os
import numpy as np
import torch
import torch.nn.functional as F
P=Path(__file__).resolve().parent

def features(h,K=6):
    h=h*math.pi/180
    return torch.stack([torch.ones_like(h)]+[f(k*h) for k in range(1,K+1) for f in (torch.cos,torch.sin)],-1)
def warp(x,t):return x/(x+(1-x)*torch.exp(-t))
def phi(t,a):return t*(1-a*(1-t).square())
class InversePhi(torch.autograd.Function):
    @staticmethod
    def forward(ctx,y,a):
        lo=torch.zeros_like(y);hi=torch.ones_like(y);t=y.clone()
        for _ in range(34):
            e=phi(t,a)-y;lo=torch.where(e<0,t,lo);hi=torch.where(e>=0,t,hi)
            n=t-e/(1-a*(1-t)*(1-3*t));t=torch.where((n>=lo)&(n<=hi),n,(lo+hi)/2)
        ctx.save_for_backward(t,a);return t
    @staticmethod
    def backward(ctx,grad):
        t,a=ctx.saved_tensors;d=1-a*(1-t)*(1-3*t)
        return grad/d,grad*t*(1-t).square()/d

def coords(q,C,D,shift,inverse=False,feat=None):
    L=q[...,2];U=q[...,1]/L.clamp_min(1e-30)
    feat=features(q[...,0]) if feat is None else feat
    cs=torch.einsum('...k,ljk->...lj',feat,C)
    def amount(u):return .85*torch.sigmoid((feat[...,:7]*D).sum(-1))*u*u
    if inverse:
        L=phi(L,amount(U))
        for j in range(len(C)-1,-1,-1):
            c=cs[...,j,:];v=2*L-1
            U=warp(U,-8*torch.tanh((c[...,2]+c[...,3]*v+c[...,4]*v*v)/8))
            L=warp(L,-8*torch.tanh(U*(c[...,0]+c[...,1]*(2*U-1))/8))
        L=warp(L,-shift)
    else:
        L=warp(L,shift)
        for j in range(len(C)):
            c=cs[...,j,:];L=warp(L,8*torch.tanh(U*(c[...,0]+c[...,1]*(2*U-1))/8))
            v=2*L-1;U=warp(U,8*torch.tanh((c[...,2]+c[...,3]*v+c[...,4]*v*v)/8))
        L=InversePhi.apply(L,amount(U))
    return torch.stack([q[...,0],L*U,L],-1)

def embed(q):
    h=q[...,0]*math.pi/180;r=math.sqrt(3)/2*q[...,1]
    return torch.stack([q[...,2]-q[...,1]/2,r*torch.cos(h),r*torch.sin(h)],-1)

def main():
    a=argparse.ArgumentParser();a.add_argument('--name',required=True);a.add_argument('--start',default='old-balanced');a.add_argument('--steps',type=int,default=600);a.add_argument('--stride',type=int,default=2);a.add_argument('--samples',type=int,default=97);a.add_argument('--visual',type=float,default=.15);a.add_argument('--corner',type=float,default=.35);a.add_argument('--guard',type=float,default=.4);a.add_argument('--layers',type=int,default=4);args=a.parse_args()
    torch.set_num_threads(1);torch.set_default_dtype(torch.float64);torch.manual_seed(170917);np.random.seed(170917)
    torch.use_deterministic_algorithms(True)
    gridrec=json.loads((P/'results/grid.json').read_text());cache=json.loads((P/'../shared-rl/results/cache.json').read_text());HH,N=gridrec['H'],gridrec['N'];hh=list(range(0,HH,args.stride));hs=torch.tensor(hh)*360/HH;H=len(hh)
    startpath=P/('../shared-rl/results/'+args.start[4:]+'.json') if args.start.startswith('old-') else P/f'trials/{args.start}.json'
    rec=json.loads(startpath.read_text());C0=np.asarray(rec['coefficients'][0]);assert args.layers>=len(C0)
    C0=np.pad(C0,((0,args.layers-len(C0)),(0,0),(0,0)))
    C=torch.tensor(C0,requires_grad=True);D=torch.tensor(rec['dark']['coefficients'],requires_grad=True);shift=torch.tensor(float(rec['neutral_shift']))
    ratios=[.12,.32,.55,.78,1.];ratios2=[.06,.22,.45,.68,.88]
    points=[]
    for h in hs.tolist():
        paths=[]
        for family in ['black','white','exchange','reach']:
            for r in (ratios if family in ['black','white'] else ratios2):
                paths.append([[h,r*t,t] if family=='black' else [h,(1-t)*r,t+(1-t)*r] if family=='white' else [h,r,r+(1-r)*t] if family=='exchange' else [h,r*t,r] for t in np.linspace(0,1,args.samples)])
        points.append(paths)
    output=torch.tensor(points);feat=features(hs)[:,None,None,:]
    profiles=[]
    oldb=json.loads((P/'../shared-rl/results/balanced.json').read_text());oldm=json.loads((P/'../shared-rl/results/metric.json').read_text())
    def sampled(q,c,d,image):
        b=coords(q,c,d,shift,True,feat);l=b[...,2];u=b[...,1]/l.clamp_min(1e-30)
        u=torch.acos((1-2*u).clamp(-1+1e-14,1-1e-14))/math.pi;l=torch.acos((1-2*l).clamp(-1+1e-14,1-1e-14))/math.pi
        return F.grid_sample(image,torch.stack([2*u-1,2*l-1],-1),mode='bilinear',padding_mode='border',align_corners=True).permute(0,2,3,1)
    for g in ['srgb','full']:
        z=cache['profiles'][g];image=torch.tensor(np.fromfile(P/f'results/gen-grid-{g}.f64',dtype='<f8').reshape(HH,N,N,3)[hh]).permute(0,3,1,2).contiguous()
        p={k:torch.tensor(z[k]) for k in ['a','b','dv','w']};p.update(gamut=g,image=image,fa=features(p['a'][...,0]),fb=features(p['b'][...,0]))
        with torch.no_grad():
            def edge(r):
                v=sampled(output[:,4:5],torch.tensor(r['coefficients'][0]),torch.tensor(r['dark']['coefficients']),image)
                v=torch.linalg.vector_norm(v-v[:,:,:1],dim=-1);return v/v[:,:,-1:].clamp_min(1e-12)
            p['guard_hi']=edge(oldm)+.015;p['guard_lo']=.65*edge(oldb)
        profiles.append(p)
    freq=torch.tensor([1]+[k*k for k in range(1,7) for _ in range(2)])
    weights=torch.tensor([1]*10+[.4]*10)[None,:,None]
    guardmask=(output[:,4:5,:,2]>=.06)&(output[:,4:5,:,2]<=.42)
    starttime=time.monotonic();calls=0;best=None;stats0=None
    logpath=P/f'trials/{args.name}.jsonl';log=logpath.open('w')
    def assess():
        loss=0;stats={}
        for p in profiles:
            d=torch.linalg.vector_norm(embed(coords(p['a'],C,D,shift,feat=p['fa']))-embed(coords(p['b'],C,D,shift,feat=p['fb'])),dim=-1).clamp_min(1e-15);w,v=p['w'],p['dv'];s2=1-(w*d*v).sum().square()/((w*d*d).sum()*(w*v*v).sum())
            val=sampled(output,C,D,p['image']);vec=val[:,:,1:]-val[:,:,:-1];ds=torch.linalg.vector_norm(vec,dim=-1).clamp_min(1e-12);ds=ds[:,:,2:-2];normal=ds/ds.mean(-1,keepdim=True).clamp_min(1e-12)
            cv2=((normal-1).square()*weights).mean();rough=((normal[:,:,1:]-normal[:,:,:-1]).square()*weights).mean();tail=(F.relu(normal-3).square()*weights).mean()
            bend=(vec[:,:,3:-2]-vec[:,:,2:-3])/ds.mean(-1,keepdim=True)[...,None].clamp_min(1e-12);curve=(bend.square().sum(-1)*weights).mean()
            db=torch.linalg.vector_norm(val[:,:5]-val[:,:5,:1],dim=-1);dw=torch.linalg.vector_norm(val[:,5:10]-val[:,5:10,-1:],dim=-1)
            nb=(db[:,:,1:]-db[:,:,:-1])/torch.linalg.vector_norm(vec[:,:5],dim=-1).mean(-1,keepdim=True).clamp_min(1e-12)
            nw=(dw[:,:,1:]-dw[:,:,:-1])/torch.linalg.vector_norm(vec[:,5:10],dim=-1).mean(-1,keepdim=True).clamp_min(1e-12)
            retreat=.5*(F.relu(-nb).square().mean()+F.relu(nw).square().mean())
            e=db[:,4:5]/db[:,4:5,-1:].clamp_min(1e-12)
            guard=((F.relu(e-p['guard_hi']).square()+.25*F.relu(p['guard_lo']-e).square())[guardmask]).mean()
            visual=cv2+2*rough+.1*curve+.25*tail
            loss=loss+.5*(s2+args.visual*visual+args.corner*retreat+args.guard*guard)
            stats[p['gamut']]={k:float(v.detach()) for k,v in dict(stress=100*s2.clamp_min(0).sqrt(),cv2=cv2,rough=rough,curvature=curve,retreat=retreat,guard=guard,black_cv=(normal[:,:5]-1).square().mean().sqrt(),white_cv=(normal[:,5:10]-1).square().mean().sqrt()).items()}
        reg=1e-7*(C*freq).square().mean()+1e-6*D[1:].square().mean();loss=loss+reg
        return loss,stats
    opt=torch.optim.LBFGS([C,D],lr=.65,max_iter=args.steps,history_size=30,line_search_fn='strong_wolfe',tolerance_grad=1e-8,tolerance_change=1e-12)
    def save(cc,dd,stats,evals,loss):
        r=copy.deepcopy(rec);r.update(id='HRL-0.11-gen-tonal-'+args.name,variant=args.name,layers=args.layers,coefficients=[cc.tolist()]);r['dark']['coefficients']=dd.tolist()
        r['research']={'ruler':'helmlab-1.0.0-genspace','human_training':['COMBVD'],'objective':'Joint squared traditional STRESS + 3D GenSpace tonal paths + corner retreat + broad prior dark envelope','fit':vars(args),'seed':170917,'start_file':str(startpath.relative_to(P)),'start_sha256':hashlib.sha256(startpath.read_bytes()).hexdigest(),'grid_record':gridrec,'per_gamut_objective_weights':[.5,.5],'path_families':['black dilution reverse','white dilution','neutral exchange','Reach at fixed Level'],'family_weights':[1,1,.4,.4],'old_lightness_power_target':False,'synthetic_constraints':'GenSpace trajectories and previous metric/balanced dark-edge envelope, not observer ratings','preserved':['hue field','ring','neutral shift','source atlases','physical solid','reference white'],'evaluations':evals,'best_loss':loss,'stats':stats,'seconds':time.monotonic()-starttime,'versions':{'torch':torch.__version__,'numpy':np.__version__},'evaluation_exposure':'Prior project development exposed evaluation datasets. No new held-out run used in fitting.'}
        (P/f'trials/{args.name}.json').write_text(json.dumps(r,indent=2)+'\n')
    def closure():
        nonlocal calls,best,stats0
        opt.zero_grad();loss,stats=assess();assert torch.isfinite(loss),'Nonfinite objective';loss.backward();assert torch.isfinite(C.grad).all() and torch.isfinite(D.grad).all();calls+=1
        if stats0 is None:stats0=stats
        row={'evaluation':calls,'elapsed':time.monotonic()-starttime,'loss':float(loss.detach()),'stats':stats};log.write(json.dumps(row)+'\n');log.flush()
        if best is None or row['loss']<best[0]:
            best=(row['loss'],C.detach().clone(),D.detach().clone(),stats,calls)
            if calls%25==1:save(best[1],best[2],stats,calls,best[0])
        if calls%50==1:print(args.name,json.dumps(row),flush=True)
        return loss
    opt.step(closure);save(best[1],best[2],best[3],calls,best[0]);log.close();print('DONE',args.name,best[3],time.monotonic()-starttime,flush=True)

if __name__=='__main__':main()
