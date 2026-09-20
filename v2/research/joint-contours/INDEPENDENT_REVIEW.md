# Independent review of the selected joint fit

A separate read-only review signed off the frozen record `4dd69df0a18cc62b3b6b1b3a2a115609059d645cb4dec498512d6779842677a5` on 20 September 2026. No blocking runtime, population, or gate-arithmetic defect was found. The reviewer did not fit, select, edit, or publish the candidate.

Independent residual-form weighted STRESS was **26.795160959084658** on native sRGB's 3,331 retained pairs and **26.902322208333274** on full's 3,813 retained pairs, with zero mapped endpoints. These remain training populations.

The reviewer verified shared learned coordinates, default-alias loading, 1,690 boundary/random round trips per realization (maximum bicone error below 2.483e-11), absolute XYZ and native RGB closure, and 1,440 unchanged vivid angles and hue labels. Python/JS coordinate parity and finite-difference gradient directions passed. The unchanged primary joint gate exited zero. Paired primary and additional geometry audit rows were independently reaggregated, with selected extreme paths recomputed directly.

Aggregate near-gray turn reductions were 97.17% / 97.19%, and mean whole-contour color-step CV fell 24.05% / 21.39% for native/full. Additional geometry coverage also improved in aggregate.

## Required limitations

- Local nonregression is false: full H=171.25°, R=.35, L=.35→.36015625 loses .0284493065 J, while Beta 1 rises .0042301264 J at the same points.
- Worst primary relative adjacent color-step jumps worsen by 2.56% native and 3.42% full, despite better mean spacing CV.
- Residual near-gray turns and fixed-Reach reversals remain. Samples do not establish perfect ordering, uniform conditioning, subjective preference, or global nonregression.
- Observer scores are training results; no fresh ColorBench or external observer validation was performed.
- The approximate physical lookup has nonzero interpolation error; direct audits are authoritative.
- Historical Adam fitting did not assess its final update for best selection. The frozen candidate is an earlier actually assessed best state, with matched loss and statistics. The current fitter corrects final-update assessment; historical source is preserved for reproduction.

The review did not cover browser rendering or remote publication. Those are separate delivery checks. The full independent signoff, raw calculations and review scripts are preserved in the dated review evidence packet.
