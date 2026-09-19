"""Independent read-only high-precision reproduction of decisive audit points.

Writes JSON only to stdout. Uses an independent scalar forward map, not the
repository's analytic chain rule or autograd derivative. Actual JavaScript
stencils are evaluated afresh through the audited numeric runner.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import mpmath as mp

mp.mp.dps = 80
ROOT = Path('/workspace/scratch/20abb8fd27ac')
AUDIT = ROOT / 'hrl-optimization/conditioning-candidates.json'
RUNNER = ROOT / 'hrl-v2-next/v2/research/tonal-next/conditioning-numeric.mjs'
audit = json.loads(AUDIT.read_text())
A = mp.matrix([[mp.sqrt(3)/2, 0], [-mp.mpf('0.5'), 1]])
Ai = A**-1
cases = [('smooth-mild', 0), ('smooth-conditioned', 1)]
request = {'records': [], 'points': [], 'factors': [.001, .0001]}
for name, index in cases:
    if not any(r['name'] == name for r in request['records']):
        request['records'].append({
            'name': name,
            'record': json.loads(Path(audit['models'][name]['record']).read_text()),
        })
for index in (0, 1):
    request['points'].append({'id': index, 'q': audit['models']['parent']['rows'][index]['q']})
proc = subprocess.run(['node', str(RUNNER)], input=json.dumps(request),
                      text=True, capture_output=True, check=True)
actual = json.loads(proc.stdout)
result = {
    'command': [sys.executable, *sys.argv],
    'python': sys.version,
    'mpmath': mp.__version__,
    'decimalPrecision': mp.mp.dps,
    'nodeVersion': actual['nodeVersion'],
    'nodeExit': proc.returncode,
    'auditSha256': hashlib.sha256(AUDIT.read_bytes()).hexdigest(),
    'method': 'Independent scalar forward map; central R/L differences at 80 decimal digits; both bases x=sqrt(3)R/2,z=L-R/2. Condition from larger Gram eigenvalue divided by positive determinant.',
    'highPrecisionFactors': ['1e-20', '1e-25'],
    'sourceHashMatches': {
        p: hashlib.sha256(Path(p).read_bytes()).hexdigest() == h
        for p, h in audit['sourceHashes'].items()
    },
    'modelHashMatches': {
        n: hashlib.sha256(Path(m['record']).read_bytes()).hexdigest() == m['recordSha256']
        for n, m in audit['models'].items()
    },
    'cases': [],
}
assert all(result['sourceHashMatches'].values())
assert all(result['modelHashMatches'].values())

def measure(J):
    E = A*J*Ai
    det = mp.det(E)
    trace = mp.fsum(x*x for x in E)
    largest_eigenvalue = (trace + mp.sqrt(trace*trace - 4*det*det))/2
    assert det > 0
    return E, largest_eigenvalue/abs(det), det

for name, index in cases:
    row = audit['models'][name]['rows'][index]
    record = json.loads(Path(audit['models'][name]['record']).read_text(), parse_float=mp.mpf)
    H, R, L = [mp.mpf(str(x)) for x in row['q']]
    angle = H*mp.pi/180
    features = [mp.mpf(1)]
    for k in range(1, record['harmonics'] + 1):
        features.extend([mp.cos(k*angle), mp.sin(k*angle)])
    cs = [[mp.fsum(c*v for c, v in zip(co, features)) for co in layer]
          for layer in record['coefficients'][0]]
    amp = record['dark']['cap'] / (1 + mp.exp(-mp.fsum(
        c*v for c, v in zip(record['dark']['coefficients'], features))))
    cap = record['shift_cap']

    def warp(x, t):
        return x/(x + (1-x)*mp.exp(-t))

    def forward(r, l):
        u = r/l
        l = warp(l, record['neutral_shift'])
        for c in cs:
            l = warp(l, cap*mp.tanh(u*(c[0] + c[1]*(2*u-1))/cap))
            v = 2*l-1
            u = warp(u, cap*mp.tanh((c[2] + c[3]*v + c[4]*v*v)/cap))
        a = amp*u*u
        t = l
        for _ in range(100):
            step = (t*(1-a*(1-t)**2)-l)/(1-a*(1-t)*(1-3*t))
            t -= step
            if abs(step) < mp.mpf('1e-70'):
                break
        assert abs(t*(1-a*(1-t)**2)-l) < mp.mpf('1e-65')
        return mp.matrix([t*u, t])

    outputs = []
    for factor in result['highPrecisionFactors']:
        h = mp.mpf(factor)*min(R, L-R, 1-L)
        dr = (forward(R+h, L) - forward(R-h, L))/(2*h)
        dl = (forward(R, L+h) - forward(R, L-h))/(2*h)
        outputs.append(measure(mp.matrix([[dr[0], dl[0]], [dr[1], dl[1]]])))
    E, condition, determinant = outputs[-1]
    reference = mp.mpf(str(row['analytic']['condition']))
    matrix_error = max(
        abs(E[a, b] - mp.mpf(str(row['analytic']['equilateralJacobian'][a][b])))
        for a in range(2) for b in range(2)
    ) / max(mp.mpf(1), max(abs(x) for x in E))
    steps = []
    for item in actual['results'][name][index]['numerical']:
        _, numerical_condition, _ = measure(mp.matrix(item['J']))
        steps.append({
            'factor': item['factor'], 'h': item['h'],
            'condition': mp.nstr(numerical_condition, 25),
            'relativeErrorVsHighPrecision': float(abs(numerical_condition/condition-1)),
        })
    result['cases'].append({
        'model': name, 'q': row['q'],
        'highPrecisionCondition': mp.nstr(condition, 30),
        'highPrecisionDeterminant': mp.nstr(determinant, 30),
        'highPrecisionEquilateralJacobian': [[mp.nstr(E[a, b], 30) for b in range(2)] for a in range(2)],
        'twoStepRelativeConditionDifference': mp.nstr(abs(outputs[0][1]/condition-1), 15),
        'storedAnalyticRelativeConditionError': float(abs(reference/condition-1)),
        'storedAnalyticScaledJacobianError': float(matrix_error),
        'freshActualJavascript': steps,
    })
print(json.dumps(result, indent=2, allow_nan=False))
