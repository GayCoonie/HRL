"""Write finite Python/runtime mapping parity fixtures for finalized fit records."""
import argparse,json,hashlib
from pathlib import Path
import numpy as np
import torch
from fit import coordinates
p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('records',nargs='+');a=p.parse_args();out=Path(a.out)
assert not out.exists(),'No receipt overwrite'
torch.set_default_dtype(torch.float64);torch.set_num_threads(1)
rng=np.random.default_rng(261019)
q=[[0.,0.,0.],[0.,0.,1.],[359.99999,1.,1.],[273.,0.,.125],[120.,1e-12,1e-10]]
for _ in range(128):
    h=float(rng.uniform(0,360));l=float(rng.uniform(.0001,.9999));q.append([h,l*float(rng.uniform(.0001,.9999)),l])
Q=torch.tensor(q);records=[]
for f in a.records:
    raw=Path(f).read_bytes();r=json.loads(raw);C=torch.tensor(r['coefficients'][0]);D=torch.tensor(r['dark']['coefficients']);shift=torch.tensor(r['neutral_shift'])
    with torch.no_grad():forward=coordinates(Q,C,D,shift).tolist();inverse=coordinates(Q,C,D,shift,True).tolist()
    records.append({'path':f,'sha256':hashlib.sha256(raw).hexdigest(),'record':r,'fromSource':forward,'toSource':inverse})
out.write_text(json.dumps({'schema':'hrl-global-python-js-parity-v1','points':q,'models':records},indent=2)+'\n')
