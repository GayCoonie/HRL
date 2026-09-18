"""Balanced-parent refinement with per-hue risk and equilateral sheet regularity.
All path and sheet penalties are synthetic GenSpace diagnostics, not observer data.
"""
from pathlib import Path
import argparse,copy,json,time,hashlib,math,importlib.util
import numpy as np
import torch
import torch.nn.functional as F
P=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('parent_fit',P/'../gen-tonal-fit/fit.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
from conditioning import log_condition
coords,features,embed=base.coords,base.features,base.embed

def main():
    ap=argparse.ArgumentParser()
    for key,default,typ in [('name',None,str),('start','parent',str),('steps',700,int),('stride',2,int),('samples',97,int),('visual',.28,float),('fair',.6,float),('sheet',.08,float),('corner',1.,float),('guard',2.,float),('blue',.75,float),('layers',5,int),('mode','bilinear',str),('gridroot','results',str),('metricguard',300.,float),('gain',.001,float),('conditioning',.002,float),('conditionlimit',40.,float),('unweighted',.1,float)]:
        ap.add_argument('--'+key,default=default,type=typ,required=key=='name')
    args=ap.parse_args();torch.set_default_dtype(torch.float64);torch.set_num_threads(1);torch.manual_seed(180917);np.random.seed(180917);torch.use_deterministic_algorithms(True)
    parentpath=P/'../hue-fair-refine/results/balanced.json';parent=json.loads(parentpath.read_text());startpath=parentpath if args.start=='parent' else P/f'trials/{args.start}.json';rec=json.loads(startpath.read_text())
    cc=np.array(rec['coefficients'][0]);assert args.layers>=len(cc);cc=np.pad(cc,((0,args.layers-len(cc)),(0,0),(0,0)))
    C=torch.tensor(cc,requires_grad=True);D=torch.tensor(rec['dark']['coefficients'],requires_grad=True);shift=torch.tensor(parent['neutral_shift'])
    gridpath=P/args.gridroot/'grid.json';grid=json.loads(gridpath.read_text());HH,N=grid['H'],grid['N'];hh=list(range(0,HH,args.stride));hs=torch.tensor(hh)*360/HH;NH=len(hh)
    fb=features(hs)[:,None,None,:]
    ratios=[.06,.16,.32,.5,.7,.88,1.];others=[.025,.06,.12,.22,.4,.65,.88];families=['black','white','exchange','reach']
    points=[]
    for H in hs.tolist():
        paths=[]
        for fam in families:
            for r in (ratios if fam in ['black','white'] else others):
                paths.append([[H,r*t,t] if fam=='black' else [H,(1-t)*r,t+(1-t)*r] if fam=='white' else [H,r,r+(1-r)*t] if fam=='exchange' else [H,r*t,r] for t in np.linspace(0,1,args.samples)])
        points.append(paths)
    q=torch.tensor(points);M=7
    # Local stencils in R,L. Hessian norm below is pulled back to the equilateral embedding.
    centres=[(i/32,j/32) for j in range(4,31,2) for i in range(2,j-1,2)]
    centres += [(L*u,L) for L in [.02,.04,.08,.12,.18,.3] for u in [.18,.4,.65,.84,.94,.985]]
    radii=np.array([min(1/64,R/2,(L-R)/3,(1-L)/2) for R,L in centres])
    offsets=[(0,0),(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]
    sq=torch.tensor([[[[H,R+a*h,L+b*h] for a,b in offsets] for (R,L),h in zip(centres,radii)] for H in hs.tolist()]);hhstep=torch.tensor(radii)[None,:,None]
    hueweight=1+args.blue*torch.exp(-.5*(((hs-273+180)%360-180)/20)**2);hueweight=hueweight/hueweight.mean()
    # More neutral-exchange attention than 0.11; near-black Reach paths are now explicitly sampled.
    fw=torch.tensor([1.]*(2*M)+[.7]*(2*M))[None,:,None]
    paircache=json.loads((P/'results/cache.json').read_text());profiles=[]
    def sample(q,c,d,image):
        b=coords(q,c,d,shift,True,fb);l=b[...,2];u=b[...,1]/l.clamp_min(1e-30)
        uv=torch.acos((1-2*u).clamp(-1+1e-14,1-1e-14))/math.pi
        lv=torch.acos((1-2*l).clamp(-1+1e-14,1-1e-14))/math.pi
        return F.grid_sample(image,torch.stack([2*uv-1,2*lv-1],-1),mode=args.mode,padding_mode='border',align_corners=True).permute(0,2,3,1)
    def path_terms(v):
        vec=v[:,:,1:]-v[:,:,:-1];step=torch.linalg.vector_norm(vec,dim=-1).clamp_min(1e-12);ds=step[:,:,2:-2];norm=ds/ds.mean(-1,keepdim=True).clamp_min(1e-12)
        per=(norm-1).square().mean(-1)+2*(norm[:,:,1:]-norm[:,:,:-1]).square().mean(-1)+.25*F.relu(norm-3).square().mean(-1)
        risk=(per*fw[...,0]).mean(-1)
        db=torch.linalg.vector_norm(v[:,:M]-v[:,:M,:1],dim=-1);dw=torch.linalg.vector_norm(v[:,M:2*M]-v[:,M:2*M,-1:],dim=-1)
        nb=(db[:,:,1:]-db[:,:,:-1])/step[:,:M].mean(-1,keepdim=True).clamp_min(1e-12)
        nw=(dw[:,:,1:]-dw[:,:,:-1])/step[:,M:2*M].mean(-1,keepdim=True).clamp_min(1e-12)
        retreat=.5*(F.relu(-nb).square().mean()+F.relu(nw).square().mean())
        ed=db[:,M-1:M]/db[:,M-1:M,-1:].clamp_min(1e-12)
        return risk,retreat,ed,norm
    def sheet_terms(v):
        h=hhstep;f0=v[:,:,0];dr=(v[:,:,1]-v[:,:,2])/(2*h);dl=(v[:,:,3]-v[:,:,4])/(2*h)
        drr=(v[:,:,1]+v[:,:,2]-2*f0)/h.square();dll=(v[:,:,3]+v[:,:,4]-2*f0)/h.square();drl=(v[:,:,5]-v[:,:,6]-v[:,:,7]+v[:,:,8])/(4*h.square())
        dx=(2*dr+dl)/math.sqrt(3);dz=dl
        dxx=(4*drr+4*drl+dll)/3;dxz=(2*drl+dll)/math.sqrt(3);dzz=dll
        # Dimensionless normalized bending at a fixed reference spatial scale 1/32.
        bend=(dxx.square()+2*dxz.square()+dzz.square()).sum(-1)/((dx.square()+dz.square()).sum(-1).clamp_min(1e-8))* (1/32)**2
        robust=torch.log1p(bend)
        per=robust.mean(-1)+.25*torch.sqrt(robust.square().mean(-1)+1e-18)
        return per,bend
    pc=torch.tensor(parent['coefficients'][0]);pd=torch.tensor(parent['dark']['coefficients'])
    for g in ['srgb','full']:
        z=paircache['profiles'][g];image=torch.tensor(np.fromfile(P/args.gridroot/f'gen-grid-{g}.f64',dtype='<f8').reshape(HH,N,N,3)[hh]).permute(0,3,1,2).contiguous()
        p={k:torch.tensor(z[k]) for k in ['a','b','dv','w']};p.update(gamut=g,image=image,fa=features(p['a'][...,0]),fb=features(p['b'][...,0]))
        with torch.no_grad():
            pv=sample(q,pc,pd,image);p['base_risk'],_,p['base_edge'],_=path_terms(pv);p['base_sheet'],_=sheet_terms(sample(sq,pc,pd,image))
            dd=torch.linalg.vector_norm(embed(coords(p['a'],pc,pd,shift,feat=p['fa']))-embed(coords(p['b'],pc,pd,shift,feat=p['fb'])),dim=-1);ww,v=p['w'],p['dv'];p['base_stress2']=1-(ww*dd*v).sum().square()/((ww*dd*dd).sum()*(ww*v*v).sum())
        profiles.append(p)
    gm=(q[:,M-1:M,:,2]>=.04)&(q[:,M-1:M,:,2]<=.5)
    freq=torch.tensor([1]+[k*k for k in range(1,7) for _ in range(2)])
    cq=torch.tensor([[H,L*U,L] for H in hs.tolist() for L in [.001,.005,.02,.05,.1,.25,.5,.8,.95,.995] for U in [.005,.05,.2,.5,.8,.95,.99,.999]])
    with torch.no_grad():
        initial_cond=log_condition(cq,pc,pd,shift,base)[0]
    condition_limit=math.log(args.conditionlimit)
    def riskagg(x):return (x*hueweight).mean()+args.fair*torch.sqrt((x.square()*hueweight).mean()+1e-20)
    def assess():
        total=0;stats={}
        lc,_,_=log_condition(cq,C,D,shift,base)
        conditioning=(F.relu(lc-condition_limit).square()).mean()
        for p in profiles:
            de=torch.linalg.vector_norm(embed(coords(p['a'],C,D,shift,feat=p['fa']))-embed(coords(p['b'],C,D,shift,feat=p['fb'])),dim=-1).clamp_min(1e-15);w,dv=p['w'],p['dv'];st=1-(w*de*dv).sum().square()/((w*de*de).sum()*(w*dv*dv).sum())
            risk,retreat,edge,norm=path_terms(sample(q,C,D,p['image']));sheet,bending=sheet_terms(sample(sq,C,D,p['image']))
            guard=((F.relu(edge-p['base_edge']-.018).square()+.4*F.relu(.85*p['base_edge']-edge).square())[gm]).mean()
            # Soft guards discourage purchasing tail improvements by large regressions in already good hues.
            regret=F.relu(risk-1.1*p['base_risk']-.005).square().mean()
            metric_guard=F.relu(st-p['base_stress2']+args.gain).square()
            unweighted=1-(de*dv).sum().square()/((de*de).sum()*(dv*dv).sum())
            loss=st+args.unweighted*unweighted+args.visual*riskagg(risk)+args.sheet*riskagg(sheet)+args.corner*retreat+args.guard*guard+2*regret+args.metricguard*metric_guard
            total=total+.5*loss
            stats[p['gamut']]={k:float(x.detach()) for k,x in {'stress':100*st.clamp_min(0).sqrt(),'unweighted':100*unweighted.clamp_min(0).sqrt(),'conditionPenalty':conditioning,'maxLogCondition':lc.max(),'pathRisk':risk.mean(),'worstHue':risk.max(),'bluePathRisk':risk[((hs-273+180)%360-180).abs()<23].mean(),'sheetBending':sheet.mean(),'worstSheet':sheet.max(),'blueSheet':sheet[((hs-273+180)%360-180).abs()<23].mean(),'retreat':retreat,'darkGuard':guard,'regret':regret}.items()}
        return total+args.conditioning*conditioning+1e-7*(C*freq).square().mean()+1e-6*D[1:].square().mean(),stats
    start=time.monotonic();calls=0;best=None;log=(P/f'trials/{args.name}.jsonl').open('w')
    def save(best):
        loss,cc,dd,stats,evaluation=best;r=copy.deepcopy(rec);r.update(id='HRL-0.13-boundary-tonal-'+args.name,variant=args.name,layers=args.layers,coefficients=[cc.tolist()]);r['dark']['coefficients']=dd.tolist()
        r['research']={'ruler':'helmlab-1.0.0-genspace','human_training':['COMBVD'],'parent':'0.12 refined balanced, boundary-only transported realization','parent_sha256':hashlib.sha256(parentpath.read_bytes()).hexdigest(),'start':str(startpath.relative_to(P)),'start_sha256':hashlib.sha256(startpath.read_bytes()).hexdigest(),'fit':vars(args),'grid_record':grid,'seed':180917,'per_gamut_objective_weights':[.5,.5],'synthetic':'Analytic conditioning tail, weighted/unweighted COMBVD, per-hue weighted mean/RMS path risk; equilateral Hessian/gradient bending; black/white corner retreats; parent dark-edge and good-hue guards','sheet_stencils':len(centres),'sheet_reference_scale':1/32,'sheet_penalty_transform':'log1p of normalized bending, to avoid tiny-stencil outliers overwhelming the fit','blue_window':{'centre':273,'sigma':20,'amplitude':args.blue,'basis':'User-reported region, not observer dataset'},'stats':stats,'best_loss':loss,'best_evaluation':evaluation,'evaluations':calls,'seconds':time.monotonic()-start,'versions':{'torch':torch.__version__,'numpy':np.__version__},'boundary':'cie1931-2deg-1nm-linear-cone','conditioning':'Analytic shared-map Jacobian in equilateral coordinates, common input grid across gamuts; log condition tail penalty','old_lightness_power_target':False, 'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'data_exposure':'Prior development exposed evaluation datasets; no new held-out result used in this loss.'}
        (P/f'trials/{args.name}.json').write_text(json.dumps(r,indent=2)+'\n')
    opt=torch.optim.LBFGS([C,D],lr=.55,max_iter=args.steps,history_size=30,line_search_fn='strong_wolfe',tolerance_grad=1e-8,tolerance_change=1e-12)
    def closure():
        nonlocal calls,best
        opt.zero_grad();loss,stats=assess();assert torch.isfinite(loss);loss.backward();assert torch.isfinite(C.grad).all();calls+=1
        row={'evaluation':calls,'elapsed':time.monotonic()-start,'loss':float(loss.detach()),'stats':stats};log.write(json.dumps(row)+'\n');log.flush()
        if best is None or row['loss']<best[0]:best=(row['loss'],C.detach().clone(),D.detach().clone(),stats,calls)
        if calls%50==1:save(best);print(args.name,json.dumps(row),flush=True)
        return loss
    opt.step(closure);save(best);log.close();print('FINISHED',args.name,best[3],flush=True)
if __name__=='__main__':main()
