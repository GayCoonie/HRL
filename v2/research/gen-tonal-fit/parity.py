"""Compare training-coordinate math and implicit gradient with the actual JS map."""
from pathlib import Path
import importlib.util,json,subprocess,numpy as np,torch
P=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('genfit',P/'fit.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
torch.set_default_dtype(torch.float64);torch.set_num_threads(1)
rng=np.random.default_rng(170917);x=rng.random((2048,3));x[:,0]*=360;x[:,1]*=x[:,2];x[:32,2]=10**np.linspace(-9,-2,32);x[:32,1]=x[:32,2]*rng.random(32)
result={'seed':170917,'coordinates':2048,'models':{}}
for name in ['balanced','metric']:
 rec=json.loads((P/f'results/{name}.json').read_text());C=torch.tensor(rec['coefficients'][0]);D=torch.tensor(rec['dark']['coefficients']);shift=torch.tensor(rec['neutral_shift']);q=torch.tensor(x)
 py=m.coords(q,C,D,shift).detach().numpy();pi=m.coords(q,C,D,shift,True).detach().numpy()
 js="""import fs from 'node:fs';import {sharedCoordinates} from '../shared-rl/core.mjs';const p=JSON.parse(fs.readFileSync(0,'utf8'));console.log(JSON.stringify(p.q.map(x=>{let q={H:x[0],R:x[1],L:x[2]};return [sharedCoordinates(q,p.rec),sharedCoordinates(q,p.rec,true)];})));"""
 f=P/'_parity-temp.mjs';f.write_text(js)
 try:out=json.loads(subprocess.check_output(['node',str(f)],input=json.dumps({'q':x.tolist(),'rec':rec}),text=True))
 finally:f.unlink()
 a=np.array([[r[0]['H'],r[0]['R'],r[0]['L']] for r in out]);b=np.array([[r[1]['H'],r[1]['R'],r[1]['L']] for r in out]);err=max(np.abs(a-py).max(),np.abs(b-pi).max());assert err<1e-10,err;result['models'][name]={'maxForwardInverseCoordinateDifference':float(err)}
y=torch.tensor([.0001,.1,.5,.9],requires_grad=True);a=torch.tensor([.84,.7,.8,.84],requires_grad=True);result['implicitInverseGradientCheck']=bool(torch.autograd.gradcheck(m.InversePhi.apply,(y,a),eps=1e-6,atol=1e-7,rtol=1e-5));assert result['implicitInverseGradientCheck']
(P/'results/python-js-parity.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
