"""Pinned ColorBench: five generation and sixteen measurement columns only.

Uses the real JS transforms. No observer refit, dropped-error suppression,
post-hoc rank selection, or unscored appearance/application suites.
"""
import argparse, hashlib, json, os, subprocess, sys, time, csv
from pathlib import Path
import numpy as np

HERE=Path(__file__).resolve().parent

def clean(x):
    if isinstance(x,dict):return {str(k):clean(v) for k,v in x.items()}
    if isinstance(x,(list,tuple,np.ndarray)):return [clean(v) for v in x]
    if isinstance(x,(bool,np.bool_)):return bool(x)
    if isinstance(x,(float,np.floating)):return float(x) if np.isfinite(x) else None
    if isinstance(x,np.integer):return int(x)
    return x

def dump(x,path):path.write_text(json.dumps(clean(x),indent=2,allow_nan=False)+'\n')

class Space:
    def __init__(self,config):
        self.config=config;self.name=config['id'];self.trained_on=['combvd','hung_berns','ebner_fairchild','munsell']
        self.proc=subprocess.Popen(['node',str(HERE/'bridge.mjs'),json.dumps(config)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
        self.reset()
    def reset(self):self.audit={'points':0,'mapped':0,'rejected':0,'continued':0,'event_counts':{},'error_counts':{},'examples':[]}
    def forward(self,xyz):
        xyz=np.atleast_2d(np.asarray(xyz,float));blocks=[]
        for start in range(0,len(xyz),1024):
            self.proc.stdin.write(json.dumps({'data':xyz[start:start+1024].tolist()},allow_nan=False)+'\n');self.proc.stdin.flush()
            line=self.proc.stdout.readline()
            if not line:raise RuntimeError('JavaScript stopped: '+self.proc.stderr.read())
            r=json.loads(line)
            if 'fatal' in r:raise RuntimeError(r['fatal'])
            a=r['audit']
            for k in ['points','mapped','rejected','continued']:self.audit[k]+=a[k]
            for k in ['event_counts','error_counts']:
                for reason,n in a[k].items():self.audit[k][reason]=self.audit[k].get(reason,0)+n
            self.audit['examples']=(self.audit['examples']+a['examples'])[:12]
            blocks.append(np.asarray(r['data'],float))
        return np.concatenate(blocks) if blocks else np.empty((0,3))
    def close(self):
        self.proc.stdin.close();self.proc.wait(timeout=10)
        if self.proc.returncode:raise RuntimeError(self.proc.stderr.read())

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--colorbench',type=Path,required=True);ap.add_argument('--pool',type=Path,required=True);args=ap.parse_args()
    cb=args.colorbench.resolve();pool=args.pool.resolve();os.environ['COLOR_PERCEPTION_POOL']=str(pool)
    sys.path.insert(0,str(cb));sys.path.insert(0,str(cb/'research'));sys.path.insert(0,str(HERE/'../colorbench-0.8a'))
    from core import human_pool as hp
    hp._space_forward=lambda sp,x: np.asarray(sp.forward(np.atleast_2d(np.asarray(x,dtype=np.float64))),dtype=np.float64)
    from core.metric_eval import _cat_to_d65,stress,load_macadam1974
    from core.bootstrap import stress_ci
    from core.constants import METHODOLOGY_VERSION
    from xlsx_rows import load_combvd_xlsx
    import leaderboard as lb
    import colour
    generation=[k for _,_,ms in lb.GEN_SCORED for k,_ in ms]
    geometry=[k for _,_,ms in lb.MEAS_GEOM for k,_ in ms]
    selected=set(generation+geometry)
    recs=load_combvd_xlsx(pool/'combvd/raw/combvd.xlsx');wh=np.array([r['white'] for r in recs]);dv=np.array([r['dv'] for r in recs]);labels=[r['dataset'] for r in recs]
    x1=np.array([_cat_to_d65(np.array(r['xyz1']),w) for r,w in zip(recs,wh)])
    x2=np.array([_cat_to_d65(np.array(r['xyz2']),w) for r,w in zip(recs,wh)])
    weights=np.array([1 if s.startswith('BFD-P') else 9 if s in ['LEEDS','RIT-DuPont'] else 7 for s in labels])
    import shutil,tempfile
    tmp=Path(tempfile.mkdtemp(prefix='hrl-cb-'));(tmp/'macadam1974').mkdir()
    for p in (pool/'macadam1974/raw').glob('table*.yaml'):shutil.copy2(p,tmp/'macadam1974'/p.name)
    ma,mb,mw,mdv=load_macadam1974(str(tmp));ma=_cat_to_d65(ma,mw);mb=_cat_to_d65(mb,mw)
    cases=[]
    def case(mode,variant,gamut,nits,policy):
        name=f'{mode}-{variant}-{gamut}-{nits}-{policy}';cases.append({'id':name,'mode':mode,'variant':variant,'gamut':gamut,'nits':nits,'policy':policy})
    case('legacy','parent','full',300,'reject');case('legacy','candidate','full',300,'reject')
    case('relative','parent','full',300,'clip')
    case('relative','candidate','full',300,'clip');case('relative','candidate','full',100,'clip')
    case('relative','candidate','full',300,'reject')
    case('relative','candidate','srgb',300,'clip');case('relative','candidate','srgb',100,'clip')
    out={'methodology':METHODOLOGY_VERSION,'hrl_run_commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'colorbench_commit':subprocess.check_output(['git','-C',str(cb),'rev-parse','HEAD'],text=True).strip(),'pool_commit':subprocess.check_output(['git','-C',str(pool.parent),'rev-parse','HEAD'],text=True).strip(),'versions':{'python':sys.version,'numpy':np.__version__,'colour':colour.__version__,'node':subprocess.check_output(['node','--version'],text=True).strip()},'embedding':'[L-R/2,sqrt(3)/2 R cos(H),sqrt(3)/2 R sin(H)]','policy_note':'Clip scores include declared physical-chromaticity projection and Y-to-1 clipping. Strict scores do not. Continued counts concern the hue-model argument, not clipping of XYZ. No double Bradford adaptation of ColorBench-prepared D65 inputs.','no_fitting':True,'models':{}}
    out['source_hashes']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(HERE.glob('*.mjs'))}
    out['atlas_sha256']=hashlib.sha256((HERE/'results/source-full.json').read_bytes()).hexdigest()
    def write():dump(out,HERE/'results/colorbench.json')
    for config in cases:
        sp=Space(config);result={'config':config,'generation':{},'measurement':{}};out['models'][config['id']]=result
        try:
            for prop,ds,fn,key,valid in hp.REGISTRY:
                if ds not in selected:continue
                sp.reset();t=time.monotonic();r=fn(sp,ds);score=r.get(key)
                finite=isinstance(score,(int,float,np.number)) and np.isfinite(score)
                v={'score':score,'score_key':key,'details':r,'audit':sp.audit,'finite_support':sp.audit['rejected']==0 and finite,'exact_input_support':sp.audit['mapped']==0 and sp.audit['rejected']==0 and finite,'seconds':time.monotonic()-t}
                board='generation' if ds in generation else 'measurement';result[board][ds]=v;write()
                print(config['id'],ds,clean(score),'mapped/rejected/continued',sp.audit['mapped'],sp.audit['rejected'],sp.audit['continued'],flush=True)
            sp.reset();e1=sp.forward(x1);e2=sp.forward(x2);de=np.linalg.norm(e1-e2,axis=1);good=np.isfinite(de)
            idx=np.repeat(np.flatnonzero(good),weights[good]);result['combvd']={'unweighted':float(stress(de[good],dv[good])),'traditional_weighted':float(stress(de[idx],dv[idx])),'total':len(dv),'retained':int(good.sum()),'audit':sp.audit,'retained_indices':np.flatnonzero(good).tolist()}
            np.savez_compressed(HERE/f"results/{config['id']}-combvd.npz",xyz1=x1,xyz2=x2,dv=dv,weights=weights,de=de,retained=good)
            for key,pred in [('bfd',lambda s:s.startswith('BFD-P')),('leeds',lambda s:s=='LEEDS'),('witt',lambda s:s=='WITT'),('rit',lambda s:s=='RIT-DuPont')]:
                mask=np.array([pred(s) for s in labels]);ok=mask&good
                result['measurement'][key]={'score':float(stress(de[ok],dv[ok])),'score_key':'STRESS','ci95':list(map(float,stress_ci(de[ok],dv[ok]))),'total':int(mask.sum()),'retained':int(ok.sum()),'exact_input_support':bool(np.all(good[mask]) and sp.audit['mapped']==0),'finite_support':bool(np.all(good[mask]))}
            sp.reset();md=np.linalg.norm(sp.forward(ma)-sp.forward(mb),axis=1);ok=np.isfinite(md)
            result['measurement']['macadam']={'score':float(stress(md[ok],mdv[ok])),'score_key':'STRESS','ci95':list(map(float,stress_ci(md[ok],mdv[ok]))),'total':len(mdv),'retained':int(ok.sum()),'audit':sp.audit,'exact_input_support':bool(ok.all() and sp.audit['mapped']==0),'finite_support':bool(ok.all())}
            write();print('FINISHED',config['id'],result['combvd']['unweighted'],result['combvd']['traditional_weighted'],flush=True)
        finally:sp.close()
    checks={}
    for gamut in ['full','srgb']:
        a=out['models'][f'relative-candidate-{gamut}-100-clip'];b=out['models'][f'relative-candidate-{gamut}-300-clip'];diffs=[]
        for board in ['generation','measurement']:
            for k,ra in a[board].items():
                va=ra['score'];vb=b[board][k]['score']
                if isinstance(va,(int,float)) and np.isfinite(va) and isinstance(vb,(int,float)) and np.isfinite(vb):diffs.append(abs(va-vb))
                else:assert clean(va)==clean(vb)
        checks[gamut]={'maximum_score_difference':max(diffs),'combvd_difference':a['combvd']['unweighted']-b['combvd']['unweighted'],'meaning':'Relative calibration is scale-invariant. This does not empirically identify an optimal white luminance.'}
    out['nits_comparison']=checks;write()
    with (HERE/'results/scores.csv').open('w',newline='') as f:
        w=csv.writer(f);w.writerow(['model','board','dataset','score','exact_input_support','mapped_points','rejected_points','continued_points'])
        for name,m in out['models'].items():
            for board in ['generation','measurement']:
                for k,v in m[board].items():
                    a=v.get('audit',{});w.writerow([name,board,k,clean(v['score']),v['exact_input_support'],a.get('mapped'),a.get('rejected'),a.get('continued')])
    report(out)

def report(out):
    models=out['models'];names=['legacy-parent-full-300-reject','legacy-candidate-full-300-reject','relative-parent-full-300-clip','relative-candidate-full-300-clip','relative-candidate-full-300-reject']
    lines=['# Relative-domain ColorBench rerun','',f"Run commit: `{out['hrl_run_commit']}`. ColorBench `{out['colorbench_commit']}`. Pool `{out['pool_commit']}`.",'','No observer refit was performed. The old checkpoints remain unchanged. New full-domain coordinates use regenerated path maps on the physical chromaticity cone with 0 <= relative Y <= 1.','', '**Clipped imports are marked †.** Missing strict results are N/A, not zero. The high-magnitude hue continuation is separately counted in the JSON audits. No overall rank is claimed for a clipped-input pipeline.','', '| Dataset | 0.8A old | C1 old | 0.8A corrected/clip | C1 corrected/clip | C1 corrected/strict |','|---|---:|---:|---:|---:|---:|']
    def f(v):
        x=v['score'];return 'N/A' if x is None or not np.isfinite(x) else f'{x:.6f}'+(' †' if not v['exact_input_support'] else '')
    for board in ['generation','measurement']:
        keys=list(models[names[0]][board])
        if board=='measurement':keys=['bfd','leeds','witt','rit','macadam']+[k for k in keys if k not in ['bfd','leeds','witt','rit','macadam']]
        for key in keys:lines.append('| '+key+' | '+' | '.join(f(models[n][board][key]) for n in names)+' |')
    lines+=['','## COMBVD','', '| Model | Unweighted | Traditional weighted | Retained |','|---|---:|---:|---:|']
    for n,m in models.items():
        c=m['combvd'];lines.append(f"| {n} | {c['unweighted']:.6f} | {c['traditional_weighted']:.6f} | {c['retained']}/{c['total']} |")
    lines+=['','## 100 versus 300 nits','','Both contexts were actually run on the same relative XYZ inputs. The existing relative calibration has no newly fitted absolute-luminance response; identical results are therefore a unit-invariance check, not evidence that either white luminance is better.','',json.dumps(out['nits_comparison'],indent=2),'','## Scope','','Only the five scored generation and sixteen scored measurement columns were evaluated. Appearance diagnostics, ordinal HumanFB, application scenarios, and unscored physics gates were excluded. Separate numerical round-trip/unit tests validate the implementation.','', 'The original COMBVD, hue-field fitting, and inherited development-data contamination still apply. Newly admitted stimuli may be outside the hue model’s original fitted magnitude interval; continuation is not additional observer evidence.']
    (HERE/'results/REPORT.md').write_text('\n'.join(lines)+'\n')

if __name__=='__main__':main()
