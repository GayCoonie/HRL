/** Direct JS/GenSpace fixed-public-Reach audit on regular and shifted hues.
 * Usage: node audit-fixed-reach.mjs <absolute factory module> <factory export>
 *        <absolute record json> <output json>
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {genRuler} from '../tonal-semantics/ruler.mjs';

const [modulePath,exportName,recordPath,outputPath]=process.argv.slice(2);
if(![modulePath,exportName,recordPath,outputPath].every(Boolean))throw Error('Four positional arguments required');
const module=await import(pathToFileURL(modulePath).href),factory=module[exportName];
if(typeof factory!=='function')throw Error('Factory unavailable');
const bytes=recordPath==='-'?null:fs.readFileSync(recordPath),record=bytes?JSON.parse(bytes):null,
  sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const grids={regular:Array.from({length:72},(_,i)=>i*5),shifted:Array.from({length:72},(_,i)=>i*5+2.5)};
const reaches=[.0001,.001,.01,.05,.2,.5,.8];
const output={schema:'hrl-baseline-direct-fixed-reach-v1',recordPath,recordSHA256:bytes?sha(bytes):null,
  entryPath:modulePath,entrySHA256:sha(fs.readFileSync(modulePath)),factory:exportName,
  method:'Actual JS XYZ; direct HelmLab GenSpace J for 65 points per fixed-public-Reach path. No RGB display clipping.',
  grids:Object.fromEntries(Object.entries(grids).map(([k,v])=>[k,{hues:v,reaches,pointsPerPath:65}])),gamuts:{}};
for(const gamut of ['srgb','full']){
  const model=await factory({gamut,referenceWhiteNits:300,...(record?{record}:{})});
  output.gamuts[gamut]={};
  for(const [name,hues] of Object.entries(grids)){
    let sumTotalRetreat=0,sumTotalYRetreat=0,worstStepDrop=0,worstTotalRetreat=0,
      worstYDrop=0,negativeJSteps=0,negativeYSteps=0,worstLocation=null,worstPath=null;
    for(const H of hues)for(const R of reaches){
      let prev=null,totalRetreat=0,totalYRetreat=0;
      for(let i=0;i<=64;i++){
        const L=R+(1-R)*i/64,xyz=model.toXYZ({H,R,L}),J=genRuler(xyz)[0];
        if(prev){const dj=Math.max(0,prev.J-J),dy=Math.max(0,prev.Y-xyz[1]);
          totalRetreat+=dj;totalYRetreat+=dy;
          if(dj>0)negativeJSteps++;
          if(dy>0)negativeYSteps++;
          if(dj>worstStepDrop){worstStepDrop=dj;worstLocation={H,R,Lprevious:prev.L,L,Jprevious:prev.J,J};}
          worstYDrop=Math.max(worstYDrop,dy);
        }
        prev={L,J,Y:xyz[1]};
      }
      if(totalRetreat>worstTotalRetreat){worstTotalRetreat=totalRetreat;worstPath={H,R};}
      sumTotalRetreat+=totalRetreat;sumTotalYRetreat+=totalYRetreat;
    }
    const paths=hues.length*reaches.length;
    output.gamuts[gamut][name]={paths,meanTotalRetreat:sumTotalRetreat/paths,worstTotalRetreat,worstPath,
      worstStepDrop,worstLocation,negativeJSteps,meanTotalYRetreat:sumTotalYRetreat/paths,worstYDrop,negativeYSteps};
  }
  const probe=[];
  for(const H of [60,273])for(const [R,L] of [[.1,.5],[.1,.9],[.2,.35],[.2,.9],[.5,1]]){
    const q={H,R,L},p=model.model.toPhysical?model.model.toPhysical(q):
      model.model.source.toBase(model.model.toSource(q));
    const G=model.model.transport?.gray(L)??model.model.source.toBase(model.model.toSource({H,R:0,L})).L;
    probe.push({H,R,L,physicalHue:p.H,a:p.L,s:p.R/p.L,
      normalizedGrayDifference:L<1?(p.L-G)/(1-G):null});
  }
  output.gamuts[gamut].yellowBlueProbe=probe;
}
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(output.gamuts).map(([g,s])=>[g,{regular:s.regular,shifted:s.shifted}]))));
