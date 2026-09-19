# HRL v2 Beta 1

The current v2 default is the **metric-leaning `metric-b2` checkpoint** from the repaired-boundary 0.13 comparison. Version `2.0.0-beta.1` is a named promotion of that frozen definition, not a new fit.

[Release home](index.html) · [Picker](beta1.html) · [Full definition](HRL_v2_Beta_1.md) · [Reading edition](beta1-notes.html) · [Benchmarks](benchmarks.html) · [Manifest](default.json)

```js
import {createHRLv2, addBlack, addWhite, exchangeNeutral} from './v2/index.mjs';
const native = await createHRLv2();
const full = await createHRLv2({gamut:'full', referenceWhiteNits:300});
```

The code example is relative to the repository root. Public coordinates are `{H,R,L}`, with cyclic degrees and `0 <= R <= L <= 1`. Default inputs/outputs are relative D65 XYZ; encoded RGB methods belong to the native sRGB realization. Full output uses XYZ rather than silent display clipping. `importXYZ()` exposes mapping events.

## Exact release identity

- Coefficients: [metric.json](research/boundary-tonal/results/metric.json), SHA-256 `92aa2f9647b406239dd52cd22feed61794f3d6ed74a1c33ba9361516cff3bb72`.
- Boundary: [boundary-1nm.json](research/boundary-tonal/boundary-1nm.json), SHA-256 `20542ab516a311a68ba8ab4131542254ee899b6cccaef7c89baf9f2c4dd79e67`.
- Public entry: [`index.mjs`](index.mjs), factory `createHRLv2`, native sRGB by default.

The release has one shared learned tonal bank for native/full source charts, a repaired 1-nm spectral boundary, explicit mapped imports, and the regular-bicone metric. [The technical write-up](HRL_v2_Beta_1.md) defines the complete composition and its relationship to r0 and Release 1, including known limitations.

## Evidence, not a universal-win claim

Weighted retained COMBVD: **29.107048** / 3,331 native pairs; **29.948555** / 3,813 full pairs. All-input native mapping: **34.489196** / 3,813 pairs, 482 mapped. COMBVD is fitted/in-sample, and the populations differ. Some path and conditioning diagnostics favor another control. [Read the complete frozen report](research/boundary-tonal/results/REPORT.md).

## Historical pages and APIs remain historical

[Archive](archive.html) · [Every file](../library.html) · [Former landing page](history.html) · [Pre-beta v2 README](README.pre-beta1.md)

The [original four-way comparison](boundary-tonal.html) preserves the 0.12 parent, boundary-only control, refined balanced, and metric-leaning candidates. All earlier experiments and JSON/Markdown evidence remain at their original paths. `lib/index.mjs` retains its older BASR/linear semantics; `../src/index.mjs` and the root picker remain R15-D Release 1.

For local browser use, serve the repository root with `python3 -m http.server 8000` and open `/v2/`. Keep the module/data directories together. Node usage requires Node 18 or later. See the [root README](../README.md) for the full setup and verification commands.

## Canonical numbers and compact codes

The picker uses **0–175.75** Reach/Level in sRGB and **0–4569.75** in full, with hundredth-unit serialization. The calculation API keeps normalized 0–1 coordinates. [The code specification](CODES.md) records the post-Release1 nine-character sRGB and twelve-letter full formats, vivid-anchor ordering, degree aliases, quantization, and model identity.

```js
import {createHRLv2, createShortCodeCodec} from './v2/index.mjs';
const model = await createHRLv2({gamut:'full'});
const codes = await createShortCodeCodec(model);
const envelope = codes.serialize({H:30,R:.3,L:.6});
const q = codes.deserialize(envelope);
const canonical = codes.toCanonical(q);
```

[Explore the global fit comparison](global.html). The short-code payload must travel with its model context to preserve its interpretation across different fits; an exported color includes both.
