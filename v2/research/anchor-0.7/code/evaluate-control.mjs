import fs from 'node:fs';import{createHRLResearch,PathModel}from'../../../lib/research.mjs';
const rows=JSON.parse(fs.readFileSync('v2/research/equal-span/results/combvd-inputs.json'));
const score=(rs)=>{let dd=0,dv=0,vv=0;for(const r of rs){dd+=r.weight*r.de*r.de;dv+=r.weight*r.de*r.dv;vv+=r.weight*r.dv*r.dv;}return 100*Math.sqrt(Math.max(0,1-dv*dv/(dd*vv)));};
for(const gamut of ['srgb','full']){
 const old=await createHRLResearch({gamut}),record=JSON.parse(fs.readFileSync(`v2/research/anchor-0.7/results/anchor-${gamut}.json`)),m=new PathModel(old.base,record,old.readout);
 let retained=[];
 for(const r of rows)try{const a=m.fromXYZ(r.xyz1),b=m.fromXYZ(r.xyz2);retained.push({...r,a,b,de:m.distance(a,b),old_a:old.fromXYZ(r.xyz1),old_b:old.fromXYZ(r.xyz2)});}catch{}
 console.log(gamut,retained.length,score(retained));fs.writeFileSync(`v2/research/anchor-0.7/results/anchor-${gamut}-pairs.json`,JSON.stringify(retained));
}
