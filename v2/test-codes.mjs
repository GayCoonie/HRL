import assert from 'node:assert/strict';
import {createHRLv2} from './index.mjs';
import {createSpectralTonalHRL} from './research/boundary-tonal/index.mjs';
import {createShortCodeCodec,SHORT_CODE_SCALES,canonicalScale} from './codes.mjs';

const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t,`${a} differs from ${b} by ${Math.abs(a-b)}`);
const hueError=(a,b)=>((a-b+540)%360)-180;
const letters=(n,width)=>{let s='';while(width--){s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
const nativeHue=n=>Math.floor(n/180).toString(36).toUpperCase()+Math.floor(n/5%36).toString(36).toUpperCase()+n%5;
const edge16=n=>{const s=Math.floor(n/65535),t=n%65535;return [[65535,t,0],[65535-t,65535,0],[0,65535,t],[0,65535-t,65535],[t,0,65535],[65535,0,65535-t]][s];};
let seed=0x5948524c;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const models={},codecs={};
for(const gamut of ['srgb','full']){
 const model=models[gamut]=await createHRLv2({gamut});
 const codec=codecs[gamut]=await createShortCodeCodec(model);
 assert.equal(codec.scale,SHORT_CODE_SCALES[gamut]);
 assert.equal(canonicalScale(gamut),codec.scale);
 assert.equal(codec.scale.maximum,gamut==='srgb'?175.75:4569.75);
 assert.equal(codec.context.gamut,gamut);
 assert.equal(codec.context.modelVersion,model.version);
 assert.equal(codec.context.checkpoint,model.checkpoint);
 assert.match(codec.context.definitionSHA256,/^[a-f0-9]{64}$/);
 const max=codec.scale.maximum;
 assert.deepEqual(codec.toCanonical({H:20,R:1,L:1}),{H:20,R:max,L:max});
 assert.deepEqual(codec.fromCanonical({H:20,R:max,L:max}),{H:20,R:1,L:1});
 assert.equal(codec.fromCanonical({H:0,R:0,L:0}).L,0);
 // Continuous coordinate helpers must not introduce an implicit quantizer.
 const continuous={H:7.25,R:.123456789,L:.823456789};
 const rt=codec.fromCanonical(codec.toCanonical(continuous));
 near(rt.R,continuous.R,1e-15);near(rt.L,continuous.L,1e-15);
 for(const q of [{H:0,R:0,L:0},{H:0,R:0,L:1},{H:359.99,R:1,L:1}]){
  const z=codec.quantize(q),decoded=codec.decode(z.code);
  assert.deepEqual(z.coordinates,decoded);
  assert.equal(z.code.length,codec.scale.payloadLength);
  assert.equal(decoded.R,q.R);assert.equal(decoded.L,q.L);
 }
 let maxHue=0,maxRL=0;
 for(let i=0;i<500;i++){
  const L=random(),q={H:random()*360,R:L*random(),L};
  const z=codec.quantize(q),d=z.coordinates;
  assert.equal(codec.encode(d),z.code);
  assert.ok(d.R<=d.L&&d.R>=0&&d.L<=1);
  maxHue=Math.max(maxHue,Math.abs(hueError(d.H,q.H)));
  maxRL=Math.max(maxRL,Math.abs(d.R-q.R),Math.abs(d.L-q.L));
  near(z.error.hueDegrees,hueError(d.H,q.H));
  near(z.error.reachNormalized,d.R-q.R,1e-15);
  near(z.error.levelNormalized,d.L-q.L,1e-15);
  assert.ok(Math.abs(d.R-q.R)<=.5000001/codec.scale.integerMax);
  assert.ok(Math.abs(d.L-q.L)<=.5000001/codec.scale.integerMax);
  near(z.canonical.R*100,Math.round(z.canonical.R*100),1e-7);
  near(z.canonical.L*100,Math.round(z.canonical.L*100),1e-7);
  const xyz=model.toXYZ(d),back=model.fromXYZ(xyz);
  near(back.R,d.R,2e-9);near(back.L,d.L,2e-9);
  if(d.R>1e-7)near(hueError(back.H,d.H),0,2e-7);
 }
 console.log(`${gamut}: 500 coordinate/code/XYZ roundtrips, max sampled hue quantization=${maxHue}deg, R/L=${maxRL}`);
 const envelope=codec.serialize({H:27,R:.25,L:.7});
 assert.deepEqual(codec.deserialize(envelope),codec.decode(envelope.code));
 assert.throws(()=>codec.deserialize({...envelope,context:{...envelope.context,checkpoint:'other'}}),/context|snapshot/i);
 assert.throws(()=>codec.deserialize({code:envelope.code}),/context|snapshot/i);
 for(const q of [{H:NaN,R:0,L:0},{H:0,R:-.1,L:1},{H:0,R:.8,L:.7},{H:0,R:0,L:1.01}])assert.throws(()=>codec.encode(q));
 assert.throws(()=>codec.fromCanonical({H:0,R:0,L:max+.01}));
 assert.throws(()=>codec.decode(' '));assert.throws(()=>codec.decode('aaa'.repeat(codec.scale.fieldWidth)));
}

const native=codecs.srgb,full=codecs.full;
assert.throws(()=>canonicalScale('rec2020'),/gamut/i);
assert.throws(()=>canonicalScale('__proto__'),/gamut/i);
assert.equal(native.decode('000AABABA').R,1/17575);
assert.equal(native.decode('000AABABA').L,26/17575);
assert.equal(native.decode('000BAAZZZ').R,676/17575);
assert.deepEqual(native.decode('Y00AAAZZZ'),{H:0,R:0,L:1});
assert.deepEqual(native.decode('ZZ4AAAZZZ'),{H:359,R:0,L:1});
assert.equal(native.encode({H:359.8,R:0,L:1},{degreeAlias:true}),'Y00AAAZZZ');
for(let degree=0;degree<360;degree++){
 const q={H:degree,R:1,L:1},code=nativeHue(6120+degree)+'ZZZZZZ';
 assert.deepEqual(native.decode(code),q);
 assert.equal(native.encode(q,{degreeAlias:true}),code);
}
const entries=models.srgb.model.source.base.ring.source.entries;
for(let index=0;index<1530;index++){
 const anchor=entries.find(e=>e.index===index),code=nativeHue(4*index)+'ZZZZZZ',q=native.decode(code);
 near(hueError(q.H,anchor.H),0,1e-12);
 assert.equal(native.encode(q),code);
 const rgb=models.srgb.toRGB(q).map(v=>Math.round(v*255));
 assert.deepEqual(rgb,anchor.rgb8);
 const xyz=models.srgb.toXYZ(q);xyz.forEach((v,i)=>near(v,anchor.xyz[i],3e-10));
}
for(let index=0;index<6120;index++){
 const code=nativeHue(index)+'AAAZZZ';
 assert.equal(native.encode(native.decode(code)),code);
}
console.log('srgb: all1530 exact RGB8 vivid anchors, all6120 ordinary hue slots, all360 degree aliases passed');

const anchorIndices=[0,1,65534,65535,131069,131070,196604,196605,262139,262140,327674,327675,393208,393209];
for(let i=0;i<150;i++)anchorIndices.push(Math.floor(random()*393210));
for(const index of anchorIndices){
 const code=letters(index,4)+'ZZZZZZZZ',q=full.decode(code),p=edge16(index);
 const xyz=models.full.carrier.decode16(p),actual=models.full.toXYZ(q);
 actual.forEach((v,i)=>near(v,xyz[i],1e-8*Math.max(1,Math.abs(v))));
 assert.deepEqual(models.full.carrier.encode16(actual),p);
 assert.equal(full.encode(q),code);
}
// Full hue addresses are actual warped carrier hues, never equal angular slots.
assert.ok(Math.abs(full.decode('AAAAZZZZZZZZ').H)>1);
assert.throws(()=>full.decode(letters(393210,4)+'AAAAAAAA'),/unused|unassigned/i);
assert.throws(()=>full.decode('ZZZZAAAAAAAA'),/unused|unassigned/i);
assert.throws(()=>full.encode({H:0,R:0,L:1},{degreeAlias:true}),/degree/i);
assert.throws(()=>native.decode('ZZ5AAAZZZ'),/syntax|format/i);
assert.throws(()=>native.decode('000ZZZAAA'),/triangle|Reach|R.*L/i);
assert.throws(()=>full.decode('AAAAZZZZAAAA'),/triangle|Reach|R.*L/i);
assert.throws(()=>native.decode('AAAAAAAAAAAA'),/gamut|syntax|format/i);
assert.throws(()=>full.decode('000AAAZZZ'),/gamut|syntax|format/i);
assert.throws(()=>native.deserialize(full.serialize({H:0,R:0,L:1})),/context|snapshot/i);
console.log(`full: ${anchorIndices.length} carrier anchors including all six edge corners, last slot, and sampled interior slots passed`);

const research=await createSpectralTonalHRL({gamut:'full',checkpoint:'metric'});
const researchCodec=await createShortCodeCodec(research);
assert.equal(researchCodec.context.gamut,'full');
assert.equal(researchCodec.context.modelVersion,research.version);
assert.equal(researchCodec.context.definitionSHA256,full.context.definitionSHA256);
const changed=structuredClone(research.definition);changed.coefficients[0][0][0][0]+=.001;
const altered=await createSpectralTonalHRL({gamut:'full',checkpoint:'metric',record:changed});
const alteredCodec=await createShortCodeCodec(altered);
assert.notEqual(alteredCodec.context.definitionSHA256,researchCodec.context.definitionSHA256);
assert.throws(()=>alteredCodec.deserialize(researchCodec.serialize({H:11,R:.4,L:.7})),/context|snapshot/i);
await assert.rejects(()=>createShortCodeCodec({gamut:'rec2020'}),/gamut/i);
await assert.rejects(()=>createShortCodeCodec({gamut:'full'}),/model|version|definition/i);
console.log('snapshot-bound contexts, strict syntax, unused slots, triangle validation and continuous scales passed');
