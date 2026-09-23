"""Pinned original ColorBench judges; new candidate adapter, external output only.

COMBVD source rows, white adaptation, judge functions and _space_forward are
unchanged. This runs five scored generation and sixteen scored measurement
columns, not the unscored suites. See benchmark.mjs for retained population and
per-six-family development scores.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import shutil
import time
import numpy as np

HERE = Path(__file__).resolve().parent
COLORBENCH = '12b2de215cc5020682e3d245a8c78bce5f0ebbc9'
POOL = '8641f4e8ebd9d85a34dc0fedc116fa0e58493190'


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def candidate_identity(module, record):
    if not module or not record:
        raise ValueError('Candidate entry and explicit frozen record are required')
    return json.loads(subprocess.check_output([
        'node','--experimental-vm-modules','--no-warnings',str(HERE/'source-identity.mjs'),
        str(Path(module).resolve()),str(Path(record).resolve())], text=True))


class Space:
    def __init__(self, model, gamut, module=None, factory=None, record=None, identity=None):
        self.name = model + '-' + gamut
        self.trained_on = ['combvd']
        config = dict(model=model, gamut=gamut, module=module, factory=factory, record=record, identity=identity)
        self.proc = subprocess.Popen(['node', str(HERE / 'bridge.mjs'), json.dumps(config)],
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE, text=True, bufsize=1)
        self.reset()

    def reset(self):
        self.audit = dict(points=0, mapped=0, rejected=0, eventCounts={})
        self.flags = []

    def forward(self, xyz):
        if hasattr(xyz, 'detach'):
            xyz = xyz.detach().cpu().numpy()
        xyz = np.atleast_2d(np.asarray(xyz, dtype=np.float64))
        blocks = []
        for start in range(0, len(xyz), 1024):
            self.proc.stdin.write(json.dumps({'data': xyz[start:start+1024].tolist()}, allow_nan=False) + '\n')
            self.proc.stdin.flush()
            line = self.proc.stdout.readline()
            if not line:
                raise RuntimeError('JS adapter exited: ' + self.proc.stderr.read())
            result = json.loads(line)
            if result.get('fatal'):
                raise RuntimeError(result['fatal'])
            for key in ['points', 'mapped', 'rejected']:
                self.audit[key] += result['audit'][key]
            for event, count in result['audit']['eventCounts'].items():
                self.audit['eventCounts'][event] = self.audit['eventCounts'].get(event, 0) + count
            self.flags.extend(result['flags'])
            data = np.asarray(result['data'], dtype=float)
            if not np.isfinite(data).all():
                raise RuntimeError('Nonfinite forwarded coordinates')
            blocks.append(data)
        return np.concatenate(blocks) if blocks else np.empty((0, 3))

    def close(self):
        self.proc.stdin.close()
        self.proc.wait(timeout=15)
        if self.proc.returncode:
            raise RuntimeError(self.proc.stderr.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--colorbench', type=Path, required=True)
    ap.add_argument('--pool', type=Path, required=True, help='Pinned dataset repository /datasets directory')
    ap.add_argument('--models', default='beta1,joint', help='Comma-separated beta1,joint,candidate')
    ap.add_argument('--candidate-module', type=Path)
    ap.add_argument('--candidate-export', default='createFreshFieldHRL')
    ap.add_argument('--candidate-record', type=Path)
    ap.add_argument('--output', type=Path, required=True, help='New JSON path outside historical results')
    args = ap.parse_args()
    cb, pool = args.colorbench.resolve(), args.pool.resolve()
    models = args.models.split(',')
    if not models or any(x not in ['beta1','joint','candidate'] for x in models) or len(set(models)) != len(models):
        ap.error('Use distinct beta1,joint,candidate model IDs')
    if 'candidate' in models and not args.candidate_module:
        ap.error('Candidate requires --candidate-module')
    if 'candidate' in models and not args.candidate_record:
        ap.error('Candidate requires --candidate-record; implicit seed state is not reproducible')
    if args.output.exists() or HERE in args.output.resolve().parents or (HERE.parent in args.output.resolve().parents):
        ap.error('Output must be a new file outside v2/research to protect historical results')
    for directory, commit in [(cb, COLORBENCH), (pool.parent, POOL)]:
        actual = subprocess.check_output(['git','-C',str(directory),'rev-parse','HEAD'], text=True).strip()
        if actual != commit:
            raise ValueError(f'Upstream commit mismatch: {directory}: {actual} != {commit}')
    os.environ['COLOR_PERCEPTION_POOL'] = str(pool)
    sys.path[:0] = [str(cb), str(cb/'research'), str(HERE/'../colorbench-0.8a')]
    from core import human_pool as hp
    from core.metric_eval import _cat_to_d65, stress, load_macadam1974
    from core.constants import METHODOLOGY_VERSION
    from xlsx_rows import load_combvd_xlsx
    import leaderboard as lb
    import colour
    original_helper = hp._space_forward
    generation = [k for _, _, metrics in lb.GEN_SCORED for k, _ in metrics]
    geometry = [k for _, _, metrics in lb.MEAS_GEOM for k, _ in metrics]
    judges = [(ds, fn, key) for _, ds, fn, key, _ in hp.REGISTRY if ds in set(generation+geometry)]
    assert len(generation)==5 and len(geometry)==11 and set(ds for ds,_,_ in judges)==set(generation+geometry)
    records = load_combvd_xlsx(pool/'combvd/raw/combvd.xlsx')
    assert len(records)==3813
    labels = [r['dataset'] for r in records]
    dv = np.array([r['dv'] for r in records])
    x1 = np.array([_cat_to_d65(np.array(r['xyz1']),np.array(r['white'])) for r in records])
    x2 = np.array([_cat_to_d65(np.array(r['xyz2']),np.array(r['white'])) for r in records])
    weights = np.array([1 if s.startswith('BFD-P') else 9 if s in ['LEEDS','RIT-DuPont'] else 7 for s in labels])
    prepared = json.loads((HERE/'../boundary-tonal/results/training-inputs.json').read_text())
    assert np.max(np.abs(x1-np.array(prepared['xyz1'])))<1e-14
    assert np.max(np.abs(x2-np.array(prepared['xyz2'])))<1e-14
    assert np.array_equal(dv,prepared['dv']) and np.array_equal(weights,prepared['w'])
    with tempfile.TemporaryDirectory(prefix='hrl-fresh-field-macadam-') as t:
        td=Path(t);(td/'macadam1974').mkdir()
        for f in (pool/'macadam1974/raw').glob('table*.yaml'):
            shutil.copy2(f,td/'macadam1974'/f.name)
        ma,mb,mw,mdv=load_macadam1974(str(td));ma=_cat_to_d65(ma,mw);mb=_cat_to_d65(mb,mw)
    old=json.loads((HERE/'../boundary-tonal/results/colorbench.json').read_text())
    identity=candidate_identity(args.candidate_module,args.candidate_record) if 'candidate' in models else None
    out={'schema':'hrl-fresh-field-colorbench-v2','scope':'Original five scored generation and sixteen scored measurement columns; no fresh unexposed observer datasets',
         'methodology':METHODOLOGY_VERSION,'colorbench_commit':COLORBENCH,'pool_commit':POOL,
         'upstream_hashes':{f:sha(cb/f) for f in ['core/human_pool.py','core/metric_eval.py','research/leaderboard.py']},
         'workbook_sha256':sha(pool/'combvd/raw/combvd.xlsx'),
         'code_sha256':sha(__file__),'bridge_sha256':sha(HERE/'bridge.mjs'),
         'source_identity_sha256':sha(HERE/'source-identity.mjs'),
         'candidate_identity':identity,
         'versions':dict(python=sys.version,node=subprocess.check_output(['node','--version'],text=True).strip(),numpy=np.__version__,colour=colour.__version__),
         'original_forward_helper_unchanged':None,'models':{}}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    module = str(args.candidate_module.resolve()) if args.candidate_module else None
    record = str(args.candidate_record.resolve()) if args.candidate_record else None
    for name in models:
        for gamut in ['srgb','full']:
            space=Space(name,gamut,module,args.candidate_export,record,identity)
            scores={'generation':{},'measurement':{}}
            out['models'][name+'-'+gamut]=scores
            try:
                for ds,fn,key in judges:
                    space.reset();start=time.monotonic();value=fn(space,ds)[key]
                    if not np.isfinite(value) or space.audit['rejected']:
                        raise ValueError(f'Failed original judge {name}-{gamut} {ds}')
                    board='generation' if ds in generation else 'measurement'
                    scores[board][ds]={'score':float(value),'scoreKey':key,'audit':space.audit.copy(),'seconds':time.monotonic()-start}
                    print(name,gamut,ds,value,'mapped',space.audit['mapped'],flush=True)
                space.reset();e1=space.forward(x1);f1=np.array([bool(x) for x in space.flags]);e2=space.forward(x2);f2=np.array([bool(x) for x in space.flags[len(x1):]])
                distances=np.linalg.norm(e1-e2,axis=1)
                ix=np.repeat(np.arange(len(dv)),weights)
                scores['combvd']={'weighted':float(stress(distances[ix],dv[ix])),
                                  'unweighted':float(stress(distances,dv)),
                                  'pairs':len(dv),'mappedPairs':int((f1|f2).sum()),'audit':space.audit.copy()}
                for key,pred in [('bfd',lambda s:s.startswith('BFD-P')),('leeds',lambda s:s=='LEEDS'),
                                 ('witt',lambda s:s=='WITT'),('rit',lambda s:s=='RIT-DuPont')]:
                    subset=np.array([pred(s) for s in labels])
                    scores['measurement'][key]={'score':float(stress(distances[subset],dv[subset])),
                        'scoreKey':'STRESS','pairs':int(subset.sum()),'mappedPairs':int(((f1|f2)&subset).sum())}
                space.reset();md=np.linalg.norm(space.forward(ma)-space.forward(mb),axis=1)
                scores['measurement']['macadam']={'score':float(stress(md,mdv)),'scoreKey':'STRESS','audit':space.audit.copy()}
                assert len(scores['generation'])==5 and len(scores['measurement'])==16
                if name=='beta1':
                    historical=old['models']['metric-'+gamut]
                    errors=[abs(scores[board][k]['score']-historical[board][k]['score']) for board in ['generation','measurement'] for k in scores[board]]
                    errors.append(abs(scores['combvd']['weighted']-historical['combvd']['traditional_weighted']))
                    scores['archivedBetaMaxDifference']=max(errors)
                    if max(errors)>1e-8:raise AssertionError(f'Beta1 historical mismatch {gamut}: {max(errors)}')
                print('DONE',name,gamut,scores['combvd'],'beta max delta',scores.get('archivedBetaMaxDifference'),flush=True)
            finally:
                space.close()
            if identity and candidate_identity(args.candidate_module,args.candidate_record)!=identity:
                raise RuntimeError('Candidate code or record changed during evaluation')
            args.output.write_text(json.dumps(out,indent=2)+'\n')
    assert hp._space_forward is original_helper
    out['original_forward_helper_unchanged']=True
    args.output.write_text(json.dumps(out,indent=2)+'\n')
    print('COMPLETE',len(models)*2*21,'original scored cells:',args.output,flush=True)


if __name__=='__main__':
    main()
