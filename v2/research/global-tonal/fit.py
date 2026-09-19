"""Whole-solid shared HRL optimization: all-hue geometry and COMBVD Pareto trials.
The only fixed tonal parameter is the exact Beta1 neutral shift. No baseline
coefficient tether, per-hue regret, dark-edge envelope, or blue objective exists.
"""
from pathlib import Path
import argparse,copy,hashlib,json,math,time,sys,importlib.util,types
import numpy as np
import torch
import torch.nn.functional as F
O=Path(__file__).resolve().parent
P=O.parent/'boundary-tonal'
sys.path.insert(0,str(P))
from conditioning import log_condition
spec=importlib.util.spec_from_file_location('inherited',O.parent/'gen-tonal-fit/fit.py')
inherited=importlib.util.module_from_spec(spec);spec.loader.exec_module(inherited)
features,embed,warp,phi,InversePhi=inherited.features,inherited.embed,inherited.warp,inherited.phi,inherited.InversePhi

def coordinates(q,C,D,shift,inverse=False,feat=None):
    L=q[...,2];U=q[...,1]/L.clamp_min(1e-30)
    feat=features(q[...,0],(C.shape[-1]-1)//2) if feat is None else feat
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

def main():
    ap=argparse.ArgumentParser()
    for k,d,t in [('name',None,str),('gridroot',None,str),('steps',240,int),('samples',65,int),('layers',8,int),('harmonics',8,int),('visual',.15,float),('sheet',.04,float),('corner',.5,float),('unweighted',.2,float),('fair',.35,float),('conditioning',.0002,float),('conditionlimit',100.,float),('seed',260919,int)]:
        ap.add_argument('--'+k,type=t,default=d,required=k in ['name','gridroot'])
    ap.add_argument('--start',choices=['beta1','fresh'],default='beta1')
    args=ap.parse_args();output=O/'trials';output.mkdir(exist_ok=True)
    if any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in args.name):raise ValueError('Unique lowercase name required')
    if any((output/f'{args.name}.{e}').exists() for e in ['json','jsonl']):raise FileExistsError(args.name)
    torch.set_default_dtype(torch.float64);torch.set_num_threads(1);torch.manual_seed(args.seed);np.random.seed(args.seed);torch.use_deterministic_algorithms(True)
    parentpath=P/'results/metric.json';rec=json.loads(parentpath.read_text());gridroot=Path(args.gridroot);grid=json.loads((gridroot/'grid.json').read_text())
    H,N=grid['H'],grid['N'];hs=torch.arange(H)*360/H;K=args.harmonics
    old=np.array(rec['coefficients'][0]);assert args.layers>=old.shape[0] and K>=rec['harmonics']
    if args.start=='beta1':
        init=np.pad(old,((0,args.layers-old.shape[0]),(0,0),(0,2*(K-rec['harmonics']))));di=rec['dark']['coefficients']
    else:
        init=np.random.normal(0,.005,(args.layers,5,2*K+1));di=[-4.]+[0.]*6
    C=torch.tensor(init,requires_grad=True);D=torch.tensor(di,requires_grad=True);shift=torch.tensor(rec['neutral_shift'])
    initialC=init.tolist();initialD=list(di)
    fb=features(hs,K)[:,None,None,:]
    ratios=[.06,.2,.45,.72,1.];others=[.025,.1,.3,.6,.9];M=5
    q=torch.tensor([[[[h,r*t,t] if fam=='black' else [h,(1-t)*r,t+(1-t)*r] if fam=='white' else [h,r,r+(1-r)*t] if fam=='exchange' else [h,r*t,r] for t in np.linspace(0,1,args.samples)] for fam in ['black','white','exchange','reach'] for r in (ratios if fam in ['black','white'] else others)] for h in hs.tolist()])
    centres=[(i/32,j/32) for j in range(4,31,2) for i in range(2,j-1,2)]+[(L*u,L) for L in [.02,.04,.08,.12,.18] for u in [.18,.4,.65,.84]]
    radii=np.array([min(1/64,R/2,(L-R)/3,(1-L)/2) for R,L in centres]);hh=torch.tensor(radii)[None,:,None]
    offsets=[(0,0),(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]
    sq=torch.tensor([[[[H,R+a*h,L+b*h] for a,b in offsets] for (R,L),h in zip(centres,radii)] for H in hs.tolist()])
    def sample(q,image):
        b=coordinates(q,C,D,shift,True,fb);l=b[...,2];u=b[...,1]/l.clamp_min(1e-30)
        uv=torch.acos((1-2*u).clamp(-1+1e-14,1-1e-14))/math.pi;lv=torch.acos((1-2*l).clamp(-1+1e-14,1-1e-14))/math.pi
        return F.grid_sample(image,torch.stack([2*uv-1,2*lv-1],-1),mode='bicubic',padding_mode='border',align_corners=True).permute(0,2,3,1)
    def path_terms(v):
        steps=torch.linalg.vector_norm(v[:,:,1:]-v[:,:,:-1],dim=-1).clamp_min(1e-12);interior=steps[:,:,2:-2];normal=interior/interior.mean(-1,keepdim=True).clamp_min(1e-12)
        risk=((normal-1).square().mean(-1)+2*(normal[:,:,1:]-normal[:,:,:-1]).square().mean(-1)+.25*F.relu(normal-3).square().mean(-1)).mean(-1)
        db=torch.linalg.vector_norm(v[:,:M]-v[:,:M,:1],dim=-1);dw=torch.linalg.vector_norm(v[:,M:2*M]-v[:,M:2*M,-1:],dim=-1)
        nb=(db[:,:,1:]-db[:,:,:-1])/steps[:,:M].mean(-1,keepdim=True);nw=(dw[:,:,1:]-dw[:,:,:-1])/steps[:,M:2*M].mean(-1,keepdim=True)
        retreat=.5*(F.relu(-nb).square().mean()+F.relu(nw).square().mean())
        return risk,retreat
    def sheet_terms(v):
        f=v[:,:,0];dr=(v[:,:,1]-v[:,:,2])/(2*hh);dl=(v[:,:,3]-v[:,:,4])/(2*hh)
        rr=(v[:,:,1]+v[:,:,2]-2*f)/hh.square();ll=(v[:,:,3]+v[:,:,4]-2*f)/hh.square();rl=(v[:,:,5]-v[:,:,6]-v[:,:,7]+v[:,:,8])/(4*hh.square())
        dx=(2*dr+dl)/math.sqrt(3);xx=(4*rr+4*rl+ll)/3;xz=(2*rl+ll)/math.sqrt(3)
        bending=(xx.square()+2*xz.square()+ll.square()).sum(-1)/(dx.square()+dl.square()).sum(-1).clamp_min(1e-8)/1024
        robust=torch.log1p(bending);return robust.mean(-1)+.25*robust.square().mean(-1).sqrt(),bending
    cachepath=P/'results/cache.json';cache=json.loads(cachepath.read_text());profiles=[]
    for g in ['srgb','full']:
        raw=(gridroot/f'gen-grid-{g}.f64').read_bytes();assert hashlib.sha256(raw).hexdigest()==grid['profiles'][g]['sha256']
        image=torch.tensor(np.frombuffer(raw,dtype='<f8').copy().reshape(H,N,N,3)).permute(0,3,1,2).contiguous();p={k:torch.tensor(cache['profiles'][g][k]) for k in ['a','b','dv','w']};p.update(gamut=g,image=image,fa=features(p['a'][...,0],K),fb=features(p['b'][...,0],K));profiles.append(p)
    cq=torch.tensor([[h,L*U,L] for h in hs.tolist() for L in [.005,.02,.1,.3,.6,.9,.99] for U in [.01,.1,.4,.7,.95,.995]])
    derivativebase=types.SimpleNamespace(features=lambda h:features(h,K),warp=warp,InversePhi=InversePhi)
    freq=torch.tensor([1]+[k*k for k in range(1,K+1) for _ in range(2)])
    def aggregate(x):return x.mean()+args.fair*(x.square().mean()+1e-20).sqrt()
    def stress2(d,v,w):return 1-(w*d*v).sum().square()/((w*d*d).sum()*(w*v*v).sum())
    def assess():
        total=0;stats={};lc,_,_=log_condition(cq,C,D,shift,derivativebase);pen=F.relu(lc-math.log(args.conditionlimit)).square();condition=pen.mean()+.2*(pen.square().mean()+1e-20).sqrt()
        for p in profiles:
            de=torch.linalg.vector_norm(embed(coordinates(p['a'],C,D,shift,feat=p['fa']))-embed(coordinates(p['b'],C,D,shift,feat=p['fb'])),dim=-1).clamp_min(1e-15)
            st=stress2(de,p['dv'],p['w']);uw=stress2(de,p['dv'],torch.ones_like(de))
            risk,retreat=path_terms(sample(q,p['image']));sheet,bend=sheet_terms(sample(sq,p['image']))
            loss=st+args.unweighted*uw+args.visual*aggregate(risk)+args.sheet*aggregate(sheet)+args.corner*retreat
            total=total+.5*loss;stats[p['gamut']]={k:float(v.detach()) for k,v in {'stress':100*st.clamp_min(0).sqrt(),'unweighted':100*uw.clamp_min(0).sqrt(),'pathRisk':risk.mean(),'worstHuePathRisk':risk.max(),'sheetRobust':sheet.mean(),'sheetRaw':bend.mean(),'worstHueSheetRaw':bend.mean(-1).max(),'retreat':retreat,'maxLogCondition':lc.max(),'conditionPenalty':condition}.items()}
        return total+args.conditioning*condition+1e-7*(C*freq).square().mean()+1e-6*D[1:].square().mean(),stats
    start=time.monotonic();calls=0;best=None;log=(output/f'{args.name}.jsonl').open('w')
    def save():
        loss,cc,dd,stats,evaluation=best;r=copy.deepcopy(rec);r.update(id='HRL-v2-global-tonal-'+args.name,variant=args.name,layers=args.layers,harmonics=K,coefficients=[cc.tolist()]);r['dark']['coefficients']=dd.tolist()
        r['research']={'schema':'hrl-global-tonal-fit-v1','fit':vars(args),'seed':args.seed,'start':args.start,'initial_coefficients':[initialC],'initial_dark':initialD,'parent_sha256':hashlib.sha256(parentpath.read_bytes()).hexdigest(),'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'cache_sha256':hashlib.sha256(cachepath.read_bytes()).hexdigest(),'grid_record':grid,'ruler':'frozen HelmLab 1.0.0 GenSpace','human_training':['COMBVD'],'populations':{'srgb_retained':3331,'full':3813},'per_gamut_objective_weights':[.5,.5],'hue_weights':'equal at 48 regular hues, no blue window','path_families':['black','white','exchange','reach'],'path_family_weights':[1,1,1,1],'path_ratios':ratios,'other_path_ratios':others,'sheet_centres':centres,'sheet_reference_scale':1/32,'objective':'weighted STRESS squared + weighted unweighted-STRESS squared + all-hue path risk mean/RMS + log1p equilateral sheet bending mean/RMS + corner retreat + common-map conditioning tail + weak frequency decay','removed_constraints':['baseline coefficient tether','baseline metric guard','good-hue regret','baseline dark-edge envelope','blue weighting','blue-specific acceptance gate'],'preserved':['identity hue ring','source charts','physical cone','pseudoRGB carrier','exact frozen neutral shift'],'limits':['Observer pairs are training data; no held-out claim.','GenSpace geometry is synthetic, not new observer evidence.','Source-grid regularizer is approximate; actual JavaScript audit required.','No new ColorBench run.'],'best_loss':loss,'best_evaluation':evaluation,'evaluations':calls,'seconds':time.monotonic()-start,'stats':stats,'versions':{'torch':torch.__version__,'numpy':np.__version__}}
        (output/f'{args.name}.json').write_text(json.dumps(r,indent=2)+'\n')
    optimizer=torch.optim.LBFGS([C,D],lr=.6,max_iter=args.steps,history_size=35,line_search_fn='strong_wolfe',tolerance_grad=1e-8,tolerance_change=1e-12)
    def closure():
        nonlocal calls,best
        optimizer.zero_grad();loss,stats=assess();assert torch.isfinite(loss);loss.backward();assert torch.isfinite(C.grad).all() and torch.isfinite(D.grad).all();calls+=1
        row={'evaluation':calls,'elapsed':time.monotonic()-start,'loss':float(loss.detach()),'stats':stats};log.write(json.dumps(row)+'\n');log.flush()
        if best is None or row['loss']<best[0]:best=(row['loss'],C.detach().clone(),D.detach().clone(),stats,calls)
        if calls%40==1:save();print(args.name,json.dumps(row),flush=True)
        return loss
    optimizer.step(closure);save();log.close();print('FINISHED',args.name,best[3],flush=True)
if __name__=='__main__':main()
