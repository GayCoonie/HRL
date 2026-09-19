# HRL v2 canonical numbers and short codes

The post–Release 1 project decisions restore different numeric scales for native
sRGB and the full physical domain. The underlying floating model continues to use
`0 <= R <= L <= 1`. No fit, grayscale, vivid anchor, carrier or hue spacing changes
when these coordinates are displayed or serialized.

| Mode | Payload | R/L integer range | Canonical R/L range | Normalization divisor |
| --- | --- | ---: | ---: | ---: |
| Native sRGB | `HHHRRRLLL` | 0–17,575 | 0–175.75 | 17,575 |
| Full | `HHHHRRRRLLLL` | 0–456,975 | 0–4569.75 | 456,975 |

Each R/L field is unsigned uppercase base 26, with `A=0` through `Z=25`.
Canonical numbers are the integer divided by 100. Both endpoints are exact:
native `ZZZ` and full `ZZZZ` mean normalized `1`, not a value one slot below it.
Independent fields must satisfy `R <= L`; invalid payloads are rejected.

These allocations come from the user's post–Release 1 design discussion in
`chattest.pdf`, pages 22–32. They are a new explicit v2 serialization contract;
an older release's payload must retain that release's interpretation.

## Hue addresses

Native sRGB's first two hue characters use base 36, `0–9A–Z`. The third is `0–4`.
Together they encode 6,480 addresses:

| Range | Meaning |
| --- | --- |
| `000`–`XZ4` | 6,120 ordinary hue addresses: four per existing RGB8 vivid anchor |
| `Y00`–`ZZ4` | Integer degree aliases 0°–359° |

The 1,530 exact vivid anchors retain their recorded Release 1 H values and their
RGB edge order: red → yellow → green → cyan → blue → magenta → red. Anchor `i`
occupies hue address `4*i`. Consequently `000` identifies RGB red's existing
H (about 20.935° in the frozen ring), not 0°. Three intermediate addresses divide
the existing angular interval into quarters. This subdivision is the codec's
documented interpolation rule; it does not respace the anchors or the model.
The final interval wraps back to red. Default encoding chooses the nearest
ordinary address by circular angular distance. Integer degree aliases are emitted
only with `{degreeAlias:true}` and decode to their named H exactly. Re-encoding a
degree alias with the default options may choose an ordinary address instead.

Full hue fields use four uppercase base-26 letters. Addresses 0–393,209 enumerate
the `6*(65536-1)` vivid edges of the **actual current pseudo-RGB16 carrier**, in
the same six-edge channel order. For example the first point is `[65535,0,0]`,
the next `[65535,1,0]`, and the last `[65535,0,1]`. The codec converts that
carrier point through the current physical model to obtain H. It does not replace
this nonlinear mapping with equal angular spacing or the obsolete carrier field.
The inverse uses the current vivid point's carrier position and compares nearby
addresses by circular angular distance. A small cache avoids constructing a
393,210-entry table. The 63,766 remaining hue identifiers are **unassigned and
rejected**. No full-mode degree alias meaning has been invented.

Exact angular ties use the lower numeric address. Achromatic coordinates preserve
their requested hue identity, although H has no effect on their XYZ.

## API

```js
import {createHRLv2} from './index.mjs';
import {createShortCodeCodec, canonicalScale} from './codes.mjs';

const model = await createHRLv2({gamut:'srgb'});
const codec = await createShortCodeCodec(model);
const normalized = codec.fromCanonical({H:42, R:48.25, L:120.50});
const result = codec.quantize(normalized);
// {code, coordinates:{H,R,L}, canonical:{H,R,L}, error:{...}}
const xyz = model.toXYZ(codec.decode(result.code));
const envelope = codec.serialize(normalized);
const restored = codec.deserialize(envelope);

canonicalScale('full').maximum; // 4569.75
```

`SHORT_CODE_SCALES.srgb` and `.full` are lightweight frozen metadata, available
before a model loads. Each contains `gamut`, `pattern`, `payloadLength`,
`fieldWidth`, `integerMax`, `maximum`, `step`, `hueSlots` and `degreeAliases`.
`canonicalScale(gamut)` returns the corresponding object or rejects an unsupported
mode. `SHORT_CODE_VERSION` identifies this serialization contract.

`toCanonical(q)` and `fromCanonical(q)` perform **continuous** scaling and validate
the triangle. They do not quantize. The `step:0.01` metadata describes serialized
precision. `encode(q)` rounds each normalized R/L coordinate to its nearest integer
address and returns the payload string. `decode(payload)` returns normalized
coordinates. Syntax is strict uppercase without whitespace or a prefix.
`quantize(q)` also returns the actual decoded coordinates, centi-unit canonical
numbers and signed errors: `hueDegrees` is circular angular error;
`reachNormalized` and `levelNormalized` are normalized coordinate errors. These
are coordinate errors, not a perceptual loss score. R/L rounding errors are at
most half an integer step. Hue error depends on the local vivid-ring spacing.

## Snapshot and gamut context

A short payload alone does not identify a model version. Constructing a codec
requires a loaded, versioned model and checkpoint. The codec's frozen `context`
binds the model version, checkpoint, gamut and reference white to SHA-256 hashes
of the loaded tonal definition, physical boundary, fixed hue ring, carrier
landmarks, source atlas and source hue-field data. These hashes use canonical JSON
and therefore need not equal the byte hash of a JSON artifact on disk. The
model-version and codec-version identifiers also matter: data hashes alone do not
identify every implementation detail.

`serialize(q)` returns `{code,context}`. `deserialize(envelope)` rejects a context
mismatch, including the other gamut or a different fitted record. Bare `decode`
is appropriate when the caller already supplies the selected model context.
Keep the model immutable during a codec's lifetime; construct another codec after
changing its definition. The factory also accepts current
`createSpectralTonalHRL(...)` research models and fingerprints their actual record.

Converting a code between gamuts requires decoding it with the **source** codec,
converting its XYZ through the destination model's explicit import policy, and
encoding with the destination codec. Preserve and display any import/clipping
events. Identical normalized H/R/L in the two gamuts does not mean identical XYZ.
A full payload remains full-domain data even when its display preview is clipped
to sRGB. Rec. 2020 code allocation is outside this implemented two-mode API.

RGB import here uses the existing continuous model conversion followed by ordinary
code quantization. This implementation makes no claim to find a special exact
matching address for every possible RGB8 input, nor to implement an exhaustive
“most vibrant, then simplest hue” search among all matching codes. The 1,530
native vivid RGB8 anchors themselves are directly addressed and tested.

Run `node v2/test-codes.mjs` for address, scale, model-context and XYZ checks.
