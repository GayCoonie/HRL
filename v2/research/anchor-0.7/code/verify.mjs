/** Executable regression and benchmark checks for the additive OPAL 0.7 candidate. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHRLResearch,SpectralCarrier} from '../../../lib/research.mjs';
import {createOPALAnchor,fitCoordinates} from '../../../lib/opal-anchor.mjs';
import {levelToNonblack} from '../../../lib/basr.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),rd=n=>JSON.parse(fs.readFileSync(root+'/results/'+n,'utf8'));
let seed=0x0a7c0de;function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;}
const diff=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
const qerr=(m,a,b)=>m.distance(a,b);
const quick=process.argv.includes('--quick'),N=quick?1000:20000;
const record={id:'OPAL-0.7-gamut-anchor',seed:'0x0a7c0de',samples_per_profile:N,quick,profiles:{},limits:{rgb16_error:0.5/65535,native_error:3e-7},note:'Random and grid tests, not an exhaustive 16-bit cube enumeration. Positive 2-D orientation follows from triangular compositions of strictly increasing one-dimensional maps.'};
for(const gamut of ['srgb','full'])for(const balance of ['balanced','metric','conservative']){
 const m=await createOPALAnchor({gamut,balance}),old=await createHRLResearch({gamut});const p={rgb16:{samples:N,mismatches:0,max_error:0},continuous:{samples:N,max_error:0},hue_identity:{samples:N,max_difference:0},boundaries:{neutral_error:0,neutral_opal_difference:0,vivid_error:0,black_error:0},carrier:{samples:1000,max_difference:0},anchor_normalization_error:0,atlas_minimum_slope:Infinity,warp_inverse_error:0};
 for(let i=0;i<N;i++){
  const rgb=Array.from({length:3},()=>Math.floor(random()*65536)),v=rgb.map(x=>x/65535),xyz=gamut==='full'?m.carrier.toXYZ(v):null,q=gamut==='srgb'?m.fromRGB(v):m.fromXYZ(xyz);
  const back=gamut==='srgb'?m.toRGB(q):m.carrier.fromXYZ(m.toXYZ(q));
  p.rgb16.max_error=Math.max(p.rgb16.max_error,diff(back,v));if(back.some((v,j)=>Math.round(v*65535)!==rgb[j]))p.rgb16.mismatches++;
  const prev=gamut==='srgb'?old.fromRGB(v):old.fromXYZ(xyz);p.hue_identity.max_difference=Math.max(p.hue_identity.max_difference,Math.abs(q.H-prev.H));
  const L=random(),a={H:360*random(),L,R:L*random()},x=m.toXYZ(a),b=m.fromXYZ(x,a.H);p.continuous.max_error=Math.max(p.continuous.max_error,qerr(m,a,b));
  const w=fitCoordinates(fitCoordinates(a,m.fit),m.fit,true);p.warp_inverse_error=Math.max(p.warp_inverse_error,qerr(m,a,w));
  assert(b.R>=0&&b.R<=b.L&&b.L<=1);assert(x.every(Number.isFinite));
  if(gamut==='srgb')assert(m.toLinear(a).every(c=>c>=-1e-11&&c<=1+1e-11));
 }
 for(let H=0;H<360;H+=.5){
  p.boundaries.vivid_error=Math.max(p.boundaries.vivid_error,diff(m.vivid(H),old.vivid(H)));
  p.boundaries.black_error=Math.max(p.boundaries.black_error,diff(m.toXYZ({H,R:0,L:0}),[0,0,0]));
  for(let i=0;i<=32;i++){const L=i/32; p.boundaries.neutral_opal_difference=Math.max(p.boundaries.neutral_opal_difference,diff(m.toXYZ({H,R:0,L}),old.toXYZ({H,R:0,L}))); p.boundaries.neutral_error=Math.max(p.boundaries.neutral_error,diff(m.toXYZ({H,R:0,L}),m.field.white.map(v=>v*levelToNonblack(L))));}
 }
 for(const anchor of m.record.anchors){const [b,w,v]=anchor.embedded;p.anchor_normalization_error=Math.max(p.anchor_normalization_error,diff(b,[0,0]),diff(w,[1,0]),diff(v,[.5,Math.sqrt(3)/2]));}
 for(const atlas of [m.record.level,m.record.reach])for(const h of atlas.rows)for(const row of h)for(let i=1;i<row.length;i++)p.atlas_minimum_slope=Math.min(p.atlas_minimum_slope,(row[i]-row[i-1])/(atlas.parameter[i]-atlas.parameter[i-1]));
 const replacement=new SpectralCarrier(m.field,{rotation:17});
 for(let i=0;i<1000;i++){const L=random(),q={H:360*random(),L,R:L*random()},a=m.toXYZ(q);const saved=m.carrier;m.carrier=replacement;const b=m.toXYZ(q);m.carrier=saved;p.carrier.max_difference=Math.max(p.carrier.max_difference,diff(a,b));}
 assert.equal(p.rgb16.mismatches,0);assert(p.continuous.max_error<3e-7);assert(p.warp_inverse_error<1e-12);assert.equal(p.hue_identity.max_difference,0);assert(p.boundaries.neutral_error<2e-14);assert(p.boundaries.neutral_opal_difference<2e-14);assert.equal(p.boundaries.vivid_error,0);assert.equal(p.boundaries.black_error,0);assert.equal(p.carrier.max_difference,0);assert(p.anchor_normalization_error<1e-11);assert(p.atlas_minimum_slope>0);
 record.profiles[gamut+'-'+balance]=p;console.log(gamut,balance,JSON.stringify(p));
}
const srgb=await createOPALAnchor(),full=await createOPALAnchor({gamut:'full'});let cross=0;
for(let i=0;i<5000;i++){const q=srgb.fromRGB([random(),random(),random()]),x=srgb.toXYZ(q),f=full.fromXYZ(x),back=srgb.fromXYZ(full.toXYZ(f));cross=Math.max(cross,srgb.distance(q,back));}
assert(cross<3e-7);record.cross_gamut={samples:5000,max_native_error:cross,note:'Preserves physical XYZ, not identical gamut-relative H/R/L values or distances.'};
// All native 16-bit grays, exactly shared by the gamut-relative maps.
let grayMismatch=0,grayMax=0;for(let n=0;n<=65535;n++){const v=n/65535,q=srgb.fromRGB([v,v,v]),back=srgb.toRGB(q);grayMax=Math.max(grayMax,diff(back,[v,v,v]));if(back.some(x=>Math.round(x*65535)!==n))grayMismatch++;}assert.equal(grayMismatch,0);record.gray16={samples:65536,mismatches:grayMismatch,max_error:grayMax};
for(const q of [{H:0,R:1,L:.5},{H:0,R:0,L:-1},{H:NaN,R:0,L:1}])assert.throws(()=>srgb.toXYZ(q));
fs.writeFileSync(root+'/results/verification'+(quick?'-quick':'')+'.json',JSON.stringify(record,null,2)+'\n');console.log('All OPAL 0.7 checks passed.');
