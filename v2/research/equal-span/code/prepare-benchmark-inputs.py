"""Decode pinned COMBVD JSON. Labels/multiplicities verified against both XLSX sheets.
The original workbook is not needed for routine reruns; no pair is rounded.
"""
import json,sys,hashlib
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
p=Path(sys.argv[1]);raw=p.read_bytes()
if hashlib.sha256(raw).hexdigest()!='7a5c6081874fdad626e4cd9198fb977ea538c89161b24f2a19b6b0fab4f291b9':raise ValueError('Not the verified COMBVD input')
data=json.loads(raw);assert len(data)==3813
labels=sum(([s]*n for s,n in [('BFD-P(D65)',2028),('BFD-P( C )',200),('BFD-P(M)',548),('LEEDS',307),('RIT-DuPont',312),('WITT',418)]),[])
M=np.array([[.8951,.2664,-.1614],[-.7502,1.7135,.0367],[.0389,-.0685,1.0296]])
W=np.array([.3127/.329,1,(1-.3127-.329)/.329]);rows=[]
for i,(d,lab) in enumerate(zip(data,labels)):
 mat=np.linalg.inv(M)@np.diag((M@W)/(M@np.array(d['white'])))@M
 rows.append({'index':i,'dataset':lab,'dv':d['dv'],'weight':1 if lab.startswith('BFD-P') else 7 if lab=='WITT' else 9,'xyz1':(mat@d['xyz1']).tolist(),'xyz2':(mat@d['xyz2']).tolist()})
(ROOT/'results/combvd-inputs.json').write_text(json.dumps(rows,separators=(',',':')))
