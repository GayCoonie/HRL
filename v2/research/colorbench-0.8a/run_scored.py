"""Run only ColorBench's five generation and sixteen measurement score columns.

Usage: python run_scored.py --colorbench /path/colorbench --pool /path/color-perception-datasets/datasets
The production JS model is called directly; no refit, clipping, or approximate port.
"""
import argparse, os, sys, json, hashlib, time, shutil, subprocess
from pathlib import Path
import numpy as np
from adapter import HRL

def clean(x):
    if isinstance(x,dict):return {str(k):clean(v) for k,v in x.items()}
    if isinstance(x,(list,tuple)):return [clean(v) for v in x]
    if isinstance(x,np.ndarray):return clean(x.tolist())
    if isinstance(x,(float,np.floating)):return float(x) if np.isfinite(x) else None
    if isinstance(x,np.bool_):return bool(x)
    if isinstance(x,np.integer):return int(x)
    return x

def dump(data,path):path.write_text(json.dumps(clean(data),indent=2,allow_nan=False)+'\n')
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def commit(p):return subprocess.check_output(['git','-c','safe.directory='+str(p),'rev-parse','HEAD'],cwd=p,text=True).strip()

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--colorbench',type=Path,required=True);ap.add_argument('--pool',type=Path,required=True)
    ap.add_argument('--fresh',action='store_true');ap.add_argument('--gamut',choices=['full','srgb'],default='full');ap.add_argument('--variant',choices=['parent','smooth','candidate'],default='parent')
    a=ap.parse_args();a.colorbench=a.colorbench.resolve();a.pool=a.pool.resolve()
    here=Path(__file__).resolve().parent;hrl=here.parents[2]
    base=here/'_baseline_data';base.mkdir(exist_ok=True)
    for f in ['combvd.xlsx','combvd_pairs.json']:shutil.copy2(a.pool/'combvd/raw'/f,base/f)
    (base/'macadam1974').mkdir(exist_ok=True)
    for p in (a.pool/'macadam1974/raw').glob('table*.yaml'):shutil.copy2(p,base/'macadam1974'/p.name)
    os.environ['COLOR_PERCEPTION_POOL']=str(a.pool);os.environ['COLORBENCH_DATA']=str(base)
    sys.path.insert(0,str(a.colorbench));sys.path.insert(0,str(a.colorbench/'research'))
    from core import human_pool as hp
    # The numpy wrapper route is mathematically identical to hp's torch-first
    # dispatch, but avoids loading torch only to convert it back to numpy.
    hp._space_forward=lambda sp,x: np.asarray(sp.forward(np.atleast_2d(np.asarray(x,dtype=np.float64))),dtype=np.float64)
    from core.metric_eval import load_combvd_from_xlsx,load_macadam1974,_cat_to_d65,stress
    from core.bootstrap import stress_ci
    from core.constants import METHODOLOGY_VERSION
    import leaderboard as lb
    import colour
    generation=[k for _,_,ms in lb.GEN_SCORED for k,_ in ms]
    geometry=[k for _,_,ms in lb.MEAS_GEOM for k,_ in ms]
    requested=set(generation+geometry)
    out={'model':f'HRL 0.8A {a.variant} ({a.gamut})','gamut':a.gamut,'variant':a.variant,
         'hrl_commit':commit(hrl),'colorbench_commit':commit(a.colorbench),'datasets_commit':commit(a.pool.parent),
         'methodology':METHODOLOGY_VERSION,'versions':{'python':sys.version,'numpy':np.__version__,'colour':colour.__version__,'node':subprocess.check_output(['node','--version'],text=True).strip()},
         'embedding':'[L-R/2, sqrt(3)/2 R cos(H), sqrt(3)/2 R sin(H)]',
         'normalization':'Native unit bicone. No coordinate rescaling or implicit gamut mapping.',
         'trained_on':['combvd','hung_berns','ebner_fairchild','munsell'],
         'notes':['Scores are ColorBench upstream computations, including upstream input preprocessing.',
                  'Rejected inputs are NaN to upstream judges, audited per dataset. Incomplete support is NOT a full-dataset or leaderboard-comparable result.',
                  'COMBVD uses ColorBench Bradford-to-D65 convention, not the slightly different exact-HRL-white legacy inputs.',
                  'Unscored diagnostic and robustness groups are deliberately not run.'],
         'hashes':{str(p.relative_to(hrl)):sha(p) for p in [hrl/'v2/a-smooth/definitions.json',hrl/'v2/a-smooth/source-srgb.json',hrl/'v2/a-smooth/source-full.json',hrl/'v2/data/hue-field-0.6.json',hrl/'v2/data/release1-angles.json']},
         'generation':{},'measurement':{}}
    if a.variant=='candidate':
        for name in ['atlas.mjs','index.mjs']:
            p=(here/'../rl-c1'/name).resolve();out['hashes'][str(p.relative_to(hrl))]=sha(p)
        p=(here/'../rl-c1/candidate.json').resolve();out['hashes'][str(p.relative_to(hrl))]=sha(p)
        out['candidate_definition']=json.loads(p.read_text())['id']
    dest=here/'results'/f'{a.variant}-{a.gamut}.json';dest.parent.mkdir(exist_ok=True)
    if dest.exists() and not a.fresh:
        prior=json.loads(dest.read_text())
        if prior['hrl_commit']==out['hrl_commit'] and prior['colorbench_commit']==out['colorbench_commit'] and prior['datasets_commit']==out['datasets_commit'] and prior['hashes']==out['hashes']:out=prior
    space=HRL(a.gamut,a.variant)
    try:
        for prop,ds,fn,key,valid in hp.REGISTRY:
            if ds not in requested:continue
            board='generation' if ds in generation else 'measurement'
            if ds in out[board]:continue
            space.reset_audit();t=time.monotonic()
            try:r=fn(space,ds)
            except Exception as e:r={'error':repr(e)}
            rec={'score':r.get(key),'score_key':key,'details':r,'audit':space.audit,
                 'complete_support':space.audit['invalid']==0 and isinstance(r.get(key),(int,float)) and np.isfinite(r.get(key)),
                 'seconds':time.monotonic()-t}
            board='generation' if ds in generation else 'measurement';out[board][ds]=rec
            dump(out,dest);print(a.variant,a.gamut,ds,clean(rec['score']),'invalid',space.audit['invalid'],'/',space.audit['points'],flush=True)
        from xlsx_rows import load_combvd_xlsx
        recs=load_combvd_xlsx(base/'combvd.xlsx');x1=np.array([r['xyz1'] for r in recs]);x2=np.array([r['xyz2'] for r in recs]);wh=np.array([r['white'] for r in recs]);dv=np.array([r['dv'] for r in recs])
        x1d=np.array([_cat_to_d65(x,w) for x,w in zip(x1,wh)]);x2d=np.array([_cat_to_d65(x,w) for x,w in zip(x2,wh)])
        space.reset_audit();e1=space.forward(x1d);e2=space.forward(x2d);de=np.linalg.norm(e1-e2,axis=1);ok=np.isfinite(de)
        masks={'bfd':np.array([r['dataset'].startswith('BFD-P') for r in recs]),'leeds':np.array([r['dataset']=='LEEDS' for r in recs]),'witt':np.array([r['dataset']=='WITT' for r in recs]),'rit':np.array([r['dataset']=='RIT-DuPont' for r in recs])}
        for key,mask in masks.items():
            good=mask&ok;s=float(stress(de[good],dv[good]));ci=stress_ci(de[good],dv[good]);
            out['measurement'][key]={'score':s,'score_key':'STRESS','ci95':list(map(float,ci)),
                'total':int(mask.sum()),'retained':int(good.sum()),'complete_support':bool(good.sum()==mask.sum()),
                'retained_indices':np.flatnonzero(good).tolist()}
            print(a.variant,a.gamut,key,s,int(good.sum()),'/',int(mask.sum()),flush=True)
        weights=np.array([1 if r['dataset'].startswith('BFD-P') else 9 if r['dataset'] in ['LEEDS','RIT-DuPont'] else 7 for r in recs])
        inds=np.repeat(np.flatnonzero(ok),weights[ok])
        out['combvd']={'unweighted_stress':float(stress(de[ok],dv[ok])),'traditional_weighted_stress':float(stress(de[inds],dv[inds])),
            'n':int(ok.sum()),'total':len(recs),'audit':space.audit,'retained_indices':np.flatnonzero(ok).tolist(),
            'retained_indices_sha256':hashlib.sha256(json.dumps(np.flatnonzero(ok).tolist(),separators=(',',':')).encode()).hexdigest()}
        np.savez_compressed(dest.with_name(dest.stem+'-combvd.npz'),xyz1=x1d,xyz2=x2d,dv=dv,de=de,retained=ok,weights=weights)
        x1,x2,white,dv=load_macadam1974(str(base));x1d=_cat_to_d65(x1,white);x2d=_cat_to_d65(x2,white)
        space.reset_audit();de=np.linalg.norm(space.forward(x1d)-space.forward(x2d),axis=1);ok=np.isfinite(de)
        out['measurement']['macadam']={'score':float(stress(de[ok],dv[ok])),'score_key':'STRESS','ci95':list(map(float,stress_ci(de[ok],dv[ok]))),
            'total':len(dv),'retained':int(ok.sum()),'complete_support':bool(ok.all()),'audit':space.audit,'retained_indices':np.flatnonzero(ok).tolist()}
        dump(out,dest);print('DONE',dest,flush=True)
    finally:space.close()
if __name__=='__main__':main()
