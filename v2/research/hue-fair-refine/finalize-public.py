"""Finalize review UI and interpretation without changing any fitted coefficient."""
from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parent;V2=P.parents[1];ROOT=V2.parent
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
frozen={n:h(P/f'results/{n}.json') for n in ['balanced','gentle']}
site=json.loads((P/'results/site-data.json').read_text());sheet=json.loads((P/'results/sheet-final.json').read_text())
replacements=[("checkpoint:state.checkpoint,sharedCalibration:true","checkpoint:state.checkpoint==='parent'?'balanced':state.checkpoint,viewCheckpoint:state.checkpoint,sharedCalibration:true"),("state.q={H:d.q.H,R:d.q.R,L:d.q.L};updateControls();requestRender();","state.q={H:d.q.H,R:d.q.R,L:d.q.L};updateControls();updateEvidence();requestRender();"),("for(const H of [0,30,60,90,150,210,240,270,300,330])","for(const H of [0,30,60,90,150,210,240,255,263,269,270,273,275,277,281,285,293,300,330])")]
app=V2/'hue-fair-ui/app.mjs';text=app.read_text()
for old,new in replacements:
 if old in text:assert text.count(old)==1; text=text.replace(old,new)
 else:assert new in text,old
app.write_text(text)
builder=P/'build-site.py';text=builder.read_text();needle="(out/'app.mjs').write_text(s)"
if '# Final export identity and blue-neighbor controls' not in text:
 assert text.count(needle)==1
 patch='# Final export identity and blue-neighbor controls\n'+''.join('s=s.replace('+repr(a)+','+repr(b)+')\n' for a,b in replacements)
 builder.write_text(text.replace(needle,patch+needle))
check=P/'site-check.py';text=check.read_text();needle="assert json.loads((args.out/'old-color.json').read_text())['profile']=='HRL-0.11-gen-tonal'"
new="old=json.loads((args.out/'old-color.json').read_text());assert old['profile']=='HRL-0.11-gen-tonal' and old['checkpoint']=='balanced' and old['viewCheckpoint']=='parent'"
if needle in text:check.write_text(text.replace(needle,new))
lines=['# Review findings and remaining limits','','This is a shared GenSpace R/L continuation of 0.11 balanced, not a hue-field or gamut-boundary refit. A fitted transform changes actual output colours; the previews are not blurred. Only their explicit full-gamut display conversion clips to sRGB.','','## Identical-sample comparisons','','| Realization | Candidate | Weighted COMBVD change | Black-path CV change | White-path CV change | Sheet-bending change | Blue-sheet bending change |','|---|---|---:|---:|---:|---:|---:|']
for g in ['srgb','full']:
 a=site['profiles'][g]['models']['parent'];asheet=sheet['models']['parent'][g]
 for name in ['balanced','gentle']:
  b=site['profiles'][g]['models'][name];bsheet=sheet['models'][name][g]
  pct=lambda x,y:100*(x/y-1)
  lines.append(f"| {g} | {name} | {b['weighted']-a['weighted']:+.6f} | {pct(b['visual']['black']['meanCV'],a['visual']['black']['meanCV']):+.2f}% | {pct(b['visual']['white']['meanCV'],a['visual']['white']['meanCV']):+.2f}% | {pct(bsheet['mean'],asheet['mean']):+.2f}% | {pct(bsheet['blueMean'],asheet['blueMean']):+.2f}% |")
lines+=['','Negative changes indicate a lower numerical value. They are not human preference percentages. The whole-sheet statistic uses the actual inverse and the equilateral embedding; it is distinct from path CV, hue matching and perceived blackness.','','The blue-neighbor controls expose 263, 269, 273, 275, 277, 281 and 285 degrees directly. A clean result at 270 degrees alone does not establish that the neighboring deep-blue sheets are clean. The inherited hue field and source paths were not changed, and residual edge/interior structure must remain visible in review. The numerical checks do not prove every local contour is perceptually regular.','','## Regressions and scope','','The full scored table in results/REPORT.md is authoritative, including regressions. No newly computed non-COMBVD observer result was used to adjust these frozen records. All datasets have earlier project exposure, so they are not called pristine holdouts. Strict and mapped pipelines, support masks, and common/full-only pair subsets are separate.','','The lower-regularization candidate is named gentle in the API; the name does not assert lighter physical colours. Public exports identify the unchanged parent as profile HRL-0.11-gen-tonal, checkpoint balanced, while retaining viewCheckpoint=parent for the comparison interface. New outputs identify HRL-0.12-hue-fair. Gamut remains part of the record.','','The original interrupted code drafts are kept under recovery/ and are not used as evidence of recovered trial arrays. Both newly executed trial arrays and every objective-evaluation log entry are committed under trials/. PLAN.md is unchanged.','']
(P/'FINDINGS.md').write_text('\n'.join(lines))
readme=ROOT/'README.md';text=readme.read_text()
if '<!-- hue-fair-refinement -->' not in text:
 readme.write_text(text+'\n\n<!-- hue-fair-refinement -->\n## HRL 0.12 balanced-parent refinement\n\n[Live hue-sheet comparison](https://gaycoonie.github.io/HRL/v2/hue-fair.html) keeps 0.11 Gen tonal balanced beside two shared-bank continuations. [Scored results](v2/research/hue-fair-refine/results/REPORT.md), [review limits](v2/research/hue-fair-refine/FINDINGS.md), [source](v2/research/hue-fair-refine/README.md), and the complete new trial logs are retained. Earlier releases and accepted defaults remain available.\n')
assert all(h(P/f'results/{n}.json')==sha for n,sha in frozen.items())
receipt={'coefficientsUnchanged':True,'checkpoints':frozen,'parentExportIdentity':'HRL-0.11-gen-tonal / balanced','viewCheckpointPreserved':True,'blueNeighborControls':[255,263,269,270,273,275,277,281,285,293],'importUpdatesPerHueEvidence':True}
(P/'results/finalization.json').write_text(json.dumps(receipt,indent=2)+'\n')
hashes={str(f):h(f) for f in P.rglob('*') if f.is_file() and f.suffix!='.pyc' and f.name!='SOURCE_HASHES.json'}
(P/'SOURCE_HASHES.json').write_text(json.dumps(hashes,indent=2)+'\n');print(json.dumps(receipt,indent=2))
