import fs from 'node:fs';import assert from 'node:assert/strict';
import {getSource,ADOBE_RGB1998,DISPLAY_P3} from './source.mjs';
const results={method:'Deterministic own-anchor path integration using the same readout and grid, not learned profile coefficients',builtins:{}};
for(const gamut of ['srgb','full']){
 const cached=await getSource(gamut),built=await getSource(gamut,{rebuild:true});let err=0;
 for(const family of ['level','reach']){const a=cached[family].record.rows,b=built[family].record.rows;for(let h=0;h<a.length;h++)for(let j=0;j<a[h].length;j++)for(let k=0;k<a[h][j].length;k++)err=Math.max(err,Math.abs(a[h][j][k]-b[h][j][k]));}
 assert(err<1e-10);results.builtins[gamut]={maxCachedVsRebuiltRowDifference:err,hues:72,secondary:33,parameter:65};console.log(gamut,err);
}
const third=await getSource(ADOBE_RGB1998);let error=0,minimumSlope=Infinity;
for(let i=0;i<1200;i++){const rgb=[i*.61803398875%1,i*.41421356237%1,i*.7320508%1],q=third.fromLinear(rgb),back=third.toLinear(q);error=Math.max(error,...back.map((v,j)=>Math.abs(v-rgb[j])));}
for(const L of [.001,.03,.25,.6,1])for(const U of [.001,.2,.7,1])for(let k=0;k<600;k++)minimumSlope=Math.min(minimumSlope,third.base.shell(k/100,U*L,L,true).derivative);
assert(error<1e-8);assert(minimumSlope>0);results.untrainedThirdGamut={id:ADOBE_RGB1998.id,matrix:ADOBE_RGB1998.matrix,sourceRoundtrips:1200,maxError:error,minAngularDerivative:minimumSlope,learnedParameters:0};
await assert.rejects(getSource(DISPLAY_P3),/polygonized physical cone/);results.knownBoundaryLimitation='Canonical P3 red falls slightly outside the inherited polygon. It is rejected, not silently clipped or claimed supported.';
await assert.rejects(getSource('unknown-gamut'),/Unknown gamut/);
fs.mkdirSync(new URL('results/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('results/source-gamut-verification.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
