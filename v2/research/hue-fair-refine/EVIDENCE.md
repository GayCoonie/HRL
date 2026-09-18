# Evidence and design boundary

This refinement starts from Coonie’s direct feedback that Gen tonal balanced has improved, but its hue sheets remain uneven, especially blue. The previous checkpoint is preserved as the parent and primary comparison. The Library orientation files describe earlier Gamut Forge work and do not override the current HRL repository or this conversation.

ZCAM (Safdar et al., 2021), Section 2 and Step 6, distinguishes lightness/chroma from their joint appearance attributes. We keep that distinction and do not equate Level with GenSpace lightness. Its fitted Kz/Wz values are not inserted as HRL barycentric shares. No CHO or other new observer tuples were created from paper plots.

Briggs (2023), pp. 104 and 109-112, connects blackness and brilliance to a hue/saturation-dependent maximum and separates these from luminance-related lightness. This informs the own-gamut normalization, not a mandate that every zero-blackness gamut-boundary colour has equal Y or Gen lightness.

Nayatani and Sakai (2011), Figure 1 and the derivation on pp. 141-142, distinguish tonal coordinates from Munsell value. Their chromatic-strength values remain indexed by Munsell hue and are not copied into HRL degree bins.

Hedjar, Toscani and Gegenfurtner (2025), abstract and Results, find that equating perceived saturation does not remove hue/chroma threshold asymmetries. That cautions against using a single global radial correction as proof of uniformity. This experiment changes R/L fitting, not the inherited hue field or angle allocation.

The equilateral Hessian penalty and per-hue mean/RMS risk are our engineering design, not formulas attributed to those papers. The blue weight (periodic Gaussian centred at 273 degrees, sigma 20 degrees) reflects this user’s identified problem region; it is not a measured population preference. Full 3D GenSpace vector differences supply synthetic diagnostics. Human-data fitting remains COMBVD only, with prior evaluation exposure acknowledged.

For x=sqrt(3)R/2 and z=L-R/2, F_x=(2F_R+F_L)/sqrt(3) and F_z=F_L. Therefore F_xx=(4F_RR+4F_RL+F_LL)/3, F_xz=(2F_RL+F_LL)/sqrt(3), F_zz=F_LL. The sheet penalty is the sum of squared vector Hessian components (including twice the mixed term) divided by squared gradient magnitude, times the squared reference scale (1/32)^2. This respects the embedded equilateral geometry without asserting that GenSpace and HRL are isometric.

Positive coordinate Jacobians, smooth vector fields, human-difference scores and visually pleasing triangles are distinct checks. None substitutes for the others. Full previews remain display-clipped and explicitly labelled.
