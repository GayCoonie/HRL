"""Same-point analytic/autograd/actual-JS conditioning audit. No fitting.

Outputs are explicit and additive. Analytic/autograd share the existing implicit
dark inverse derivative; actual-JS central differences do not use that derivative.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math
import subprocess
import sys

import numpy as np
import torch

HERE = Path(__file__).resolve().parent
RESEARCH = HERE.parent


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--record', action='append', default=[], metavar='NAME=PATH',
                        help='Append compatible shared record to three frozen controls.')
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    torch.set_default_dtype(torch.float64)
    torch.set_num_threads(1)
    base_path = RESEARCH/'gen-tonal-fit/fit.py'
    condition_path = RESEARCH/'boundary-tonal/conditioning.py'
    base = module('conditioning_audit_base', base_path)
    condition = module('conditioning_audit_analytic', condition_path)
    paths = {'parent': RESEARCH/'hue-fair-refine/results/balanced.json',
             'balanced': RESEARCH/'boundary-tonal/results/balanced.json',
             'metric': RESEARCH/'boundary-tonal/results/metric.json'}
    for item in args.record:
        name, separator, path = item.partition('=')
        if not separator or not name or name in paths:
            parser.error('--record requires a unique NAME=PATH')
        paths[name] = Path(path).resolve()
    records = {name:json.loads(path.read_text()) for name,path in paths.items()}
    for name, record in records.items():
        assert record['gamut_calibration']=='shared' and len(record['coefficients'])==1, name
        assert record['ring_logits'] is None, name
        assert record['dark']['harmonics']==3 and record['dark']['cap']==.85, name
        assert np.asarray(record['coefficients'][0]).shape[1:]==(5,13), name
        assert len(record['dark']['coefficients'])==7, name

    points = []
    index = {}
    def add(q, label):
        key = tuple(float(x) for x in q)
        if key not in index:
            index[key] = len(points)
            points.append({'id':len(points),'q':list(key),'labels':[]})
        points[index[key]]['labels'].append(label)
    historic_path = RESEARCH/'boundary-tonal/results/conditioning-same-grid.json'
    historic = json.loads(historic_path.read_text())
    for name in ['parent','balanced','metric']:
        q = historic['models'][name]['worst']['q']
        add([q['H'],q['R'],q['L']], 'historical-'+name+'-maximum')
    hues = [30,90,156,216,263,269,273,275,277,281,285,293,330]
    levels = [.001,.02,.05,.25,.5,.95]
    ratios = [.05,.5,.95,.999]
    for H in hues:
        for L in levels:
            for U in ratios:
                add([H,L*U,L], 'control-grid')
        add([H,.5*.001,.5], 'near-neutral-control')
    factors = [1e-2,1e-3,1e-4,1e-5,1e-6]
    request = {'records':[{'name':n,'record':r} for n,r in records.items()],
               'points':points,'factors':factors}
    node_command = [args.node,str(HERE/'conditioning-numeric.mjs')]
    process = subprocess.run(node_command,input=json.dumps(request),text=True,capture_output=True)
    if process.returncode:
        raise RuntimeError(f'Node exit {process.returncode}: {process.stderr}')
    numeric = json.loads(process.stdout)
    A = np.array([[math.sqrt(3)/2,0],[-.5,1.]])
    Ai = np.linalg.inv(A)

    def measure(E):
        singular = np.linalg.svd(E,compute_uv=False)
        assert singular[-1]>0 and np.isfinite(singular).all()
        return {'equilateralJacobian':E.tolist(),'singularValues':singular.tolist(),
                'condition':float(singular[0]/singular[-1]),
                'logCondition':float(np.log(singular[0]/singular[-1])),
                'determinant':float(np.linalg.det(E))}

    def comparison(value, reference):
        E = np.asarray(value['equilateralJacobian'])
        F = np.asarray(reference['equilateralJacobian'])
        return {'scaledJacobianError':float(np.max(np.abs(E-F))/max(1.,np.max(np.abs(F)))),
                'logConditionError':abs(value['logCondition']-reference['logCondition']),
                'relativeConditionError':abs(value['condition']/reference['condition']-1),
                'relativeDeterminantError':abs(value['determinant']/reference['determinant']-1)}

    models = {}
    for name, record in records.items():
        C = torch.tensor(record['coefficients'][0])
        D = torch.tensor(record['dark']['coefficients'])
        shift = torch.tensor(record['neutral_shift'])
        rows = []
        for point, js in zip(points,numeric['results'][name],strict=True):
            assert point['id']==js['id'] and point['q']==js['q']
            q = torch.tensor(point['q'])
            rl = q[1:].clone().requires_grad_(True)
            fun = lambda x: base.coords(torch.cat([q[:1],x]),C,D,shift)[1:]
            J = torch.autograd.functional.jacobian(fun,rl).detach().numpy()
            automatic = measure(A@J@Ai)
            automatic['rawRLJacobian'] = J.tolist()
            lc, matrix, determinant = condition.log_condition(q,C,D,shift,base)
            analytic = measure(matrix.detach().numpy().reshape(2,2))
            analytic['propagatedDeterminant'] = float(determinant)
            analytic['propagatedLogCondition'] = float(lc)
            analytic['vsAutograd'] = comparison(analytic,automatic)
            analytic['propagatedLogVsSvdError'] = abs(float(lc)-analytic['logCondition'])
            analytic['propagatedDetVsSvdMatrixError'] = abs(float(determinant)/analytic['determinant']-1)
            value = base.coords(q,C,D,shift).detach().numpy()
            parity = float(np.max(np.abs(value-np.asarray(js['value']))))
            differences = []
            for item in js['numerical']:
                measured = measure(A@np.array(item['J'])@Ai)
                measured.update(factor=item['factor'],h=item['h'],rawRLJacobian=item['J'])
                measured['vsAnalytic'] = comparison(measured,analytic)
                differences.append(measured)
            rows.append({**point,'analytic':analytic,'autograd':automatic,
                         'pythonOutput':value.tolist(),'javascriptOutput':js['value'],
                         'forwardMaxAbsoluteDifference':parity,'numerical':differences})

        maximum = lambda getter: max(getter(row) for row in rows)
        summary = {
            'maxForwardAbsoluteDifference':maximum(lambda r:r['forwardMaxAbsoluteDifference']),
            'maxAnalyticAutogradScaledJacobianError':maximum(lambda r:r['analytic']['vsAutograd']['scaledJacobianError']),
            'maxAnalyticAutogradLogConditionError':maximum(lambda r:r['analytic']['vsAutograd']['logConditionError']),
            'maxAnalyticAutogradRelativeDeterminantError':maximum(lambda r:r['analytic']['vsAutograd']['relativeDeterminantError']),
            'maxPropagatedLogVsSvdError':maximum(lambda r:r['analytic']['propagatedLogVsSvdError']),
            'maxPropagatedDetVsSvdMatrixError':maximum(lambda r:r['analytic']['propagatedDetVsSvdMatrixError']),
            'maxAnalyticCondition':maximum(lambda r:r['analytic']['condition']),
            'minAnalyticDeterminant':min(r['analytic']['propagatedDeterminant'] for r in rows),
            'numericalByFactor':{str(f):{
                key:max(row['numerical'][i]['vsAnalytic'][key] for row in rows)
                for key in ['scaledJacobianError','logConditionError','relativeConditionError','relativeDeterminantError']}
                for i,f in enumerate(factors)},
            'historicalExtremeRows':[r['id'] for r in rows if any(s.startswith('historical') for s in r['labels'])]}
        models[name] = {'record':str(paths[name]),'recordSha256':sha(paths[name]),'summary':summary,'rows':rows}

    source_paths = [Path(__file__),HERE/'conditioning-numeric.mjs',base_path,condition_path,
                    RESEARCH/'shared-rl/core.mjs',RESEARCH.parent/'a-smooth/rl-core.mjs',historic_path]
    output = {'method':'Fixed-H shared source-to-destination coordinate Jacobian; both bases x=sqrt(3)R/2,z=L-R/2. Not XYZ or perceptual.',
              'basisMatrix':A.tolist(),'samplesPerModel':len(points),'hues':hues,'levels':levels,
              'ratios':ratios,'stepFactors':factors,'stepRule':'factor*min(R,L-R,1-L)',
              'stencil':'central differences of actual JS sharedCoordinates with nominal 2h denominator',
              'independenceLimit':'Autograd and analytic use existing InversePhi implicit inverse derivative; JS finite differences use no analytic derivative.',
              'versions':{'python':sys.version,'torch':torch.__version__,'numpy':np.__version__,'node':numeric['nodeVersion']},
              'command':[sys.executable,*sys.argv],'nodeCommand':node_command,'nodeExit':process.returncode,
              'sourceHashes':{str(p):sha(p) for p in source_paths},'models':models}
    # Save evidence even when validation gates fail; fail the command explicitly.
    checks = {name:{
        'forwardParity':m['summary']['maxForwardAbsoluteDifference']<1e-10,
        'analyticAutogradJacobian':m['summary']['maxAnalyticAutogradScaledJacobianError']<1e-8,
        'analyticAutogradLogCondition':m['summary']['maxAnalyticAutogradLogConditionError']<1e-6,
        'analyticAutogradDeterminant':m['summary']['maxAnalyticAutogradRelativeDeterminantError']<1e-7,
        'propagatedCondition':m['summary']['maxPropagatedLogVsSvdError']<1e-6,
        'propagatedDeterminant':m['summary']['maxPropagatedDetVsSvdMatrixError']<1e-7,
        'positiveDeterminants':m['summary']['minAnalyticDeterminant']>0}
        for name,m in models.items()}
    output['implementationChecks'] = checks
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(output,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'output':str(args.output),'samplesPerModel':len(points),
                      'summaries':{n:m['summary'] for n,m in models.items()},'implementationChecks':checks},indent=2))
    if not all(all(check.values()) for check in checks.values()):
        raise SystemExit('IMPLEMENTATION VALIDATION FAILED; inspect saved raw evidence')


if __name__=='__main__':
    main()
