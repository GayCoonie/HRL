from pathlib import Path
src=Path('/workspace/scratch/20abb8fd27ac/hrl-optimization/review-runtime-round3-probe.mjs').read_text()
src=src.replace("from '../hrl-v2-next/v2/research/boundary-tonal/index.mjs'", "from '/workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/research/boundary-tonal/index.mjs'")
src=src.replace("from '../hrl-v2-next/v2/research/tonal-semantics/ruler.mjs'", "from '/workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/research/tonal-semantics/ruler.mjs'")
src="import {createHRLv2} from '/workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/index.mjs';\n"+src
src=src.replace("new URL('./',import.meta.url)","new URL('file:///workspace/scratch/20abb8fd27ac/hrl-optimization/')")
src=src.replace("new URL('../hrl-v2-next/v2/research/boundary-tonal/',import.meta.url)","new URL('file:///workspace/scratch/20abb8fd27ac/hrl-v2-next/v2/research/boundary-tonal/')")
src=src.replace("['blue-raw','blue-robust']","['beta1','sheet-raw','blue-raw','blue-robust']")
src=src.replace("const file=new URL('../hrl-v2-next/v2/research/tonal-next/trials/'+name+'.json',dir)","const file=name==='beta1'?new URL('results/metric.json',boundary):new URL('../hrl-v2-next/v2/research/tonal-next/trials/'+name+'.json',dir)")
src=src.replace("result.profiles[gamut]=z;", """result.profiles[gamut]=z;
  const expected=read(new URL('audit-'+(name==='beta1'?'baseline':name)+'.json',dir)).models[name==='beta1'?'metric':name].profiles[gamut];
  z.maxEmbeddingRoundtripError=0;z.exportedHueSheet=[];
  const publicFactory=name==='beta1'?await createHRLv2({gamut}):null;
  for(const H of [0,269,275,281,359.999999])for(const L of [0,1e-8,.001,.05,.5,1])for(const U of [0,.5,.999,1]){
   const q={H,R:L*U,L},xyz=m.toXYZ(q),back=m.fromXYZ(xyz),error=Math.max(...m.embed(q).map((v,i)=>Math.abs(v-m.embed(back)[i])));
   assert(xyz.every(Number.isFinite));assert(error<1e-7);z.maxEmbeddingRoundtripError=Math.max(z.maxEmbeddingRoundtripError,error);
   if(publicFactory)assert.deepEqual(xyz,publicFactory.toXYZ(q));
  }
  for(let il=0;il<=8;il++)for(let ir=0;ir<=il;ir++){const q={H:275,R:ir/8,L:il/8};z.exportedHueSheet.push({q,xyz:m.toXYZ(q)})}
  if(publicFactory)z.publicExplicitFactoryIdentitySamples=120;
  for(const key of ['weighted','unweighted','pairs'])assert(Math.abs(z.retained[key]-expected.retained[key])<1e-8);
""")
src=src.replace("assert.equal(mappedPairs,482)}", "assert.equal(mappedPairs,482);for(const key of ['weighted','unweighted','pairs','mappedPairs'])assert(Math.abs(z.mappedAllInput[key]-expected.mappedAllInput[key])<1e-8)}")
src=src.replace("z.sheetMean=z.sheetValues.reduce((a,b)=>a+b,0)/z.sheetValues.length;", """z.sheetMean=z.sheetValues.reduce((a,b)=>a+b,0)/z.sheetValues.length;
  const sheet=expected.sheet.rows.find(r=>r.H===281),paths=expected.paths.rows.find(r=>r.H===281);
  z.maxSheetDifference=Math.max(...z.sheetValues.map((v,i)=>Math.abs(v-sheet.values[i])));assert(z.maxSheetDifference<1e-8);
  z.maxPathCVDifference=Math.max(...Object.keys(z.paths).flatMap(f=>z.paths[f].map((v,i)=>Math.abs(v.cv-paths[f][i].cv))));assert(z.maxPathCVDifference<1e-10);
""")
src=src.replace("new URL('review-runtime-round3-probe.json',dir)","new URL('file:///workspace/scratch/13a5381bdd70/review/runtime-fresh.json')")
src=src.replace("Fresh scores and H281 paths/sheet before reading final audit receipts.","Fresh baseline/selected/final pair scores, H281 paths/sheet, H275 direct-runtime XYZ export, finite boundary probes, Beta1 public-versus-explicit factory identity; checked against final receipts.")
Path('/workspace/scratch/13a5381bdd70/review/runtime-fresh.mjs').write_text(src)
