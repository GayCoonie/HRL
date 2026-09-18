"""Compare analytic equilateral Jacobians with automatic differentiation.
This checks derivative code, not perceptual uniformity or observer agreement.
"""
from pathlib import Path
import importlib.util,json,sys,hashlib
import numpy as np
import torch
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from conditioning import log_condition
spec=importlib.util.spec_from_file_location('coords_base',P/'../gen-tonal-fit/fit.py');base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
torch.set_default_dtype(torch.float64);torch.set_num_threads(1)
rng=np.random.default_rng(180917);A=torch.tensor([[np.sqrt(3)/2,0],[-.5,1.]]);Ai=torch.linalg.inv(A)
records={'parent':P/'../hue-fair-refine/results/balanced.json'}
records.update({name:P/f'results/{name}.json' for name in ['balanced','metric']})
result={'seed':180917,'samplesPerModel':128,'basis':'equilateral source and destination x,z','models':{}}
for name,path in records.items():
 r=json.loads(path.read_text());C=torch.tensor(r['coefficients'][0]);D=torch.tensor(r['dark']['coefficients']);shift=torch.tensor(r['neutral_shift']);absmax=relmax=condmax=detmax=0.
 for i in range(128):
  H=float(rng.uniform(0,360));L=float(10**rng.uniform(-5,-1)) if i<32 else float(rng.uniform(.001,.999));U=float(rng.uniform(.001,.999));q=torch.tensor([H,L*U,L]);rl=q[1:].clone().requires_grad_(True)
  fun=lambda z:base.coords(torch.cat([q[:1],z]),C,D,shift)[1:]
  J=torch.autograd.functional.jacobian(fun,rl);E=A@J@Ai
  lc,ea,det=log_condition(q,C,D,shift,base);E2=ea.reshape(2,2);delta=float(torch.max(torch.abs(E-E2)));scale=max(1.,float(torch.max(torch.abs(E))))
  sv=torch.linalg.svdvals(E);cl=torch.log(sv[0]/sv[-1]);dd=torch.linalg.det(E)
  absmax=max(absmax,delta);relmax=max(relmax,delta/scale);condmax=max(condmax,float(torch.abs(cl-lc)));detmax=max(detmax,float(torch.abs(dd-det))/max(1e-10,abs(float(dd))))
 assert relmax<1e-8 and condmax<1e-6 and detmax<1e-7,(name,relmax,condmax,detmax)
 result['models'][name]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'maxAbsoluteJacobianDifference':absmax,'maxScaledJacobianDifference':relmax,'maxLogConditionDifference':condmax,'maxRelativeDeterminantDifference':detmax}
(P/'results/jacobian-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
