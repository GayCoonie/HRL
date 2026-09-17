"""Synchronous batch adapter; every color is converted by the actual JS checkpoint."""
import json, subprocess
from pathlib import Path
from collections import Counter
import numpy as np

class HRL:
    def __init__(self, gamut='full', variant='parent'):
        self.gamut, self.variant = gamut, variant
        self.name = f'HRL 0.8A {variant} ({gamut})'
        self.trained_on = ['combvd', 'hung_berns', 'ebner_fairchild', 'munsell']
        self.proc = subprocess.Popen(['node', str(Path(__file__).with_name('bridge.mjs'))],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
        self.reset_audit()
    def reset_audit(self):
        self.audit={'calls':0,'points':0,'invalid':0,'error_counts':{},'examples':[]}
    def call(self, op, data):
        x=np.atleast_2d(np.asarray(data,dtype=float))
        payload={'op':op,'gamut':self.gamut,'variant':self.variant,'data':x.tolist()}
        self.proc.stdin.write(json.dumps(payload,allow_nan=False)+'\n'); self.proc.stdin.flush()
        line=self.proc.stdout.readline()
        if not line: raise RuntimeError('JS process stopped: '+self.proc.stderr.read())
        out=json.loads(line)
        if 'fatal' in out: raise RuntimeError(out['fatal'])
        self.audit['calls']+=1; self.audit['points']+=len(x)
        self.audit['invalid']+=len(out['errors'])
        for e in out['errors']:
            msg=e['type']+': '+e['message']
            self.audit['error_counts'][msg]=self.audit['error_counts'].get(msg,0)+1
            if len(self.audit['examples'])<8:self.audit['examples'].append({'input':x[e['index']].tolist(),**e})
        return np.asarray(out['data'],dtype=float)
    def forward(self, xyz): return self.call('forward',xyz)
    def inverse(self, e): return self.call('inverse',e)
    def coordinates(self, xyz): return self.call('coordinates',xyz)
    def source(self, xyz): return self.call('source',xyz)
    def to_xyz(self, hrl): return self.call('toXYZ',hrl)
    def close(self):
        if self.proc.poll() is None:
            self.proc.stdin.close(); self.proc.wait(timeout=10)
