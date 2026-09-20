import json,sys,torch
from pathlib import Path
from core import coordinates,embed
P=Path(__file__).resolve().parent;name=sys.argv[1] if len(sys.argv)>1 else 'seed';torch.set_default_dtype(torch.float64);torch.set_num_threads(1);r=json.loads((P/f'results/{name}.json').read_text());d=json.loads((P/f'results/parity-{name}.json').read_text());C,D,N,A=[torch.tensor(r[k],dtype=torch.float64) for k in ['coefficients','dark','neutral','hue_coefficients']];q=torch.tensor([v['q'] for v in d['samples']]);mx=0
for inverse,key in [(False,'forward'),(True,'inverse')]:
 t=coordinates(q,C,D,N,A,inverse,r['hue_enabled']);js=torch.tensor([v[key] for v in d['samples']]);err=(embed(t)-embed(js)).abs().max().item();mx=max(mx,err);assert err<1e-10,(key,err)
print('PASS Python/JS coordinate parity',name,mx)
# Test gradients of the new power/hue directions as well as existing coupling.
for x in [C,D,N,A]:x.requires_grad_(True)
q=q[:20];torch.manual_seed(920);weights=torch.randn((20,3))
def f():return (embed(coordinates(q,C,D,N,A,True,r['hue_enabled']))*weights).sum()+(embed(coordinates(q,C,D,N,A,False,r['hue_enabled']))*weights).sum()
params=[C,D,N]+([A] if r['hue_enabled'] else [])
y=f();grads=torch.autograd.grad(y,params);rel=[]
for x,g in zip(params,grads):
 v=torch.randn_like(x);v/=v.norm();exact=(g*v).sum().item();eps=1e-5
 with torch.no_grad():x.add_(eps*v)
 plus=f().item()
 with torch.no_grad():x.add_(-2*eps*v)
 minus=f().item()
 with torch.no_grad():x.add_(eps*v)
 numeric=(plus-minus)/(2*eps);e=abs(exact-numeric)/max(1,abs(exact),abs(numeric));rel.append(e);assert e<2e-5,(exact,numeric,e)
print('PASS analytic-gradient finite-difference directions',rel)
