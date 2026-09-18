"""Original scored Python ColorBench on a frozen repaired-boundary comparison set.
Candidates freeze before this run. No judge, tensor-unit or helper modifications.
"""
from pathlib import Path
import argparse, csv, gzip, hashlib, json, os, subprocess, sys, tempfile, shutil, time
import numpy as np
P=Path(__file__).resolve().parent
OLD=P/'../hue-fair-refine'
CB_SHA='12b2de215cc5020682e3d245a8c78bce5f0ebbc9'
POOL_SHA='8641f4e8ebd9d85a34dc0fedc116fa0e58493190'

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def clean(x):
    if isinstance(x,dict):return {str(k):clean(v) for k,v in x.items()}
    if isinstance(x,(list,tuple,np.ndarray)):return [clean(v) for v in x]
    if isinstance(x,(bool,np.bool_)):return bool(x)
    if isinstance(x,(int,np.integer)):return int(x)
    if isinstance(x,(float,np.floating)):return float(x) if np.isfinite(x) else None
    return x

def dump(x,path):path.write_text(json.dumps(clean(x),indent=2,allow_nan=False)+'\n')
class Space:
    def __init__(self,c):
        self.config=c;self.name=c['id'];self.trained_on=['combvd','hung_berns','ebner_fairchild','munsell']
        self.proc=subprocess.Popen(['node',str(P/'bridge.mjs'),json.dumps(c)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
        self.reset()
    def reset(self):
        self.audit=dict(points=0,mapped=0,rejected=0,continued=0,event_counts={},error_counts={},examples=[]);self.flags=[]
    def forward(self,xyz):
        if hasattr(xyz,'detach'):xyz=xyz.detach().cpu().numpy()
        xyz=np.atleast_2d(np.asarray(xyz,dtype=np.float64));blocks=[]
        for start in range(0,len(xyz),1024):
            self.proc.stdin.write(json.dumps({'data':xyz[start:start+1024].tolist()},allow_nan=False)+'\n');self.proc.stdin.flush()
            line=self.proc.stdout.readline()
            if not line:raise RuntimeError('JS stopped: '+self.proc.stderr.read())
            r=json.loads(line)
            if 'fatal' in r:raise RuntimeError(r['fatal'])
            a=r['audit']
            for k in ['points','mapped','rejected','continued']:self.audit[k]+=a[k]
            for k in ['event_counts','error_counts']:
                for key,n in a[k].items():self.audit[k][key]=self.audit[k].get(key,0)+n
            self.audit['examples']=(self.audit['examples']+a['examples'])[:12];self.flags+=r['flags']
            vals=np.asarray(r['data'],dtype=float)
            if not np.isfinite(vals).all():raise RuntimeError('Nonfinite forward output')
            blocks.append(vals)
        return np.concatenate(blocks) if blocks else np.empty((0,3))
    def close(self):
        self.proc.stdin.close();self.proc.wait(timeout=10)
        if self.proc.returncode:raise RuntimeError(self.proc.stderr.read())

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--colorbench',type=Path,required=True);ap.add_argument('--pool',type=Path,required=True);ap.add_argument('--archive-manifest',type=Path);args=ap.parse_args()
    cb=args.colorbench.resolve();pool=args.pool.resolve();R=P/'results';R.mkdir(exist_ok=True)
    if args.archive_manifest:
        source_record=json.loads(args.archive_manifest.read_text())
        assert source_record['colorbench']==CB_SHA and source_record['color-perception-datasets']==POOL_SHA
        provenance={'kind':'archived upstream checkouts','manifest_sha256':sha(args.archive_manifest),'manifest':source_record,'note':'The archive HRL ref is NOT the runtime ref; frozen 0.12 runtime comes from its later review/comparison package.'}
    else:
        for path,want in [(cb,CB_SHA),(pool.parent,POOL_SHA)]:
            got=subprocess.check_output(['git','-C',str(path),'rev-parse','HEAD'],text=True).strip();assert got==want,(got,want)
        provenance={'kind':'git checkouts','commits_checked':True}
    os.environ['COLOR_PERCEPTION_POOL']=str(pool);sys.path[:0]=[str(cb),str(cb/'research'),str(P/'../colorbench-0.8a')]
    from core import human_pool as hp
    from core.metric_eval import _cat_to_d65,stress,load_macadam1974
    from core.bootstrap import stress_ci
    from core.constants import METHODOLOGY_VERSION
    from xlsx_rows import load_combvd_xlsx
    import leaderboard as lb
    import colour
    original_helper=hp._space_forward
    generation=[k for _,_,ms in lb.GEN_SCORED for k,_ in ms];geometry=[k for _,_,ms in lb.MEAS_GEOM for k,_ in ms]
    assert len(generation)==5 and len(geometry)==11
    judges=[(ds,fn,key) for prop,ds,fn,key,valid in hp.REGISTRY if ds in set(generation+geometry)]
    assert set(ds for ds,_,_ in judges)==set(generation+geometry)
    frozen_paths=[]
    for directory in ['../../lib','../../data','../../a-smooth','../relative-domain','../rl-c1','../shared-rl','../gen-tonal-fit','../hue-fair-refine']:
        frozen_paths += [p for p in (P/directory).rglob('*') if p.is_file() and p.suffix in ['.mjs','.json']]
    frozen_paths += [P/f for f in ['index.mjs','boundary-1nm.json','results/balanced.json','results/metric.json','results/SELECTION.json']]
    before={str(p.relative_to(P)):sha(p) for p in frozen_paths}
    out={'methodology':METHODOLOGY_VERSION,'base_commit':'16b87da59c91d9c4b30997631397bad4404c4d39','colorbench_commit':CB_SHA,'pool_commit':POOL_SHA,
      'scope':'5 scored generation and 16 scored measurement columns after boundary repair and frozen shared tonal fits',
      'upstream_source_provenance':provenance,'input_policy':'mapped-spectral-v1; old parent retains mapped-012-v1','judge_functions_unchanged':True,'forward_helper_unchanged':True,
      'embedding':'[L-R/2, sqrt(3)/2 R cos(H), sqrt(3)/2 R sin(H)]','reference_white_nits':300,
      'white_policy':'Already-relative D65 inputs from upstream; source and target white nits equal unless explicitly supplied. No second CAT or artificial 100/300 rescaling of normalized data.',
      'mapping_policy':'1-nm physical cone projection for boundary/new fits; original cone for parent and chromaticity-preserving Y ceiling, plus explicit native linear-sRGB channel clipping when required.',
      'prior_exposure':'COMBVD fitted. Other datasets have prior project development exposure. Mapping is part of the evaluated pipeline, not a fitted improvement.',
      'versions':{'python':sys.version,'numpy':np.__version__,'colour':colour.__version__,'node':subprocess.check_output(['node','--version'],text=True).strip()},
      'frozen_source_hashes':before,'upstream_hashes':{p:sha(cb/p) for p in ['core/human_pool.py','core/metric_eval.py','core/bootstrap.py','research/leaderboard.py']},'models':{}}
    recs=load_combvd_xlsx(pool/'combvd/raw/combvd.xlsx');dv=np.array([r['dv'] for r in recs]);labels=[r['dataset'] for r in recs]
    x1=np.array([_cat_to_d65(np.array(r['xyz1']),np.array(r['white'])) for r in recs]);x2=np.array([_cat_to_d65(np.array(r['xyz2']),np.array(r['white'])) for r in recs])
    weights=np.array([1 if s.startswith('BFD-P') else 9 if s in ['LEEDS','RIT-DuPont'] else 7 for s in labels])
    tmp=Path(tempfile.mkdtemp(prefix='mapped-012-'));(tmp/'macadam1974').mkdir()
    for f in (pool/'macadam1974/raw').glob('table*.yaml'):shutil.copy2(f,tmp/'macadam1974'/f.name)
    ma,mb,mw,mdv=load_macadam1974(str(tmp));ma=_cat_to_d65(ma,mw);mb=_cat_to_d65(mb,mw)
    historical=json.loads((OLD/'results/colorbench.json').read_text())
    out['selection']=json.loads((R/'SELECTION.json').read_text())
    def write():dump(out,R/'colorbench.json')
    with gzip.open(R/'point-event-masks.jsonl.gz','wt') as masklog:
        for gamut in ['srgb','full']:
            for mode in ['parent','boundary','balanced','metric']:
                c={'id':mode+'-'+gamut,'mode':mode,'gamut':gamut,'nits':300,'policy':'map'};sp=Space(c);m={'config':c,'generation':{},'measurement':{}};out['models'][c['id']]=m
                def save_masks(ds):masklog.write(json.dumps({'model':c['id'],'dataset':ds,'events':sp.flags})+'\n');masklog.flush()
                try:
                    for ds,fn,key in judges:
                        sp.reset();start=time.monotonic();r=fn(sp,ds);score=r.get(key)
                        assert isinstance(score,(float,int,np.number)) and np.isfinite(score),(c,ds,r)
                        assert sp.audit['rejected']==0
                        board='generation' if ds in generation else 'measurement'
                        m[board][ds]={'score':score,'score_key':key,'details':r,'audit':sp.audit,'finite_support':True,'exact_input_support':sp.audit['mapped']==0,'seconds':time.monotonic()-start}
                        save_masks(ds);write();print(c['id'],ds,score,'mapped',sp.audit['mapped'],'rejected',sp.audit['rejected'],flush=True)
                    sp.reset();e1=sp.forward(x1);f1=np.array([bool(x) for x in sp.flags]);e2=sp.forward(x2);f2=np.array([bool(x) for x in sp.flags[len(x1):]])
                    de=np.linalg.norm(e1-e2,axis=1);assert np.isfinite(de).all();idx=np.repeat(np.arange(len(dv)),weights)
                    m['combvd']={'unweighted':float(stress(de,dv)),'traditional_weighted':float(stress(de[idx],dv[idx])),'total':len(dv),'retained':len(dv),'mapped_pairs':int((f1|f2).sum()),'audit':sp.audit}
                    np.savez_compressed(R/(c['id']+'-combvd.npz'),xyz1=x1,xyz2=x2,dv=dv,weights=weights,de=de,retained=np.ones(len(dv),bool),mapped1=f1,mapped2=f2)
                    save_masks('combvd')
                    for key,pred in [('bfd',lambda s:s.startswith('BFD-P')),('leeds',lambda s:s=='LEEDS'),('witt',lambda s:s=='WITT'),('rit',lambda s:s=='RIT-DuPont')]:
                        mask=np.array([pred(x) for x in labels]);mapped=int(f1[mask].sum()+f2[mask].sum());events={}
                        for i in np.flatnonzero(mask):
                            for row in [sp.flags[i],sp.flags[len(dv)+i]]:
                                for e in row:events[e]=events.get(e,0)+1
                        m['measurement'][key]={'score':float(stress(de[mask],dv[mask])),'score_key':'STRESS','ci95':list(map(float,stress_ci(de[mask],dv[mask]))),'total':int(mask.sum()),'retained':int(mask.sum()),'mapped_pairs':int(((f1|f2)&mask).sum()),'audit':{'points':int(mask.sum())*2,'mapped':mapped,'rejected':0,'event_counts':events},'finite_support':True,'exact_input_support':mapped==0}
                    sp.reset();md=np.linalg.norm(sp.forward(ma)-sp.forward(mb),axis=1);assert np.isfinite(md).all()
                    m['measurement']['macadam']={'score':float(stress(md,mdv)),'score_key':'STRESS','ci95':list(map(float,stress_ci(md,mdv))),'total':len(mdv),'retained':len(mdv),'audit':sp.audit,'finite_support':True,'exact_input_support':sp.audit['mapped']==0};save_masks('macadam')
                    old=historical['models']['balanced-'+gamut]['combvd'];common=np.array(old['retained_indices']);widx=np.repeat(common,weights[common])
                    m['historical_common_pairs']={'pairs':len(common),'weighted':float(stress(de[widx],dv[widx])),'unweighted':float(stress(de[common],dv[common])),'previous_weighted':old['traditional_weighted'],'previous_unweighted':old['unweighted']}
                    if mode=='parent' or (mode=='boundary' and gamut=='srgb'):assert abs(m['historical_common_pairs']['weighted']-old['traditional_weighted'])<1e-9
                    m['retained_combvd']=dict(m['historical_common_pairs'],mapped_pairs=int((f1[common]|f2[common]).sum()),mask_sha256=hashlib.sha256(common.astype('<i8').tobytes()).hexdigest())
                    assert m['retained_combvd']['mapped_pairs']==0
                    if gamut=='full':assert m['combvd']['mapped_pairs']==0
                    assert len(m['generation'])==5 and len(m['measurement'])==16
                    print('DONE',c['id'],m['combvd']['traditional_weighted'],m['combvd']['unweighted'],m['combvd']['mapped_pairs'],flush=True);write()
                finally:sp.close()
    assert hp._space_forward is original_helper
    assert before=={str(p.relative_to(P)):sha(p) for p in frozen_paths},'A frozen source or result changed'
    out['frozen_sources_unchanged']=True;out['completed_scored_cells']=sum(len(m['generation'])+len(m['measurement']) for m in out['models'].values());out['failed_forward_rows']=0;write()
    with (R/'scores.csv').open('w',newline='') as f:
        w=csv.writer(f);w.writerow(['model','board','dataset','score','mapped_points','rejected_points','exact_input_support'])
        for n,m in out['models'].items():
            for board in ['generation','measurement']:
                for k,z in m[board].items():w.writerow([n,board,k,z['score'],z['audit']['mapped'],z['audit']['rejected'],z['exact_input_support']])
    shutil.rmtree(tmp)
    print('COMPLETE',out['completed_scored_cells'],'scored cells; unchanged original Python helpers and frozen models',flush=True)
if __name__=='__main__':main()
