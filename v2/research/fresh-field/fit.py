"""Reproducible scratch fit of the shared positive-CDF Reach/Level coordinates.

Run with PYTHONPATH pointing at an isolated Autograd install. Every source
grid and observer-pair cache is hashed in the emitted result. Numeric claims
are training/proxy results; direct JS evaluation must be reported separately.
"""

import argparse
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import subprocess
import time

import numpy as np

from core import embed, public_to_source, source_to_public

HERE = Path(__file__).resolve().parent
JOINT = HERE.parent / 'joint-contours' / 'results'
PAIR_CACHE = HERE.parent / 'boundary-tonal' / 'results' / 'cache.json'
BASE_GRID = HERE / 'results' / 'base-grid'
PHYSICAL_DEFINITION = {
    'freshFieldEntry': HERE/'index.mjs',
    'freshFieldTransport': HERE/'model.mjs',
    'boundarySource': HERE.parent/'boundary-tonal'/'index.mjs',
    'boundaryGeometry': HERE.parent/'boundary-tonal'/'boundary-1nm.json',
    'sourceAtlas': HERE.parent/'shared-rl'/'source.mjs',
    'sourceChart': HERE.parent.parent/'lib'/'research.mjs',
    'genRuler': HERE.parent/'tonal-semantics'/'ruler.mjs',
    'genRuntime': HERE.parent.parent.parent/'src'/'base'/'appearance-runtime.mjs',
    'genParameters': HERE.parent.parent.parent/'src'/'base'/'gen-parameters.mjs',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def physical_definition_hashes():
    return {label:sha(path) for label,path in PHYSICAL_DEFINITION.items()}


def load_source_grid(directory, gamut):
    directory = Path(directory)
    metadata_path = directory / f'grid-{gamut}.json'
    binary_path = directory / f'source-{gamut}.f64'
    meta = json.loads(metadata_path.read_text())
    if meta['schema'] != 'hrl-fresh-base-grid-v1' or meta['gamut'] != gamut:
        raise ValueError('Incompatible source grid schema or gamut')
    if len(meta['channels']) != 4 or meta['channels'][:3] != ['GenSpace J','GenSpace a','GenSpace b']:
        raise ValueError('Incompatible source grid channels')
    actual = sha(binary_path)
    if actual != meta['sha256']:
        raise ValueError(f'source grid SHA256 mismatch ({gamut}: {actual} != {meta["sha256"]})')
    data = np.fromfile(binary_path, '<f8').reshape(len(meta['hues']), meta['N'], meta['N'], 4)
    if not np.isfinite(data).all():
        raise ValueError('Nonfinite source appearance values')
    return {'meta':meta, 'data':data, 'metadataSHA256':sha(metadata_path)}


def prepare_base_grids(output=BASE_GRID, n=49):
    """Use actual JS physical base charts for appearance and inherited pair IDs."""
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    js=r'''import fs from 'node:fs';import crypto from 'node:crypto';
import {getBoundarySource} from '../boundary-tonal/index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const [g,root,nString]=process.argv.slice(1),N=Number(nString),source=await getBoundarySource(g);
const hs=[...new Set([...Array.from({length:72},(_,i)=>i*5),...Array.from({length:16},(_,i)=>285+i)])].sort((a,b)=>a-b);
const grid=Array.from({length:N},(_,i)=>(1-Math.cos(Math.PI*i/(N-1)))/2);
const raw=new Float64Array(hs.length*N*N*4);let k=0;
for(let i=0;i<hs.length;i++){
 const H=hs[i];for(const L of grid)for(const U of grid){
  const legacy=source.base.toXYZ({H,R:L*U,L});
  const xyz=source.fromLegacyXYZ?source.fromLegacyXYZ(legacy):legacy;
  raw.set([...genRuler(xyz),xyz[1]],k);k+=4;
 }
 if(i%12===0)console.error('base-grid',g,i,'/',hs.length);
}
const bin=Buffer.from(raw.buffer),binaryPath=`${root}/source-${g}.f64`;
fs.writeFileSync(binaryPath,bin);
const meta={schema:'hrl-fresh-base-grid-v1',gamut:g,hues:hs,N,channels:['GenSpace J','GenSpace a','GenSpace b','physical Y'],
 grid:'cosine physical base purity and nonblack amount',sha256:crypto.createHash('sha256').update(bin).digest('hex'),
 source:'getBoundarySource(g).base.toXYZ; full source.fromLegacyXYZ; genRuler on result'};
fs.writeFileSync(`${root}/grid-${g}.json`,JSON.stringify(meta,null,2)+'\n');
const cached=JSON.parse(fs.readFileSync(new URL('../boundary-tonal/results/cache.json',import.meta.url)));
const profile=cached.profiles[g],map=q=>{const b=source.toBase({H:q[0],R:q[1],L:q[2]});return[b.H,b.R,b.L];};
const pairs={a:profile.a.map(map),b:profile.b.map(map),dv:profile.dv,w:profile.w,indices:profile.indices};
fs.writeFileSync(`${root}/pairs-${g}.json`,JSON.stringify(pairs)+'\n');
console.log(JSON.stringify({g,sha256:meta.sha256,N,hues:hs.length,pairs:pairs.a.length}));'''
    for g in ('srgb','full'):
        proc=subprocess.run(['node','--input-type=module','-e',js,g,str(output.resolve()),str(n)],
                            cwd=HERE,check=True,text=True,capture_output=True)
        print('PREPARE',proc.stdout.strip(),flush=True)
    manifest={'schema':'hrl-fresh-base-inputs-v1','oldPairCacheSHA256':sha(PAIR_CACHE),
              'generatingCodeSHA256':sha(__file__),
              'physicalDefinitionSHA256':physical_definition_hashes(),
              'grids':{g:sha(output/f'source-{g}.f64') for g in ('srgb','full')},
              'basePairs':{g:sha(output/f'pairs-{g}.json') for g in ('srgb','full')}}
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest


def stress(d, v, w, xp=np):
    wd2 = xp.sum(w*d*d)
    wv2 = xp.sum(w*v*v)
    return 1-xp.sum(w*d*v)**2/(wd2*wv2)


def path_queries(hues, radial_samples=33, level_samples=33):
    hues = list(hues)
    near_levels = [.02, .08, .2, .5, .8]
    reach_levels = [.0001, .002, .02, .08, .25, .5, .8]
    r = np.linspace(0, 1, radial_samples)
    t = np.linspace(0, 1, level_samples)
    paths = {}
    fixed_level = np.array([[[(h, l*u, l) for u in r] for l in near_levels] for h in hues]).reshape(-1, 3)
    fixed_reach = np.array([[[(h, reach, reach+(1-reach)*u) for u in t]
                             for reach in reach_levels] for h in hues]).reshape(-1, 3)
    white_edge = np.array([[(h, u, 1) for u in r] for h in hues]).reshape(-1, 3)
    pieces = [('fixed_level', fixed_level), ('fixed_reach', fixed_reach), ('white_edge', white_edge)]
    all_points = np.concatenate([v for _,v in pieces])
    begin = 0
    for name, part in pieces:
        paths[name] = slice(begin, begin+len(part));begin += len(part)
    paths.update({'hues':hues,'near_levels':near_levels,'reach_levels':reach_levels,
                  'radial_samples':radial_samples, 'level_samples':level_samples})
    return all_points, paths


def _sample_grid(source, q, xp):
    """Autograd-compatible trilinear interpolation; hue knots may be irregular."""
    from autograd.tracer import getval
    data = source['data'];n = source['meta']['N'];hues = np.asarray(source['meta']['hues'])
    h = np.mod(np.asarray(getval(q[:,0])), 360)
    ih = np.searchsorted(hues, h, side='right')-1
    ih = np.maximum(ih, 0)
    next_h = (ih+1)%len(hues)
    h0 = hues[ih];h1 = np.where(next_h == 0, hues[0]+360, hues[next_h])
    th = (h-h0)/(h1-h0)
    l = q[:,2]; u=q[:,1]/xp.maximum(l,1e-300)
    fl = (n-1)/math.pi*xp.arccos(xp.clip(1-2*l,-1+1e-13,1-1e-13))
    fu = (n-1)/math.pi*xp.arccos(xp.clip(1-2*u,-1+1e-13,1-1e-13))
    il = np.clip(np.floor(getval(fl)).astype(int),0,n-2)
    iu = np.clip(np.floor(getval(fu)).astype(int),0,n-2)
    dl = (fl-il)[:,None];du=(fu-iu)[:,None];dh=th[:,None]
    def bilinear(j):
        a=data[j,il,iu]*(1-du)+data[j,il,iu+1]*du
        b=data[j,il+1,iu]*(1-du)+data[j,il+1,iu+1]*du
        return a*(1-dl)+b*dl
    return bilinear(ih)*(1-dh)+bilinear(next_h)*dh


def _visual(sample, shape, xp):
    nh = len(shape['hues']);nu=shape['radial_samples'];nt=shape['level_samples']
    near = sample[shape['fixed_level']].reshape(nh,len(shape['near_levels']),nu,4)
    level = sample[shape['fixed_reach']].reshape(nh,len(shape['reach_levels']),nt,4)
    edge = sample[shape['white_edge']].reshape(nh,nu,4)
    dj = near[:,:,1:,0]-near[:,:,:-1,0]
    turn = xp.maximum(0,xp.sum(xp.abs(dj),axis=-1)-xp.abs(near[:,:,-1,0]-near[:,:,0,0]))
    dlevel = level[:,:,1:,0]-level[:,:,:-1,0]
    negative = xp.sum(xp.maximum(-dlevel,0),axis=-1)
    ynegative = xp.sum(xp.maximum(level[:,:,:-1,3]-level[:,:,1:,3],0),axis=-1)
    v = near[:,:,:, :3]
    speed = xp.sqrt(xp.sum((v[:,:,1:]-v[:,:,:-1])**2,axis=-1)+1e-18)
    # Trim apex endpoints so their natural cusps cannot overwhelm interiors.
    speed = speed[:,:,2:-2]
    cv2 = xp.var(speed,axis=-1)/(xp.mean(speed,axis=-1)**2+1e-12)
    edge_speed = xp.sqrt(xp.sum((edge[:,1:,:3]-edge[:,:-1,:3])**2,axis=-1)+1e-18)[:,2:-2]
    edge_cv2=xp.var(edge_speed,axis=-1)/(xp.mean(edge_speed,axis=-1)**2+1e-12)
    c=xp.sqrt(xp.sum(near[:,:,:,1:3]**2,axis=-1)+1e-18)
    ratio=c/(c[:,:,-1,None]+1e-12)
    occupancy=xp.maximum(.14-ratio[:,:,round(.25*(nu-1))],0)**2+xp.maximum(.35-ratio[:,:,round(.5*(nu-1))],0)**2
    loss=(40*xp.mean(turn**2)+4*xp.mean(negative**2)+3*xp.mean(ynegative**2)
          +.002*xp.mean(cv2)+.006*xp.mean(edge_cv2)+.06*xp.mean(occupancy))
    return loss, {'levelTurnMean':xp.mean(turn), 'levelTurnWorst':xp.max(turn),
                  'fixedReachRetreatMean':xp.mean(negative),'fixedReachRetreatWorst':xp.max(negative),
                  'fixedReachYRetreatMean':xp.mean(ynegative),
                  'sheetSpeedCV':xp.mean(xp.sqrt(cv2)),'whiteEdgeCV':xp.mean(xp.sqrt(edge_cv2)),
                  'nearNeutralOccupancyPenalty':xp.mean(occupancy)}


def _record(vector, seed, xp, mode):
    rec=dict(seed)
    reach=xp.reshape(vector[:25],(5,5)) if mode!='lift-only' else xp.zeros((5,5))
    rec['reach_logits']=reach
    rec['lift_logits']=xp.reshape(vector[25:50],(5,5))
    rec['gain_logits']=vector[50:55]
    return rec


def _numbers(value):
    if hasattr(value,'items'):
        return {k:_numbers(v) for k,v in value.items()}
    return float(value)


def main(argv=None):
    ap=argparse.ArgumentParser()
    ap.add_argument('--name',required=True)
    ap.add_argument('--mode',choices=['shared','lift-only'],default='shared')
    ap.add_argument('--start',choices=['neutral','graded'],default='neutral')
    ap.add_argument('--stage',choices=['visual','joint'],default='visual')
    ap.add_argument('--steps',type=int,default=25)
    ap.add_argument('--grid-root',type=Path,default=BASE_GRID)
    ap.add_argument('--prepare',action='store_true',help='Regenerate base XYZ/GenSpace grid and transform exact existing pair identities')
    ap.add_argument('--hue-stride',type=int,default=15)
    ap.add_argument('--maxiter-gradient',type=int,default=13)
    args=ap.parse_args(argv)
    if args.steps < 0 or args.hue_stride < 1:ap.error('steps nonnegative and hue stride positive required')
    if args.prepare:prepare_base_grids(args.grid_root)
    try:
        import autograd.numpy as anp
        from autograd import value_and_grad
        from scipy.optimize import minimize
    except ImportError as error:
        raise SystemExit('Install autograd into isolated fit-deps; set PYTHONPATH=fit-deps') from error
    os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
    np.random.seed(260923)
    seed=json.loads((HERE/'records'/'seed.json').read_text())
    for key in ('reach_logits','lift_logits'):
        seed[key]=np.array(seed[key],dtype=float)
    seed['gain_logits']=np.array(seed['gain_logits'],dtype=float)
    vector=np.concatenate((seed['reach_logits'].ravel(),seed['lift_logits'].ravel(),seed['gain_logits']))
    if args.start=='graded':
        vector[:25]=np.outer(np.array([.5,.25,0,-.25,-.5]),np.array([1,.2,-.1,.05,0])).ravel()
        vector[25:50]=np.outer(np.array([-.4,-.2,0,.2,.4]),np.array([1,-.1,.1,0,0])).ravel()
    if args.mode=='lift-only':vector[:25]=0
    grids={g:load_source_grid(args.grid_root,g) for g in ('srgb','full')}
    raw=PAIR_CACHE.read_bytes();manifest=json.loads((args.grid_root/'manifest.json').read_text())
    if manifest['schema']!='hrl-fresh-base-inputs-v1' or manifest['oldPairCacheSHA256']!=hashlib.sha256(raw).hexdigest():
        raise ValueError('Observer source pair provenance mismatch')
    for g in ('srgb','full'):
        if manifest['grids'][g]!=grids[g]['meta']['sha256'] or manifest['basePairs'][g]!=sha(args.grid_root/f'pairs-{g}.json'):
            raise ValueError('Fresh physical base grid/pairs do not match recorded identity')
    pairs={g:json.loads((args.grid_root/f'pairs-{g}.json').read_text()) for g in ('srgb','full')}
    profiles={g:{k:np.asarray(v,dtype=float) for k,v in pairs[g].items() if k in ('a','b','dv','w')}
              for g in ('srgb','full')}
    hues=np.arange(0,360,args.hue_stride).tolist()
    hues=sorted(set(hues+[55,65,140,180,230,270,289.5,295,320]))
    paths,shape=path_queries(hues)
    timer=time.monotonic();trace=[]
    def assess(x, diagnostics=False):
        rec=_record(x,seed,anp,args.mode)
        total=0;stats={}
        for g in ('srgb','full'):
            vals=_sample_grid(grids[g], public_to_source(paths,rec,anp), anp)
            visual,metrics=_visual(vals,shape,anp)
            if args.stage=='joint' or diagnostics:
                p=profiles[g]
                a=source_to_public(p['a'],rec,anp,iterations=args.maxiter_gradient)
                b=source_to_public(p['b'],rec,anp,iterations=args.maxiter_gradient)
                distances=anp.sqrt(anp.sum((embed(a,anp)-embed(b,anp))**2,axis=-1)+1e-30)
                weighted=stress(distances,p['dv'],p['w'],anp)
                unweighted=stress(distances,p['dv'],anp.ones_like(p['w']),anp)
                stats[g]={**metrics,'weightedSTRESS100':100*anp.sqrt(anp.maximum(weighted,0)),
                          'unweightedSTRESS100':100*anp.sqrt(anp.maximum(unweighted,0))}
            else:
                weighted=unweighted=0
                stats[g]=metrics
            total=total+.5*(visual+(weighted+.15*unweighted if args.stage=='joint' else 0))
        # Penalize undulation and coefficient magnitude; terminal anchors stay exact.
        coeff=anp.reshape(x[:50],(2,5,5))
        frequency=anp.array([1.,1.5,1.5,2.5,2.5])
        regularizer=.00006*anp.mean((coeff*frequency)**2)+.00005*anp.mean((x[50:55]-seed['gain_logits'])**2)
        total=total+regularizer
        return (total,stats) if diagnostics else total
    gradient=value_and_grad(assess)
    def objective(x):
        value, derivative=gradient(x)
        if not np.isfinite(value) or not np.isfinite(derivative).all():
            raise FloatingPointError('Nonfinite fit loss or gradient')
        row={'call':len(trace)+1,'seconds':time.monotonic()-timer,'loss':float(value),
             'gradientNorm':float(np.linalg.norm(derivative))}
        trace.append(row)
        if len(trace)%5==1:print(json.dumps(row),flush=True)
        return float(value),np.asarray(derivative)
    bounds=[(-4,4)]*50+[(-4,3)]*5
    if args.mode=='lift-only':bounds[:25]=[(0,0)]*25
    start_loss,seed_stats=assess(vector,True)
    print('BASELINE',json.dumps({'loss':float(start_loss),'training':_numbers(seed_stats)}),flush=True)
    fitted=minimize(objective,vector,jac=True,method='L-BFGS-B',bounds=bounds,
                    options={'maxiter':args.steps,'ftol':1e-9,'gtol':1e-6,'maxls':14}) if args.steps else None
    best=np.asarray(fitted.x if fitted else vector)
    best_loss,best_stats=assess(best,True)
    rec=_record(best,seed,np,args.mode)
    rec={k:v.tolist() if isinstance(v,np.ndarray) else v for k,v in rec.items()}
    rec['variant']=args.name
    rec['research']={'status':'experimental unvalidated fit; do not promote',
       'trainPopulation':{'srgb':len(profiles['srgb']['a']),'full':len(profiles['full']['a'])},
       'freshStarts':args.start,'ablation':args.mode,'objectiveStage':args.stage,
       'trainingHues':hues,'pairCacheSHA256':hashlib.sha256(raw).hexdigest(),
       'sourceGridSHA256':{g:grids[g]['meta']['sha256'] for g in grids},
       'basePairSHA256':manifest['basePairs'],
       'baseInputManifestSHA256':sha(args.grid_root/'manifest.json'),
       'gridMetadataSHA256':{g:grids[g]['metadataSHA256'] for g in grids},
       'physicalSourceDefinition':{g:grids[g]['meta']['source'] for g in grids},
       'fitCodeSHA256':sha(__file__),'coreCodeSHA256':sha(HERE/'core.py'),
       'fitEnvironment':{'python':os.sys.version.split()[0],
                         'numpy':np.__version__,
                         'autograd':importlib.metadata.version('autograd'),
                         'scipy':importlib.metadata.version('scipy')},
       'seedSHA256':sha(HERE/'records'/'seed.json'),'neutralSeedMetrics':_numbers(seed_stats),
       'physicalDefinitionSHA256':physical_definition_hashes(),
       'finalTrainingMetrics':_numbers(best_stats),'baselineLoss':float(start_loss),
       'finalLoss':float(best_loss),'trace':trace,
       'optimizer':{'message':str(fitted.message) if fitted else 'baseline only',
                    'iterations':int(fitted.nit) if fitted else 0,'calls':len(trace),
                    'seconds':time.monotonic()-timer},
       'limits':['COMBVD pairs are training population, not held out',
                 'GenSpace values are interpolated source grids, not direct runtime',
                 'Full-domain numeric appearance cannot be displayed on sRGB directly',
                 'Direct JS runtime, independent benchmark and human visual gates are still required']}
    target=HERE/'results'/f'{args.name}.json';target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(rec,indent=2)+'\n')
    print('FIT',json.dumps({'path':str(target),'training':_numbers(best_stats),
                            'loss':float(best_loss),'optimizer':rec['research']['optimizer']}),flush=True)
    return 0


if __name__=='__main__':
    raise SystemExit(main())
