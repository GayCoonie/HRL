# Numerical limits of the frozen continuations

The two frozen records from run 35300703792 were independently loaded and tested in the local Node 22.16.0 runtime. Their byte hashes match the selected records. This is reproduction of the implementation, not independent perceptual validation or another fit.

| Candidate | Native maximum round-trip embedding error | Full maximum error | Native worst sampled condition number | Full worst sampled condition number |
|---|---:|---:|---:|---:|
| balanced | 1.9629409209187543e-11 | 5.3088644591525735e-12 | 118.844190767033 | 87.50481975311956 |
| gentle | 9.01552443810516e-12 | 5.451666895694984e-12 | 161.39824516924887 | 4612.877470874067 |

Both candidates passed 8,192 random round-trips per gamut, 4,096 exact 16-bit round-trips per gamut, and all declared anchor, hue-label, shared-bank and untrained-third-gamut checks. All 1,200 sampled interior coordinate Jacobians per model/gamut had positive determinant. The coordinate transformation is not the same object as a perceived colour contour or an XYZ luminance gradient.

**The gentle alternate has a substantially worse full-gamut conditioning tail.** Its better full COMBVD training result must not conceal that tradeoff. Positive determinant and accurate round-trips do not make that tail irrelevant. Balanced remains the main regularity-oriented review candidate; neither is an approved replacement for an accepted default.

The training-coordinate equations were also evaluated against the actual JavaScript forward and inverse on 2,048 inputs per candidate. The maximum coordinate difference was 5.684341886080802e-14 for both, and the implicit inverse derivative passed a numerical gradient check. Those are mathematical implementation checks, not observer measurements.

A native preview of the exact frozen records inspected H=240,255,263,269,273,275,277,281,293,330. The gray-to-blue compression is less concentrated in the new sheets around 263 and 269 degrees. A distinctly stronger chromatic band near the lower boundary remains at some narrow deep-blue hues around 273-277 degrees. This is a visual reading of an sRGB preview, not a measured user preference or proof of a particular cause. The subsequent published comparison includes these neighboring hues explicitly.

No coefficients were changed during this check. Frozen hashes: balanced `159f06a6ea8eeb1bbe6617318ff8057f540f6ea3919e99e8d364a2d7b990c605`; gentle `d560a5891234d1baa59908a8d2ae694dc7c810728bc47cb15d7d7b562b95baf0`.
