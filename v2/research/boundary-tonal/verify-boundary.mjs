/** Boundary coverage and import semantics, before any new fitting. */
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createSpectralTonalHRL,createPhysicalCone,boundaryRecord,D65} from './index.mjs';
import {RelativeSpectralCarrier,adaptWhite} from '../relative-domain/index.mjs';
import {createMappedHRL} from '../mapped-012/import.mjs';
let seed=180926;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),err=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i]))),rel=(a,b)=>err(a,b)/Math.max(1,...a.map(Math.abs));
const r=await boundaryRecord(),cone=await createPhysicalCone(),carrier=new RelativeSpectralCarrier(cone),m=await createSpectralTonalHRL({checkpoint:'boundary'}),native=await createSpectralTonalHRL({gamut:'srgb',checkpoint:'boundary'}),old=await createMappedHRL({gamut:'srgb'});
const out={seed,geometryOnly:true,boundary:r.id,vertices:r.vertices_xy.length,cmfHash:r.cmfFloat64LittleEndianSHA256,importPolicy:m.inputPolicy,modelsFitted:false};
assert.equal(m.toIntensityColor,undefined);assert.equal(m.fromIntensityColor,undefined);
let mono=0;for(const x of r.cmfs_xyz){assert(cone.physical(x));const p=x.map(v=>v*.2/x[1]),q=m.importXYZ(p);assert.equal(q.events.length,0);mono=Math.max(mono,rel(p,m.toXYZ(q.coordinates)));}
let inter=0;for(let i=0;i<r.cmfs_xyz.length-1;i++)for(const t of [.1,.5,.9]){const p=r.cmfs_xyz[i].map((v,j)=>v*(1-t)+r.cmfs_xyz[i+1][j]*t);assert(cone.physical(p));inter++;}
let mixerr=0;for(let i=0;i<4096;i++){const weights=[rand(),rand(),rand()],x=weights.map(()=>r.cmfs_xyz[Math.floor(rand()*471)]);let p; const Y=rand(),sum=[0,1,2].map(j=>weights.reduce((s,w,k)=>s+w*x[k][j],0));p=sum.map(v=>v*Y/sum[1]);assert(cone.physical(p));mixerr=Math.max(mixerr,rel(p,carrier.toXYZ(carrier.fromXYZ(p))));}
let maxQ=0,nativeChange=0;for(let i=0;i<4096;i++){const L=rand(),q={H:360*rand(),R:L*rand(),L},x=m.toXYZ(q),b=m.fromXYZ(x);assert(cone.physical(x));maxQ=Math.max(maxQ,err(m.embed(q),m.embed(b)));assert.deepEqual(native.toXYZ(q),old.toXYZ(q));nativeChange=Math.max(nativeChange,err(native.toXYZ(q),old.toXYZ(q)));}
for(let i=0;i<2048;i++){const q=[rand(),rand(),rand()].map(v=>Math.floor(v*65536)),x=carrier.decode16(q),h=m.fromXYZ(x);assert.deepEqual(carrier.encode16(m.toXYZ(h)),q);}
let vivid=0;for(let H=0;H<360;H+=.5)vivid=Math.max(vivid,Math.abs(cone.coordinates(m.vivid(H)).rho-1));
const a=await createSpectralTonalHRL({checkpoint:'boundary',referenceWhiteNits:100});for(const[model,want]of [[m,.4],[a,1]]){const v=model.importXYZ(D65.map(v=>v*1.2),{sourceWhiteNits:100});assert(Math.abs(v.mappedXYZ[1]-want)<1e-12);const abs=model.importXYZ(D65.map(v=>v*120),{absolute:true});assert(rel(v.mappedXYZ,abs.mappedXYZ)<1e-12);}
const d50=[.96422,1,.82521],x=D65.map(v=>v*.4);assert(rel(m.importXYZ(adaptWhite(x,D65,d50),{sourceWhite:d50}).mappedXYZ,x)<1e-12);
for(const Y of [1.0040999958,1.2,8]){const x=cone.at(210,.8,Y),p=m.importXYZ(x);assert(p.events.includes('luminance-clipped'));assert(rel(p.mappedXYZ,x.map(v=>v/Y))<1e-12);}
for(const p of [[.68,.32,0],[.708,.292,0],[.17,.797,.033],[.131,.046,.823]]){const q=m.importXYZ(p);assert(cone.physical(q.mappedXYZ));assert(q.events.length>0);}
assert(maxQ<1e-8&&mono<1e-8&&vivid<1e-10);assert.throws(()=>m.fromXYZ([NaN,0,0]),TypeError);
Object.assign(out,{spectralSamples:471,betweenWavelengthSamples:inter,nonnegativeMixtures:4096,maxCarrierMixtureRelativeError:mixerr,monochromaticMaxRelativeRoundtrip:mono,randomHRLRoundtrips:4096,maxEmbeddingError:maxQ,nativeXYZMaxChange:nativeChange,exact16BitRoundtrips:2048,vividSamples:720,maxVividRadialError:vivid,luminanceExamplesPassed:true,sourceWhiteAdaptationPassed:true,nominalPrimaryMappingPassed:true,noExtraIntensityCoordinate:true});
fs.writeFileSync(new URL('results/boundary-verification.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
