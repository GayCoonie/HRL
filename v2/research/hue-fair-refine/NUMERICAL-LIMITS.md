# Numerical limits of the frozen continuations

The frozen records from run 35300703792 were independently loaded and tested in the local Node 22.16.0 runtime. Their byte hashes match the selected records. This is reproduction of the implementation, not independent perceptual validation or another fit.

## Random inverse checks

| Candidate | Native maximum round-trip embedding error | Full maximum error |
|---|---:|---:|
| balanced | 1.9629409209187543e-11 | 5.3088644591525735e-12 |
| gentle | 9.01552443810516e-12 | 5.451666895694984e-12 |

Both candidates passed 8,192 random round-trips per gamut, 4,096 exact 16-bit round-trips per gamut, and all declared anchor, hue-label, shared-bank and untrained-third-gamut checks. The training-coordinate equations were compared with JavaScript on 2,048 inputs per candidate: maximum difference 5.684341886080802e-14 for both; the implicit inverse derivative passed its numerical gradient check.

## Conditioning must be compared on the same coordinates

The original random verification stream advanced its seed between models and gamuts. Its maximum condition numbers therefore used different points. They are retained in verification.json as sampling receipts, but must not be interpreted as a same-point comparison or evidence of a gamut-specific learned-map defect. In particular, the normalized R/L map is identical across gamuts; only the source geometry differs. This corrects the earlier wording of this note.

A new explicit stencil uses the same 14,378 normalized H,R,L points for the parent and both candidates. It includes low-Level and near-boundary points. Both source and destination derivatives are transformed to the equilateral x,z basis. All sampled determinants are positive. This is a finite-difference audit of the learned coordinate map, not the gamut-dependent XYZ Jacobian or an observer-rated contour.

| Candidate | Median condition | 95th percentile | 99th percentile | Maximum |
|---|---:|---:|---:|---:|
| Parent 0.11 balanced | 2.62051 | 103.17651 | 1200.72745 | 183646.27529 |
| Refined balanced | 2.49337 | 57.33672 | 1776.63040 | 122404.54182 |
| Lighter regularization | 2.52745 | 77.35054 | 2246.03527 | 216755.74837 |

**The conditioning tail remains severe near some dark/boundary regions.** Both new candidates improve the median and 95th percentile, but worsen the 99th percentile. Balanced reduces the sampled maximum, while the alternate increases it. Positive determinant and accurate round-trips do not erase this limitation. The maximum for balanced occurs at normalized source H=269, R=0.000999, L=0.001; the parent and alternate maxima occur at H=216, R=0.04995, L=0.05. These are source coordinates, not displayed final HRL addresses.

Executable audit: conditioning.mjs. Exact sample grid, hashes, determinants and worst locations: results/conditioning-same-grid.json. The denser fixed grid is deliberately more demanding than the random verification sample. Its numbers are not directly comparable to the earlier raw-R/L random-sample condition numbers.

## Visual inspection

A native preview of the exact frozen records inspected H=240,255,263,269,273,275,277,281,293,330. The gray-to-blue compression is less concentrated in the new sheets around 263 and 269 degrees. A distinctly stronger chromatic band near the lower boundary remains at some narrow deep-blue hues around 273-277 degrees. This is a visual reading of an sRGB preview, not a measured user preference or proof of a particular cause. The published comparison exposes these neighbors explicitly.

No coefficients were changed during these checks. Frozen hashes: balanced `159f06a6ea8eeb1bbe6617318ff8057f540f6ea3919e99e8d364a2d7b990c605`; gentle `d560a5891234d1baa59908a8d2ae694dc7c810728bc47cb15d7d7b562b95baf0`.
