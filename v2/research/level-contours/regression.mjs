import assert from 'node:assert/strict';
import {createHRLv2} from '../../index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
const name=process.env.HRL_CONTOUR_CANDIDATE||'strict';
const factory=process.argv.includes('--baseline')?createHRLv2:(await import('./index.mjs')).createContourHRL;
for(const gamut of ['srgb','full']){
 const m=await factory(process.argv.includes('--baseline')?{gamut}:{gamut,checkpoint:name});
 const v=Array.from({length:501},(_,i)=>genRuler(m.toXYZ({H:300,R:.08*.25*i/500,L:.08}))[0]);
 const variation=v.slice(1).reduce((s,x,i)=>s+Math.abs(x-v[i]),0);
 const turn=(variation-Math.abs(v.at(-1)-v[0]))/2;
 console.log(gamut,'H300 L.08 near-gray J turn',turn);
 assert(turn<.001,'Fixed-Level near-gray ridge exceeds 0.001 GenSpace J');
}
console.log('PASS fixed-Level H300 near-gray ridge regression');
