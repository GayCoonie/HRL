"""R/L-only fitting on the native sRGB own-anchor solid.

Training uses COMBVD and synthetic source-chart samples only. No OSA,
MacAdam, Xiao, or threshold/tolerance measurements enter this program.
The coupled coordinate maps are the exact production equations. A fixed
161x161 cosine-spaced source-XYZ grid supplies an explicitly approximate, differentiable
Oklab visual regularizer; every selected result is validated in JavaScript.
"""
from pathlib import Path
import argparse, copy, json, time, hashlib, sys
import numpy as np
import torch
import torch.nn.functional as F

HERE=Path(__file__).resolve().parent

def features(h,K=6):
    theta=h*np.pi/180
    return torch.stack([torch.ones_like(theta)]+[v for k in range(1,K+1) for v in [torch.cos(k*theta),torch.sin(k*theta)]],-1)

def warp(x,t):return x/(x+(1-x)*torch.exp(-t))
def bounded(t):return 8*torch.tanh(t/8)

def coordinates(q,C,shift,inverse=False):
    H=q[...,0];L=q[...,2];U=q[...,1]/L.clamp_min(1e-30)
    cs=torch.einsum('...k,ljk->...lj',features(H),C)
    if inverse:
        for j in range(len(C)-1,-1,-1):
            c=cs[...,j,:];v=2*L-1
            U=warp(U,-bounded(c[...,2]+c[...,3]*v+c[...,4]*v*v))
            L=warp(L,-bounded(U*(c[...,0]+c[...,1]*(2*U-1))))
        L=warp(L,-shift)
    else:
        L=warp(L,shift)
        for j in range(len(C)):
            c=cs[...,j,:];L=warp(L,bounded(U*(c[...,0]+c[...,1]*(2*U-1))))
            v=2*L-1;U=warp(U,bounded(c[...,2]+c[...,3]*v+c[...,4]*v*v))
    return torch.stack([H,L*U,L],-1)

def embed(q):
    h=q[...,0]*np.pi/180;R=q[...,1];L=q[...,2];r=np.sqrt(3)/2*R
    return torch.stack([L-R/2,r*torch.cos(h),r*torch.sin(h)],-1)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--iterations',type=int,default=450)
    ap.add_argument('--mode',choices=['metric','visual','continuation'],default='metric')
    ap.add_argument('--fine',action='store_true');ap.add_argument('--start',default='baseline');ap.add_argument('--layers',type=int,default=2)
    ap.add_argument('--strength',type=float,default=0);ap.add_argument('--name',required=True)
    args=ap.parse_args();torch.set_num_threads(1);torch.set_default_dtype(torch.float64)
    cache_path=HERE/('results/cache-fine.json' if args.fine else 'results/cache.json');cache=json.loads(cache_path.read_text());rec=cache['baseline'];shift=torch.tensor(float(rec['neutral_shift']))
    start=np.array(rec['coefficients'][0])
    if args.start=='zero':start=np.zeros_like(start)
    elif args.start!='baseline':start=np.array(json.loads((HERE/args.start).read_text())['coefficients'][0])
    if len(start)>args.layers:raise ValueError('Cannot silently discard layers')
    start=np.pad(start,((0,args.layers-len(start)),(0,0),(0,0)))
    initial=torch.tensor(start);C=initial.clone().requires_grad_()
    p=cache['pairs'];a=torch.tensor(p['a']);b=torch.tensor(p['b']);dv=torch.tensor(p['dv']);weights=torch.tensor(p['w'])
    vv=(weights*dv*dv).sum()
    # The full-domain coefficients and shared neutral progression remain frozen.
    freq=torch.tensor([1]+[k*k for k in range(1,7) for _ in range(2)])
    if args.mode!='metric':
        import colour
        H,N=cache['H'],cache['N'];grid=np.fromfile(HERE/('results/source-grid-fine.f64' if args.fine else 'results/source-grid.f64'),dtype='<f8').reshape(H,N,N,3)
        proxy=colour.XYZ_to_Oklab(grid)
        assert np.isfinite(proxy).all()
        image=torch.tensor(np.concatenate([proxy,grid[...,1:2]],axis=-1)).permute(0,3,1,2).contiguous()
        points=[]
        for h in range(H):
            ramps=[]
            for axis,fixeds in [('reach',[.12,.28,.5,.72,.9,1]),('level',[0,.12,.28,.5,.72,.9])]:
                for fixed in fixeds:
                    ramps.append([[360*h/H,fixed*t,fixed] if axis=='reach' else [360*h/H,fixed,fixed+(1-fixed)*t] for t in np.linspace(0,1,129 if args.fine else 65)])
            points.append(ramps)
        output=torch.tensor(points)
    def assess(C):
        ea=embed(coordinates(a,C,shift));eb=embed(coordinates(b,C,shift))
        d=torch.sqrt(((ea-eb)**2).sum(-1)+1e-30)
        wd=weights*d;stress2=1-(wd*dv).sum()**2/((wd*d).sum()*vv)
        # Low-amplitude, high-frequency Fourier coefficients are preferred.
        coefficient=1e-7*((C*freq)**2).mean()
        visual=torch.tensor(0.);cv=torch.tensor(0.);rough=torch.tensor(0.);tail=torch.tensor(0.);monoY=torch.tensor(0.);monoC=torch.tensor(0.)
        if args.mode!='metric':
            src=coordinates(output,C,shift,inverse=True)
            l=src[...,2];u=src[...,1]/l.clamp_min(1e-30)
            if args.fine:
                # Cosine-grid coordinates, with safe endpoint derivatives.
                u=torch.acos((1-2*u).clamp(-1+1e-12,1-1e-12))/np.pi
                l=torch.acos((1-2*l).clamp(-1+1e-12,1-1e-12))/np.pi
            g=torch.stack([2*u-1,2*l-1],-1)
            vals=F.grid_sample(image,g,mode='bilinear',padding_mode='border',align_corners=True).permute(0,2,3,1)
            ds=torch.sqrt(((vals[:,:,1:,:3]-vals[:,:,:-1,:3])**2).sum(-1)+1e-20)[:,:,2:-2]
            normal=ds/ds.mean(-1,keepdim=True).clamp_min(1e-10)
            cv=((normal-1)**2).mean()
            # Mean squared acceleration in per-ramp mean-step units. ReLU tail
            # penalizes exceptionally concentrated steps without hiding them.
            rough=((normal[:,:,1:]-normal[:,:,:-1])**2).mean()
            tail=F.relu(normal-3).square().mean()
            visual=cv+(2. if args.fine else .5)*rough+.25*tail
            if args.fine:
                dy=vals[:,6:,1:,3]-vals[:,6:,:-1,3]
                dy=dy/dy.abs().mean(-1,keepdim=True).clamp_min(1e-9)
                monoY=F.relu(-dy).square().mean()
                chroma=torch.sqrt(vals[:,:6,:,1].square()+vals[:,:6,:,2].square()+1e-20)
                dc=chroma[:,:,1:]-chroma[:,:,:-1]
                dc=dc/dc.abs().mean(-1,keepdim=True).clamp_min(1e-9)
                monoC=F.relu(-dc).square().mean()
                visual=visual+.5*monoY+.25*monoC
        loss=stress2+coefficient+args.strength*visual
        return loss,{'weighted_stress':100*float(stress2.detach().clamp_min(0).sqrt()),'cv2':float(cv.detach()),'rough2':float(rough.detach()),'tail2':float(tail.detach()),'monoY':float(monoY.detach()),'monoC':float(monoC.detach()),'coefficient_penalty':float(coefficient.detach()),'visual':float(visual.detach()),'loss':float(loss.detach())}
    log=[];n=0;t=time.monotonic();best=None
    opt=torch.optim.LBFGS([C],lr=.7,max_iter=args.iterations,history_size=30,line_search_fn='strong_wolfe',tolerance_grad=2e-9,tolerance_change=1e-12)
    def closure():
        nonlocal n,best
        opt.zero_grad();loss,stats=assess(C)
        if not torch.isfinite(loss):raise FloatingPointError('Nonfinite fit objective')
        loss.backward();n+=1
        if best is None or stats['loss']<best[0]:best=(stats['loss'],C.detach().clone(),stats)
        if n%25==1:log.append({'evaluation':n,**stats});print(args.name,n,stats,flush=True)
        return loss
    opt.step(closure)
    C=best[1];_,stats=assess(C)
    record=copy.deepcopy(rec);record['id']='HRL-0.9-native-sRGB-'+args.name;record['variant']=args.name;record['layers']=args.layers
    full=np.asarray(record['coefficients'][1]);full=np.pad(full,((0,args.layers-len(full)),(0,0),(0,0)))
    record['coefficients']=[C.tolist(),full.tolist()]
    record.pop('source_record_sha256',None);record.pop('scores',None)
    record['research']={'parent':'native sRGB C1 with own sRGB B/W/V source atlas','fit':vars(args),'frozen':['carrier','physical solid','hue field and high-magnitude continuation','hue ring','native sRGB source atlas','full-gamut definitions','neutral shift'],'human_training':['COMBVD'],'not_used_for_training':['OSA-UCS','MacAdam1974','Xiao','threshold/tolerance data'],'proxy':f'Oklab of exact source XYZ cached on {cache["H"]}x{cache["N"]}x{cache["N"]} grid; bilinear interpolation only in optimization regularizer, never production runtime','cache_sha256':hashlib.sha256(cache_path.read_bytes()).hexdigest(),'metrics':stats,'evaluations':n,'seconds':time.monotonic()-t}
    (HERE/f'results/{args.name}.json').write_text(json.dumps(record,indent=2)+'\n')
    (HERE/f'results/{args.name}-trace.json').write_text(json.dumps(log,indent=2)+'\n')
    print('FINISHED',args.name,stats,time.monotonic()-t,flush=True)

if __name__=='__main__':main()
