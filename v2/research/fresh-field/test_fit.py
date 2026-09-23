"""Fit-boundary tests: source identity and the real public-coordinate paths."""

import json
from pathlib import Path
import tempfile
import unittest

import numpy as np

from fit import load_source_grid, path_queries, stress


class FitTests(unittest.TestCase):
    def test_grid_rejects_mismatched_bytes_even_when_shape_is_valid(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root/'grid-srgb.json').write_text(json.dumps({
                'schema': 'hrl-fresh-base-grid-v1', 'gamut': 'srgb',
                'hues': [0, 120, 240], 'N': 2, 'channels': ['GenSpace J','GenSpace a','GenSpace b','physical Y'],
                'sha256': '0'*64, 'sourceCommit': 'pin',
            }))
            np.zeros((3, 2, 2, 4), dtype='<f8').tofile(root/'source-srgb.f64')
            with self.assertRaisesRegex(ValueError, 'source grid SHA256'):
                load_source_grid(root, 'srgb')

    def test_level_paths_hold_public_reach_constant(self):
        points, structure = path_queries([40], radial_samples=9, level_samples=11)
        fixed = structure['fixed_reach']
        family = points[fixed].reshape(len(structure['reach_levels']), 11, 3)
        expected = np.repeat(np.array(structure['reach_levels'])[:, None], 11, axis=1)
        np.testing.assert_allclose(family[:, :, 1], expected)
        self.assertTrue(np.all(np.diff(family[:, :, 2], axis=1)>0))

    def test_weighted_stress_is_scale_invariant(self):
        d, reference, weights = np.array([1.,2.,3.]), np.array([2.,4.,6.]), np.array([1.,4.,2.])
        self.assertAlmostEqual(float(stress(d, reference, weights)), 0.0, places=13)
        self.assertGreater(float(stress(d, [1.,1.,1.], weights)), 0)


if __name__ == '__main__':
    unittest.main()
