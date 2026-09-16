import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHRLv2,expandReleaseAngles,levelToNonblack,nonblackToLevel,toBaseCoordinates,fromBaseCoordinates,basrShares} from '../lib/index.mjs';
const root=new URL('../',import.meta.url),quick=process.argv.includes('--quick');
const m=await createHRLv2(),parent=m.base,full=await createHRLv2({gamut:'full'});
const bytes=await readFile(new URL('data/hue-field.json',root)),angles=JSON.parse(await readFile(new URL('data/release1-angles.json',root),'utf8')),ring=expandReleaseAngles(angles);
const report={id:'HRL-v2-BASR-0.4',test_mode:quick?'quick':'extended',field_sha256:createHash('sha256').update(bytes).digest('hex'),coefficients_changed:false,release_source:angles.source_commit,tests:{},limitations:['Computational tests, not new observer accuracy or COMBVD measurements.','No exhaustive test of the whole RGB8 cube or 2^48 full carrier.','0.2 shell-order audit is inherited under the invertible R/L remap.']};
assert.equal(report.field_sha256,'4b5c6af4bf3996275f39ddf99024d6d8357502f9be7782a4a0634a39f5a745d3');
let seed=0xBA540004;
const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
let inverse=0,minStep=Infinity,previous=-1;
for(let i=0;i<=10000;i++){
 const x=i/10000,y=levelToNonblack(x);inverse=Math.max(inverse,Math.abs(nonblackToLevel(y)-x));if(i)minStep=Math.min(minStep,y-previous);previous=y;
}
assert(inverse<1e-14&&minStep>0);assert.equal(levelToNonblack(0),0);assert.equal(levelToNonblack(1),1);
report.tests.level_curve={samples:10001,max_inverse_error:inverse,minimum_forward_step:minStep,midpoint_linear:levelToNonblack(.5)};
let coordError=0,shareError=0;
for(let i=0;i<20000;i++){
 const L=random(),q={H:random()*360,R:random()*L,L},b=toBaseCoordinates(q),back=fromBaseCoordinates(b),s=basrShares(q);
 coordError=Math.max(coordError,delta([q.R,q.L],[back.R,back.L]));shareError=Math.max(shareError,Math.abs(s.black+s.white+s.vivid-1));
 assert(s.black>=0&&s.white>=0&&s.vivid>=0&&b.R<=b.L);
}
assert(coordError<1e-14&&shareError<1e-14);report.tests.remap_inverse={samples:20000,max_coordinate_error:coordError,max_share_sum_error:shareError};
function roundtrip(name,count,make,bits){
 let worst=0,mismatches=0,outside=0;const start=performance.now(),max=bits?2**bits-1:1;
 for(let i=0;i<count;i++){
  const q=make(i),rgb=q.map(x=>x/max),back=m.toRGB(m.fromRGB(rgb,37));worst=Math.max(worst,delta(rgb,back));
  if(bits&&back.some((x,j)=>Math.round(x*max)!==q[j]))mismatches++;
  if(back.some(x=>x< -1e-11||x>1+1e-11))outside++;
 }
 assert.equal(mismatches,0,name);assert.equal(outside,0,name);assert(worst<1e-7,name);
 report.tests[name]={samples:count,max_encoded_channel_error:worst,integer_mismatches:bits?mismatches:null,out_of_gamut:outside,seconds:(performance.now()-start)/1000};console.log(name,report.tests[name]);
}
roundtrip('RGB8_random',quick?2000:30000,()=>[0,0,0].map(()=>Math.floor(random()*256)),8);
roundtrip('RGB16_random',quick?2000:30000,()=>[0,0,0].map(()=>Math.floor(random()*65536)),16);
roundtrip('continuous_srgb',quick?1000:10000,()=>[random(),random(),random()]);
roundtrip('RGB16_all_grays',65536,i=>[i,i,i],16);
if(!quick){
 roundtrip('RGB16_all_vivid',393210,i=>{const s=Math.floor(i/65535),u=i%65535;return [[65535,u,0],[65535-u,65535,0],[0,65535,u],[0,65535-u,65535],[u,0,65535],[65535,0,65535-u]][s];},16);
 const boundary=[];
 for(let a=0;a<256;a++)for(let b=0;b<256;b++)for(let c of [0,255]){boundary.push([c,a,b]);if(a!==0&&a!==255)boundary.push([a,c,b]);if(a!==0&&a!==255&&b!==0&&b!==255)boundary.push([a,b,c]);}
 roundtrip('RGB8_all_unique_boundary',boundary.length,i=>boundary[i],8);
}
let anchor=0,anchorH=0;
for(const row of ring.entries){const q={H:row.H,R:1,L:1};anchor=Math.max(anchor,delta(m.toRGB(q),row.rgb8.map(x=>x/255)));anchorH=Math.max(anchorH,Math.abs(m.fromRGB(row.rgb8.map(x=>x/255)).H-row.H));assert.deepEqual(m.toXYZ(q),parent.toXYZ(q));}
report.tests.release_anchors={samples:1530,max_encoded_channel_error:anchor,max_H_error:anchorH,unchanged_vs_parent:true};assert(anchor<1e-7);
let arms=0,gray=0,maxHue=0,edge0=0,edge1=0;const testVectors=[];
for(let H=0;H<360;H+=15)for(let i=0;i<=48;i++){
 const t=i/48,q=levelToNonblack(t),a=m.arms(H,t);arms+=2;
 assert(delta(a.blackward,parent.toXYZ({H,R:q,L:q}))<1e-14);
 assert.deepEqual(a.whiteward,parent.toXYZ({H,R:t,L:1}));
 gray=Math.max(gray,delta(a.neutral,m.field.white.map(x=>x*q)));
 for(const [R,L]of[[t,t],[t,1],[t*.6,.6]]){
  const p={H,R,L},xyz=m.toXYZ(p),lin=m.toLinear(p);
  if(R>1e-6){const ph=m.field.label(xyz),expected=m.labelForHue(H);maxHue=Math.max(maxHue,Math.abs(((ph-expected+540)%360)-180));}
  assert(lin.every(x=>x>=0&&x<=1));
  if(R===L)edge0=Math.max(edge0,Math.abs(Math.min(...lin)));
  if(L===1)edge1=Math.max(edge1,Math.abs(Math.max(...lin)-1));
  if(i%16===0)testVectors.push({q:p,xyz,lin});
 }
}
assert(gray===0&&edge0===0&&edge1===0&&maxHue<1e-6);
report.tests.arms={boundary_points:arms,neutral_axis_error:gray,min_channel_black_arm:edge0,max_channel_white_arm_error:edge1,max_defined_hue_label_error:maxHue};
let fullError=0,fullCodes=0;const fullN=quick?500:5000;
for(let i=0;i<fullN;i++){
 const L=random(),q={H:360*random(),R:L*random(),L},xyz=full.toXYZ(q),back=full.fromXYZ(xyz,q.H);fullError=Math.max(fullError,full.distance(q,back));
 const code=[0,0,0].map(()=>Math.floor(random()*65536)),x=code.map(t=>t/65535),decoded=full.fromPseudoRGB(x),encoded=full.toPseudoRGB(decoded);if(encoded.some((v,k)=>Math.round(65535*v)!==code[k]))fullCodes++;
}
assert(fullError<1e-7&&fullCodes===0);report.tests.full_domain={triangle_roundtrips:fullN,pseudo_RGB16_roundtrips:fullN,max_bicone_error:fullError,integer_mismatches:fullCodes};
report.tests.edges=[m.distance({H:0,R:0,L:0},{H:0,R:0,L:1}),m.distance({H:0,R:0,L:0},{H:0,R:1,L:1}),m.distance({H:0,R:0,L:1},{H:0,R:1,L:1})];assert(report.tests.edges.every(v=>Math.abs(v-1)<1e-15));
let rejected=0;
for(const bad of [{H:NaN,R:0,L:0},{H:0,R:-1,L:1},{H:0,R:.6,L:.5},{H:0,R:0,L:2},null]){assert.throws(()=>m.toXYZ(bad));rejected++;}
assert.throws(()=>m.fromXYZ([2,2,2]));rejected++;assert.throws(()=>full.fromXYZ([2,2,2]));rejected++;
report.tests.invalid_inputs={rejected};report.pass=true;
await writeFile(new URL('results/basr-verification'+(quick?'-quick':'')+'.json',root),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('results/basr-test-vectors.json',root),JSON.stringify(testVectors)+'\n');
console.log(JSON.stringify(report,null,2));
