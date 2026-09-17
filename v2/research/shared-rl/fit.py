"""Single-bank joint sRGB/full calibration; human training is COMBVD only.
Dark-side target is an explicit engineering preference, not observer data.
Grid interpolation appears only in the differentiable regularizer.
"""
from pathlib import Path
import argparse,copy,hashlib,json,time,importlib.util
import numpy as np
import torch
import torch.nn.functional as F
import colour
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('inherited_fit',HERE/'../native-srgb-refit/fit.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)

def amount(H,U,D):return .85*torch.sigmoid(old.features(H,K=3)@D)*U*U

def phi(t,a):return t*(1-a*(1-t).square())
def phi_inverse(y,a):
    t=y.clone()
    for _ in range(12):t=t-(phi(t,a)-y)/(1-a*(1-t)*(1-3*t))
    return t

def coords(q,C,D,shift,inverse=False):
    if inverse:
        L=q[...,2];U=q[...,1]/L.clamp_min(1e-30);L=phi(L,amount(q[...,0],U,D))
        return old.coordinates(torch.stack([q[...,0],L*U,L],-1),C,shift,inverse=True)
    b=old.coordinates(q,C,shift);U=b[...,1]/b[...,2].clamp_min(1e-30);L=phi_inverse(b[...,2],amount(b[...,0],U,D))
    return torch.stack([b[...,0],L*U,L],-1)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--fine',action='store_true');ap.add_argument('--layers',type=int,default=3);ap.add_argument('--name',required=True);ap.add_argument('--start',default='average');ap.add_argument('--steps',type=int,default=500);ap.add_argument('--visual',type=float,default=.05);ap.add_argument('--edge',type=float,default=.5);ap.add_argument('--edge-power',type=float,default=1.08);args=ap.parse_args()
    torch.set_num_threads(1);torch.set_default_dtype(torch.float64);cache_path=HERE/('results/cache-fine.json' if args.fine else 'results/cache.json');cache=json.loads(cache_path.read_text());H,N=cache['H'],cache['N'];baseline=cache['profiles']['srgb']['baseline'];shift=torch.tensor(baseline['neutral_shift']);assert cache['profiles']['full']['baseline']['neutral_shift']==baseline['neutral_shift']
    C0=(np.array(cache['profiles']['srgb']['baseline']['coefficients'][0])+np.array(cache['profiles']['full']['baseline']['coefficients'][1]))/2
    D0=np.zeros(7);D0[0]=0.
    if args.start not in ['average','zero']:
        r=json.loads((HERE/'results'/f'{args.start}.json').read_text());C0=np.asarray(r['coefficients'][0]);D0=np.asarray(r['dark']['coefficients'])
    elif args.start=='zero':C0[:]=0
    assert args.layers>=len(C0)
    C0=np.pad(C0,((0,args.layers-len(C0)),(0,0),(0,0)))
    C=torch.tensor(C0,requires_grad=True);D=torch.tensor(D0,requires_grad=True)
    points=[];edgepoints=[]
    for h in range(H):
        ramps=[]
        for axis,fixeds in [('reach',[.08,.2,.4,.65,.85,1]),('level',[0,.08,.2,.4,.65,.85])]:
            for fixed in fixeds:ramps.append([[h*360/H,t*fixed,fixed] if axis=='reach' else [h*360/H,fixed,fixed+(1-fixed)*t] for t in np.linspace(0,1,129 if args.fine else 97)])
        points.append(ramps);edgepoints.append([[[h*360/H,U*t,t] for t in np.linspace(0,1,81)] for U in [.35,.7,.9,1]])
    output=torch.tensor(points);edgeout=torch.tensor(edgepoints);ts=edgeout[...,2];target=ts.pow(args.edge_power)
    edgeweights=1+5*torch.exp(-((ts-.22)/.2).square());edgeweights=edgeweights*torch.tensor([.15,.45,.8,1])[None,:,None]
    profiles=[]
    for gamut in ['srgb','full']:
        p=cache['profiles'][gamut];grid=np.fromfile(HERE/('results/grid-'+('fine-' if args.fine else '')+gamut+'.f64'),dtype='<f8').reshape(H,N,N,3)
        image=torch.tensor(np.concatenate([colour.XYZ_to_Oklab(grid),grid[...,1:2]],axis=-1)).permute(0,3,1,2).contiguous()
        profiles.append({k:torch.tensor(p[k]) for k in ['a','b','dv','w']}|{'image':image,'gamut':gamut})
    freq=torch.tensor([1]+[k*k for k in range(1,7) for _ in range(2)])
    def sampled(q,image):
        b=coords(q,C,D,shift,True);l=b[...,2];u=b[...,1]/l.clamp_min(1e-30)
        u=torch.acos((1-2*u).clamp(-1+1e-12,1-1e-12))/np.pi;l=torch.acos((1-2*l).clamp(-1+1e-12,1-1e-12))/np.pi
        return F.grid_sample(image,torch.stack([2*u-1,2*l-1],-1),mode='bilinear',padding_mode='border',align_corners=True).permute(0,2,3,1)
    def evaluate():
        total=0;stats={}
        for p in profiles:
            d=(old.embed(coords(p['a'],C,D,shift))-old.embed(coords(p['b'],C,D,shift))).square().sum(-1).add(1e-30).sqrt();w,dv=p['w'],p['dv'];st=1-(w*d*dv).sum().square()/((w*d*d).sum()*(w*dv*dv).sum())
            vals=sampled(output,p['image']);ds=(vals[:,:,1:,:3]-vals[:,:,:-1,:3]).square().sum(-1).add(1e-20).sqrt()[:,:,2:-2];normal=ds/ds.mean(-1,keepdim=True).clamp_min(1e-9)
            cv=(normal-1).square().mean();rough=(normal[:,:,1:]-normal[:,:,:-1]).square().mean();tail=F.relu(normal-3).square().mean()
            ed=sampled(edgeout,p['image']);progress=ed[...,0]/ed[:,:,-1:,0].clamp_min(1e-7);edge=((progress-target).square()*edgeweights).mean()
            ddy=ed[:,:,1:,3]-ed[:,:,:-1,3];mneg=F.relu(-ddy/ddy.abs().mean(-1,keepdim=True).clamp_min(1e-9)).square().mean()
            de=ed[:,:,1:,0]-ed[:,:,:-1,0];en=de/de.abs().mean(-1,keepdim=True).clamp_min(1e-9);erough=(en[:,:,1:]-en[:,:,:-1]).square().mean()
            visual=cv+2*rough+.25*tail+.5*mneg+.35*erough
            total=total+.5*(st+args.visual*visual+args.edge*edge)
            stats[p['gamut']]={'stress':100*float(st.detach().clamp_min(0).sqrt()),'cv2':float(cv.detach()),'rough':float(rough.detach()),'edge_error':float(edge.detach()),'edge_progress_at_quarter':float(progress[:,-1,20].mean().detach()),'negative_Y':float(mneg.detach()),'edge_rough':float(erough.detach())}
        total=total+1e-7*(C*freq).square().mean()+1e-6*D[1:].square().mean()
        return total,stats
    best=None;trace=[];calls=0;t=time.monotonic()
    opt=torch.optim.LBFGS([C,D],lr=.6,max_iter=args.steps,history_size=30,line_search_fn='strong_wolfe',tolerance_grad=1e-8,tolerance_change=2e-12)
    def closure():
        nonlocal best,calls
        opt.zero_grad();loss,stats=evaluate();assert torch.isfinite(loss);loss.backward();calls+=1
        if best is None or float(loss.detach())<best[0]:best=(float(loss.detach()),C.detach().clone(),D.detach().clone(),stats)
        if calls%25==1:trace.append({'call':calls,'loss':float(loss.detach()),**stats});print(args.name,trace[-1],flush=True)
        return loss
    opt.step(closure);loss,cc,dd,stats=best
    rec={k:copy.deepcopy(v) for k,v in baseline.items() if k not in ['coefficients','research','scores','source_record_sha256']}
    rec.update({'id':'HRL-0.10-shared-'+args.name,'variant':args.name,'gamut_calibration':'shared','coefficients':[cc.tolist()],'layers':len(cc),'dark':{'kind':'inverse-t-minus-a-t-one-minus-t-squared','harmonics':3,'cap':.85,'coefficients':dd.tolist()},'research':{'recipe':vars(args),'human_training':['COMBVD'],'gamut_objective_weights':{'srgb':.5,'full':.5},'geometry_only_gamut_context':True,'dark_target':'own endpoint-normalized Oklab lightness progression t^edge_power: engineering preference, not observation or Level definition','stats':stats,'seconds':time.monotonic()-t,'evaluations':calls,'cache_sha256':hashlib.sha256(cache_path.read_bytes()).hexdigest()}})
    (HERE/f'results/{args.name}.json').write_text(json.dumps(rec,indent=2)+'\n');(HERE/f'results/{args.name}-trace.json').write_text(json.dumps(trace,indent=2)+'\n');print('FINISHED',args.name,stats,flush=True)
if __name__=='__main__':main()
