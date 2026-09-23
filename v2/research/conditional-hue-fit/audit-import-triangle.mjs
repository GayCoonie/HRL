/** All 3813 pinned observer pairs, both endpoints, both gamuts, actual JS import. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const [benchmarkPath,modulePath,recordPath,outputPath]=process.argv.slice(2);
if(![benchmarkPath,modulePath,recordPath,outputPath].every(Boolean))
  throw Error('Usage: node audit-import-triangle.mjs <benchmark.mjs> <candidate index.mjs> <record.json> <output.json>');
const {loadInputs}=await import(pathToFileURL(benchmarkPath).href);
const {createConditionalHueHRL}=await import(pathToFileURL(modulePath).href);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const record=JSON.parse(fs.readFileSync(recordPath));
const {raw,identity}=loadInputs();
const report={schema:'hrl-conditional-import-triangle-v1',candidateSHA256:sha(recordPath),
  benchmarkSHA256:sha(benchmarkPath),factorySHA256:sha(modulePath),inputIdentity:identity,
  method:'Exact JS importXYZ of both endpoints of all pinned COMBVD pairs; tolerance=0, inclusive terminal boundaries',
  gamuts:{}};
for(const gamut of ['srgb','full']){
  const model=await createConditionalHueHRL({gamut,record,referenceWhiteNits:300});
  let minH=Infinity,maxH=-Infinity,minR=Infinity,maxR=-Infinity,minL=Infinity,maxL=-Infinity,
    closestReachLevel=Infinity,nearNeutral=0,nearVivid=0,mappedEndpoints=0;
  for(const values of [raw.xyz1,raw.xyz2])for(const xyz of values){
    const {coordinates:q,events}=model.importXYZ(xyz),{H,R,L}=q;
    if(![H,R,L].every(Number.isFinite)||H<0||H>=360||R<0||L<0||R>L||L>1)
      throw Error(`Outside strict public triangle (${gamut}): ${JSON.stringify({xyz,q,events})}`);
    minH=Math.min(minH,H);maxH=Math.max(maxH,H);
    minR=Math.min(minR,R);maxR=Math.max(maxR,R);
    minL=Math.min(minL,L);maxL=Math.max(maxL,L);
    closestReachLevel=Math.min(closestReachLevel,L-R);
    if(R<1e-9)nearNeutral++;
    if(L-R<1e-9)nearVivid++;
    if(events.length)mappedEndpoints++;
  }
  report.gamuts[gamut]={endpoints:raw.xyz1.length*2,mappedEndpoints,
    minH,maxH,minR,maxR,minL,maxL,closestReachLevel,nearNeutral,nearVivid};
}
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.gamuts));
