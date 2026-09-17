"""R/L-only COMBVD refinement with trust-region geometry penalties.

No OSA, Xiao, MacAdam, or threshold-ellipse data enters this optimization.
The real JS source chart is precomputed by cache-fit.mjs. Only its exact
algebraic coupling layers are evaluated differentiably here.
"""
from pathlib import Path
import json,time,hashlib
import numpy as np
import torch

def main():
    torch.set_num_threads(1);torch.set_default_dtype(torch.float64)
    here=Path(__file__).resolve().parent
    cache=json.loads((here/'results/fit-cache.json').read_text())
    definition=json.loads((here/'../../a-smooth/definitions.json').resolve().read_text())
    start=definition['models']['smooth'];baseline=torch.tensor(start['coefficients']);shift=float(start['neutral_shift']);cap=float(start['shift_cap'])
    profiles=[]
    def tensor(x):return torch.tensor(x)
    def features(q):
        h=q[:,0]*np.pi/180
        return torch.stack([torch.ones_like(h)]+[v for k in range(1,7) for v in [torch.cos(k*h),torch.sin(k*h)]],1)
    for g in ['srgb','full']:
        p=cache['profiles'][g];z={k:tensor(p[k]) for k in ['a','b','dv','w','grid','target']}
        z['first']=torch.tensor(p['first'],dtype=torch.long);z['second']=torch.tensor(p['second'],dtype=torch.long)
        for k in ['a','b','grid']:z['f'+k]=features(z[k])
        profiles.append(z)
    def embed(q,F,C):
        L=q[:,2];U=q[:,1]/L.clamp_min(1e-30)
        warp=lambda x,t:x/(x+(1-x)*torch.exp(-t))
        bounded=lambda t:cap*torch.tanh(t/cap)
        L=warp(L,torch.tensor(shift));cs=torch.einsum('nk,ljk->nlj',F,C)
        for layer in range(2):
            c=cs[:,layer,:];L=warp(L,bounded(U*(c[:,0]+c[:,1]*(2*U-1))))
            v=2*L-1;U=warp(U,bounded(c[:,2]+c[:,3]*v+c[:,4]*v*v))
        R=L*U;rad=np.sqrt(3)/2*R
        return torch.stack([L-R/2,rad*F[:,1],rad*F[:,2]],1)
    freq=tensor([1]+[k*k for k in range(1,7) for _ in range(2)])
    def evaluate(C,strength):
        terms=[];stats=[]
        for i,p in enumerate(profiles):
            ea=embed(p['a'],p['fa'],C[i]);eb=embed(p['b'],p['fb'],C[i]);d=torch.sqrt(((ea-eb)**2).sum(1)+1e-30)
            w,dv=p['w'],p['dv'];v=1-(w*d*dv).sum()**2/((w*d*d).sum()*(w*dv*dv).sum())
            delta=embed(p['grid'],p['fgrid'],C[i])-p['target'];f=p['first'];s=p['second']
            d1=(delta[f[:,1]]-delta[f[:,0]])*16;d2=(delta[s[:,0]]-2*delta[s[:,1]]+delta[s[:,2]])*256
            geom=5*(delta**2).mean()+.04*(d1**2).mean()+.0005*(d2**2).mean()
            terms.append(v+strength*geom)
            stats.append({'weighted_stress':100*float(v.detach().clamp_min(0).sqrt()),'grid_rms':float((delta**2).mean().detach().sqrt()),'grid_max':float(delta.abs().max().detach()),'relative_gradient_rms':float((d1**2).mean().detach().sqrt()),'relative_curvature_rms':float((d2**2).mean().detach().sqrt()),'geometry_penalty':float(geom.detach())})
        coefficient_penalty=5e-6*(((C-baseline)*freq)**2).mean()
        return sum(terms)/2+coefficient_penalty,stats
    outputs={}
    for strength in [2.0,.5,.125]:
        C=baseline.clone().requires_grad_();trace=[];calls=[0]
        opt=torch.optim.LBFGS([C],lr=.7,max_iter=120,history_size=15,line_search_fn='strong_wolfe',tolerance_grad=1e-9,tolerance_change=1e-12)
        def closure():
            opt.zero_grad();loss,stats=evaluate(C,strength);loss.backward();calls[0]+=1
            if calls[0]%20==1:
                row={'call':calls[0],'loss':float(loss.detach()),'profiles':stats};trace.append(row);print(strength,row,flush=True)
            return loss
        t=time.monotonic();opt.step(closure);loss,stats=evaluate(C,strength)
        name=str(strength).replace('.','p')
        record=dict(start);record.update({'id':'OPAL-0.8A-RL-C1-'+name,'variant':'C1-'+name,'parent':'OPAL-0.8-A-RL-smooth','coefficients':C.detach().tolist()})
        record.pop('source_record_sha256',None);record.pop('scores',None)
        record['research']={'regularization_strength':strength,'neutral_shift_frozen':True,'hue_ring_frozen':True,'input_sha256':cache['input_sha256'],'method':'COMBVD + displacement/first/second-difference trust region on physical samples of A Smooth; C1 source atlas','held_out_not_used':['osa_ucs_1974','xiao_unique_hues','macadam1974','threshold and tolerance datasets']}
        (here/f'results/fit-{name}.json').write_text(json.dumps(record,indent=2)+'\n')
        outputs[name]={'strength':strength,'profiles':dict(zip(['srgb','full'],stats)),'seconds':time.monotonic()-t,'evaluations':calls[0],'trace':trace}
        (here/'results/fit-summary.json').write_text(json.dumps(outputs,indent=2)+'\n');print('FINISHED',name,stats,flush=True)
if __name__=='__main__':main()
