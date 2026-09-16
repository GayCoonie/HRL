import fs from 'node:fs';import{createHRLResearch,PathModel}from'../../../lib/research.mjs';
const root='v2/research/anchor-0.7',extra=JSON.parse(fs.readFileSync(root+'/sources/rogers2016-intervals.json'));
for(const gamut of ['srgb','full']){
 const old=await createHRLResearch({gamut}),m=new PathModel(old.base,JSON.parse(fs.readFileSync(root+`/results/anchor-${gamut}.json`)),old.readout);
 const data=JSON.parse(fs.readFileSync(root+`/results/anchor-${gamut}-pairs.json`));
 const intervals=extra.pairs.map(r=>{try{return{...r,a:m.fromXYZ(r.xyz1),b:m.fromXYZ(r.xyz2),admitted:true};}catch(e){return{...r,admitted:false,reason:e.message};}});
 // Geometry restraint to the accepted OPAL 0.6 surface, including both chromatic arms.
 const probes=[];
 for(let H=0;H<360;H+=15)for(let l=1;l<=10;l++)for(let u=0;u<=10;u++){
  const q={H,R:l/10*u/10,L:l/10},xyz=old.toXYZ(q);probes.push({input:m.fromXYZ(xyz,H),target:q,arm:u===10||l===10});
 }
 fs.writeFileSync(root+`/results/fit-input-${gamut}.json`,JSON.stringify({gamut,pairs:data,intervals,probes}));console.log(gamut,intervals.filter(r=>r.admitted).length);
}
