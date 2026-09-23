"""Behavioral checks for the experimental shared Reach/Level fit."""

import unittest
import json
from pathlib import Path
import subprocess

import numpy as np

from core import curve_cdf, public_to_source, source_to_public


def neutral_record():
    return {
        "schema": "hrl-fresh-field-v1",
        "harmonics": 2,
        "knots": [0, .25, .5, .75, 1],
        "reach_logits": [[0] * 5 for _ in range(5)],
        "lift_logits": [[0] * 5 for _ in range(5)],
        "gain_logits": [-1.6739764335716716, 0, 0, 0, 0],
        "neutral_shift": 0,
        "max_gain": .95,
        "log_density_cap": 4,
    }


class FieldTests(unittest.TestCase):
    def test_seed_preserves_neutral_white_and_vivid_anchors(self):
        record = neutral_record()
        q = np.array([[0, 0, .5], [70, 0, 1], [290, 1, 1], [140, 0, 0]])
        result = public_to_source(q, record)
        neutral = (33 / 58) ** 3  # inverse CIE L* at one-half
        np.testing.assert_allclose(result[:, 1:], [[0, neutral], [0, 1], [1, 1], [0, 0]], atol=2e-14)

    def test_seed_interior_has_independent_level_lift_and_reach(self):
        record = neutral_record()
        q = np.array([[0, .25, .5]])
        result = public_to_source(q, record)
        expected_level = (33 / 58) ** 3 + (1 - (33 / 58) ** 3) * .15 * .25
        np.testing.assert_allclose(result[0], [0, expected_level / 2, expected_level], atol=2e-14)

    def test_positive_curves_order_coordinates_at_all_hues(self):
        record = neutral_record()
        record["reach_logits"] = [[3 * (-1) ** i, .3 * i, -.1, .15, -.2] for i in range(5)]
        x = np.tile(np.linspace(0, 1, 301), 5)
        h = np.repeat([0, 54, 145, 289.5, 359.7], 301)
        values = curve_cdf(x, h, np.array(record["reach_logits"]), record)
        self.assertAlmostEqual(float(values[0]), 0)
        for segment in values.reshape(5, 301):
            self.assertAlmostEqual(float(segment[-1]), 1)
            self.assertGreater(float(np.diff(segment).min()), 0)

    def test_roundtrip_off_grid_and_fixed_public_reach(self):
        record = neutral_record()
        record["reach_logits"] = [[.4 * (-1) ** i, .3, -.2, .1, .03] for i in range(5)]
        record["lift_logits"] = [[.2 * (-1) ** i, -.1, .2, -.05, .05] for i in range(5)]
        reach = [.00001, .02, .17, .32, .6]
        public = np.array([[h, r, l] for h in [0, 35, 289.3, 359.9] for r in reach for l in np.linspace(r, 1, 13)])
        physical = public_to_source(public, record)
        recovered = source_to_public(physical, record)
        np.testing.assert_allclose(recovered, public, atol=2e-9)
        self.assertGreater(float(np.diff(physical[:, 2].reshape(4, 5, 13), axis=-1).min()), 0)

    def test_python_matches_independent_js_runtime_when_available(self):
        root = Path(__file__).resolve().parent
        if not (root/'model.mjs').exists() or not (root/'records'/'seed.json').exists():
            self.skipTest('JS model and canonical seed have not been integrated in this checkout')
        record = json.loads((root/'records'/'seed.json').read_text())
        record['reach_logits'] = [[.45*(-1)**j, .2, -.15, .1, -.05] for j in range(5)]
        record['lift_logits'] = [[-.2*(-1)**j, .08, .12, -.05, .07] for j in range(5)]
        points = np.array([[h,r,l] for h in [0,55,289.4,359.95]
                           for r,l in [(.0001,.001),(.02,.2),(.17,.6),(.5,.8),(.8,1)]])
        code = ('import fs from "node:fs";import {FreshFieldTransport} from "./model.mjs";'
                'const {record,points}=JSON.parse(fs.readFileSync(0,"utf8"));'
                'const m=new FreshFieldTransport(record);'
                'console.log(JSON.stringify(points.map(([H,R,L])=>m.forward({H,R,L}))));')
        result = subprocess.run(['node','--input-type=module','-e',code],cwd=root,
                                input=json.dumps({'record':record,'points':points.tolist()}),
                                text=True,capture_output=True,check=True)
        js=np.array([[q['H'],q['R'],q['L']] for q in json.loads(result.stdout)])
        np.testing.assert_allclose(public_to_source(points,record),js,atol=2e-12)

    def test_inverse_reach_gradient_matches_finite_difference(self):
        try:
            import autograd.numpy as anp
            from autograd import grad
        except ImportError:
            self.skipTest('Isolated Autograd fit dependency absent')
        record=neutral_record()
        physical=anp.array([[10.,.05,.3],[289.4,.1,.5]])
        def loss(coefficient):
            rows=anp.array([[coefficient,0,0,0,0]]+[[0]*5 for _ in range(4)])
            rec={**record,'reach_logits':rows}
            return anp.sum(source_to_public(physical,rec,anp)[:,1:])
        analytic=float(grad(loss)(.25))
        numerical=float((loss(.25001)-loss(.24999))/.00002)
        self.assertAlmostEqual(analytic,numerical,places=5)

    def test_inverse_preserves_vivid_side_under_roundoff(self):
        record=neutral_record()
        record['reach_logits']=[[.4*(-1)**i,.3,-.2,.1,.03] for i in range(5)]
        record['lift_logits']=[[.2*(-1)**i,-.1,.2,-.05,.05] for i in range(5)]
        recovered=source_to_public(np.array([[0.,.7,.7]]),record)[0]
        self.assertLessEqual(recovered[1],recovered[2])


if __name__ == "__main__":
    unittest.main()
