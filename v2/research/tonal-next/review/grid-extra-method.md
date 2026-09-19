# Critical-hue grid augmentation — before execution

Reason: current stride2 training on96 uniformly spaced hues samples every7.5degrees and can miss narrow structure around exact critical blue273–277degrees. For the next exploratory pair only, append exact critical hues263,269,273,275,277,281,285,293 absent from the original96;285 is already present, yielding seven appended angles and103 total. This changes synthetic sampling, not the frozen runtime or COMBVD masks. Parent fitter must consume the explicit hues array correctly instead of assuming360*index/H.

Do not regenerate any original96 source-grid slices. Verify sourcegrid byte length and parent recorded hashes, copy both files byte-for-byte, then append seven sequentially computed slices. Use exactly original cosine source U and L values, boundary getBoundarySource(gamut).toXYZ({H,R:L*U,L}) and frozen genRuler. One Node process, same float64 storage convention, no worker fanout. Emit fresh grid.json with explicit103-hue order, baseH96, N193, inherited source hashes, original grid metadata SHA256, parent profile hashes, current augmentation-script hash and Node version, appended source details and final file hashes. Existing source cache and frozen files stay untouched. New directory must not preexist. Verify original binary prefix equality and full new-file byte lengths/hashes after generation. No candidate outcome inspected to implement this sampling request.

## Executed command and result

`node --check v2/research/tonal-next/cache-grid-extra.mjs` exit0.
`node v2/research/tonal-next/cache-grid-extra.mjs --source /workspace/scratch/20abb8fd27ac/hrl-optimization/cache --out /workspace/scratch/20abb8fd27ac/hrl-optimization/cache-critical > /workspace/scratch/20abb8fd27ac/hrl-optimization/grid-extra-console.log 2>&1` exit0,66.565seconds. Native generation/verification15.996s, full50.564s. Completed H103,N193,baseH96, appended [263,269,273,275,277,281,293]. Both files92,079,528bytes; each preserved85,821,696-byte original prefix and appended6,257,832bytes. Original parent binary prefixes and hashes, metadata hash, and inherited runtime source hashes verified by script. Post-read status/hue uniqueness/all8 critical angles presence validation exit0.

Final profile SHA256: native `cd7cb6eb8ed3a78c4ba73555985dc941486b5f49e7b153009b54ef02813aed51`; full `5975af335d532019ba3e67ab392daee601282dd161e2954b9dbf2f3c39bd2573`.

Fitter integration requirement communicated before completion: use explicit `grid.hues` labels, stride only original base96 selection, and include every appended index. Dividing360 by103 or striding over all103 would mislabel/drop requested critical samples. No existing cache or frozen source was modified, no original slice regenerated, no candidate outcomes inspected.
