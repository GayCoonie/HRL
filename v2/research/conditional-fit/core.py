"""Vectorized Python realization of hrl-conditional-field-v3 for fitting.

The same positive piecewise-linear CDF and inverse are used by the JS runtime.
No inherited Beta 1 or joint interior coefficients enter this coordinate map.
``xp`` permits autograd.numpy during fitting without making it a runtime dependency.
"""

import math

import numpy as np


def _features(h, xp):
    t = h * (math.pi / 180)
    return xp.stack((xp.ones_like(t), xp.cos(t), xp.sin(t), xp.cos(2*t), xp.sin(2*t)), axis=-1)


def _curve(h, rows, record, xp, level_factor=None, conditional_rows=None):
    knots = record["knots"]
    if len(knots) != 5 or any(abs(k-j/4) > 1e-12 for j, k in enumerate(knots)):
        raise ValueError("The hrl-conditional-field-v3 knot grid must be [0,.25,.5,.75,1]")
    cap = record["log_density_cap"]
    logits = xp.dot(_features(h, xp), xp.array(rows).T)
    if level_factor is not None:
        if conditional_rows is not None:
            logits = logits + level_factor[...,None]*xp.dot(_features(h,xp),xp.array(conditional_rows).T)
        else:
            logits = level_factor[...,None]*logits
    return xp.exp(cap*xp.tanh(logits/cap))


def _cdf_given_density(x, density, xp):
    total = xp.sum((density[..., :-1]+density[..., 1:])/8, axis=-1)
    area = 0
    for j in range(4):
        delta = xp.clip(x - j/4, 0, .25)
        area = area + density[..., j]*delta + 2*(density[..., j+1]-density[..., j])*delta*delta
    return area/total


def curve_cdf(x, h, rows, record, xp=np):
    return _cdf_given_density(x, _curve(h, rows, record, xp), xp)


def _pdf_given_density(x, density, xp):
    total = xp.sum((density[..., :-1]+density[..., 1:])/8, axis=-1)
    value = 0
    for j in range(4):
        # The two definitions agree at the shared knot.
        active = (x >= j/4) & (x < (j+1)/4 if j < 3 else x <= 1)
        value = value + xp.where(active, density[..., j] +
                                4*(density[..., j+1]-density[..., j])*(x-j/4), 0)
    return value/total


def _inverse_given_density(y, density, xp):
    total = xp.sum((density[..., :-1]+density[..., 1:])/8, axis=-1)
    target = y*total
    prefix = 0
    value = 0
    for j in range(4):
        d0, d1 = density[..., j], density[..., j+1]
        interval = (d0+d1)/8
        # Autograd's clip VJP cannot differentiate a learned upper bound.
        local = xp.minimum(xp.maximum(target-prefix, 0), interval)
        slope = 4*(d1-d0)
        delta = 2*local/(d0 + xp.sqrt(xp.maximum(d0*d0+2*slope*local, 1e-300)))
        active = (target >= prefix) & (target < prefix+interval if j < 3 else target <= prefix+interval+1e-12)
        value = value + xp.where(active, j/4+delta, 0)
        prefix = prefix+interval
    return value


def _neutral_level(l, shift, xp):
    # Stable branch not needed here: -shift is small and fitted coefficients
    # never alter it in the default experiment.
    e = xp.exp(shift)
    u = l/(l+(1-l)*e)
    q = xp.where(u <= .08, 2700*u/24389, ((25*u+4)/29)**3)
    qprime = xp.where(u <= .08, 2700/24389, 75*((25*u+4)/29)**2/29)
    derivative = qprime*e/(l+(1-l)*e)**2
    return q, derivative


def _neutral_inverse(a, shift, xp):
    # Autograd has no VJP for cbrt; the real nonnegative cube root is a**(1/3).
    u = xp.where(a <= 216/24389, 24389*a/2700,
                 (29*xp.maximum(a, 1e-300)**(1/3)-4)/25)
    e = xp.exp(shift)
    return xp.clip(u*e/(1-u+u*e), 0, 1)


def public_to_source(q, record, xp=np):
    """Map public regular-bicone coordinates to the same physical source chart."""
    h, r, l = q[..., 0], q[..., 1], q[..., 2]
    rd = _curve(h, record["reach_logits"], record, xp,
                level_factor=1-l, conditional_rows=record["reach_level_logits"])
    u = r/xp.maximum(l,1e-300)
    s = _cdf_given_density(u, rd, xp)
    gl, _ = _neutral_level(l, record["neutral_shift"], xp)
    ld = _curve(h, record["level_logits"], record, xp,level_factor=s)
    a = _cdf_given_density(gl, ld, xp)
    return xp.stack((h, a*s, a), axis=-1)


def source_to_public(q, record, xp=np, iterations=13):
    """Triangular exact-CDF inverse for observer pairs."""
    h, sr, a = q[..., 0], q[..., 1], q[..., 2]
    s = sr/xp.maximum(a, 1e-300)
    ld = _curve(h, record["level_logits"], record, xp,level_factor=s)
    gl = _inverse_given_density(a,ld,xp)
    l = _neutral_inverse(gl, record["neutral_shift"], xp)
    rd = _curve(h, record["reach_logits"], record, xp,
                level_factor=1-l, conditional_rows=record["reach_level_logits"])
    u = _inverse_given_density(s, rd, xp)
    r = l*u
    r = xp.where(a == 0, 0, r)
    l = xp.where(a == 0, 0, l)
    return xp.stack((h, r, l), axis=-1)


def embed(q, xp=np):
    h = q[..., 0]*(math.pi/180)
    r = math.sqrt(3)/2*q[..., 1]
    return xp.stack((q[..., 2]-q[..., 1]/2, r*xp.cos(h), r*xp.sin(h)), axis=-1)
