/** Post-Release1 HRL addresses. Floating model coordinates remain normalized.
 * A payload is interpreted only by a codec bound to a particular model snapshot.
 */
export const SHORT_CODE_VERSION='1.0.0';
export const SHORT_CODE_SCALES=Object.freeze({
 srgb:Object.freeze({gamut:'srgb',pattern:'HHHRRRLLL',payloadLength:9,fieldWidth:3,integerMax:17575,maximum:175.75,step:.01,hueSlots:6120,degreeAliases:360}),
 full:Object.freeze({gamut:'full',pattern:'HHHHRRRRLLLL',payloadLength:12,fieldWidth:4,integerMax:456975,maximum:4569.75,step:.01,hueSlots:393210,degreeAliases:0})
});
export function canonicalScale(gamut){
 if(!Object.hasOwn(SHORT_CODE_SCALES,gamut))throw new RangeError('Short-code gamut must be srgb or full');
 return SHORT_CODE_SCALES[gamut];
}
const wrap=(x,n=360)=>((x%n)+n)%n;
const hueDifference=(a,b)=>wrap(a-b+180)-180;
const BASE36='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function valid(q,maximum=1){
 if(!q||![q.H,q.R,q.L].every(Number.isFinite)||q.R<0||q.R>q.L||q.L>maximum)
  throw new RangeError(`Triangle requires finite H and 0 <= R <= L <= ${maximum}`);
}
function letters(n,width){
 let out='';
 while(width--){out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26);}
 return out;
}
function number(text){let n=0;for(const c of text)n=26*n+c.charCodeAt(0)-65;return n;}
const nativeText=n=>BASE36[Math.floor(n/180)]+BASE36[Math.floor(n/5)%36]+n%5;
const nativeNumber=s=>(BASE36.indexOf(s[0])*36+BASE36.indexOf(s[1]))*5+Number(s[2]);
function stableJSON(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(stableJSON).join(',')+']';
 return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stableJSON(value[k])).join(',')+'}';
}
async function sha256(value){
 const bytes=new TextEncoder().encode(stableJSON(value));
 const crypto=globalThis.crypto??(await import('node:crypto')).webcrypto;
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
}
function releaseEntries(model){
 const entries=model.model?.source?.base?.ring?.source?.entries;
 if(!Array.isArray(entries)||entries.length!==1530)throw new TypeError('Model needs its unchanged 1530-entry release hue ring');
 const ordered=entries.slice().sort((a,b)=>a.index-b.index);
 if(ordered.some((e,i)=>e.index!==i||!Number.isFinite(e.H)))throw new TypeError('Invalid release hue-ring inventory');
 return ordered;
}
function nativeHueMap(entries){
 const hues=[wrap(entries[0].H)];
 for(let i=1;i<entries.length;i++){
  const delta=wrap(entries[i].H-entries[i-1].H);
  if(!(delta>0&&delta<180))throw new RangeError('Release hue ring must keep its ordered RGB8 anchors');
  hues.push(hues.at(-1)+delta);
 }
 if(hues.at(-1)>=hues[0]+360)throw new RangeError('Release hue ring wraps more than once');
 hues.push(hues[0]+360);
 function decode(index){
  if(index>=6120)return index-6120;
  const i=Math.floor(index/4),fraction=(index%4)/4;
  return wrap(hues[i]+fraction*(hues[i+1]-hues[i]));
 }
 function encode(H){
  const h=hues[0]+wrap(H-hues[0]);let lo=0,hi=1530;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(hues[mid]<=h)lo=mid;else hi=mid;}
  const position=4*(lo+(h-hues[lo])/(hues[lo+1]-hues[lo]));
  const lower=wrap(Math.floor(position),6120),upper=(lower+1)%6120;
  // Angular nearest, with the lower numeric address winning exact ties.
  return nearest(H,[lower,upper],decode);
 }
 return {encode,decode};
}
function edge16(index){
 const s=Math.floor(index/65535),t=index%65535;
 return [[65535,t,0],[65535-t,65535,0],[0,65535,t],[0,65535-t,65535],[t,0,65535],[65535,0,65535-t]][s];
}
function edgePosition([r,g,b]){
 if(r>=g&&g>=b)return g/6;
 if(g>=r&&r>=b)return(2-r)/6;
 if(g>=b&&b>=r)return(2+b)/6;
 if(b>=g&&g>=r)return(4-g)/6;
 if(b>=r&&r>=g)return(4+r)/6;
 return wrap((6-b)/6,1);
}
function nearest(H,indices,decode){
 let best=Infinity,distance=Infinity;
 for(const index of indices){
  const d=Math.abs(hueDifference(decode(index),H));
  if(d<distance||(d===distance&&index<best)){best=index;distance=d;}
 }
 return best;
}
function fullHueMap(model){
 const carrier=model.carrier;
 if(!carrier||typeof carrier.decode16!=='function'||typeof carrier.fromXYZ!=='function')
  throw new TypeError('Full codec needs the actual model pseudo-RGB16 carrier');
 // The bounded cache does not allocate or evaluate the 393210-point inventory.
 const cache=new Map();
 function decode(index){
  if(index>=393210)throw new RangeError('Unassigned full hue slot');
  if(cache.has(index))return cache.get(index);
  const q=model.fromXYZ(carrier.decode16(edge16(index))),H=wrap(q.H);
  if(!Number.isFinite(H)||Math.abs(q.R-1)>1e-8||Math.abs(q.L-1)>1e-8)
   throw new RangeError('Carrier vivid anchor does not meet the model vivid ring');
  if(cache.size>=2048)cache.delete(cache.keys().next().value);
  cache.set(index,H);return H;
 }
 function encode(H){
  const rgb=carrier.fromXYZ(model.toXYZ({H:wrap(H),R:1,L:1})),min=Math.min(...rgb),max=Math.max(...rgb);
  if(!(max>min))throw new RangeError('Vivid hue must have a nonneutral carrier point');
  const v=rgb.map(x=>(x-min)/(max-min)),position=edgePosition(v)*393210,lower=Math.floor(position);
  // Include adjacent slots to absorb roundoff at an exactly represented anchor.
  return nearest(H,[-1,0,1,2].map(d=>wrap(lower+d,393210)),decode);
 }
 return {encode,decode};
}

/** Create a browser/Node codec attached to an existing v2 model.
 * SHA-256 context fields describe the actual loaded data, not a guessed release.
 * Keep the model immutable for the codec lifetime; create another codec after a fit.
 */
export async function createShortCodeCodec(model){
 const scale=canonicalScale(model?.gamutID??model?.gamut);
 if(!model||typeof model.version!=='string'||!model.version||typeof model.checkpoint!=='string'||!model.definition||typeof model.toXYZ!=='function'||typeof model.fromXYZ!=='function')
  throw new TypeError('A versioned model, checkpoint and loaded definition are required');
 if(model.definition.ring_logits!==null)
  throw new RangeError('This codec requires the fixed release hue ring');
 const entries=releaseEntries(model),source=model.model.source;
 const boundary=model.cone;
 if(!boundary||!model.carrier)throw new TypeError('Model needs its physical boundary and carrier');
 const [definitionSHA256,boundarySHA256,hueRingSHA256,carrierSHA256,sourceSHA256]=await Promise.all([
  sha256(model.definition),
  sha256({white:boundary.white,vertices:boundary.vertices,normals:boundary.normals}),
  sha256(entries.map(({index,H,rgb8})=>({index,H,rgb8}))),
  sha256({t:model.carrier.t,theta:model.carrier.theta,landmarks:model.carrier.landmarks}),
  sha256({atlas:source.record,field:source.field.record,ring:source.base.ring.labels})
 ]);
 const context=Object.freeze({codecVersion:SHORT_CODE_VERSION,modelVersion:model.version,checkpoint:model.checkpoint,gamut:scale.gamut,
  referenceWhiteNits:model.referenceWhiteNits,boundaryID:model.boundaryID??null,
  definitionSHA256,boundarySHA256,hueRingSHA256,carrierSHA256,sourceSHA256});
 const contextJSON=stableJSON(context),hues=scale.gamut==='srgb'?nativeHueMap(entries):fullHueMap(model);
 const width=scale.fieldWidth,max=scale.integerMax;
 function encode(q,{degreeAlias=false}={}){
  valid(q);
  if(typeof degreeAlias!=='boolean')throw new TypeError('degreeAlias must be boolean');
  if(degreeAlias&&scale.gamut!=='srgb')throw new RangeError('Degree aliases are assigned only for native sRGB');
  const index=degreeAlias?6120+wrap(Math.round(wrap(q.H))):hues.encode(q.H);
  const hue=scale.gamut==='srgb'?nativeText(index):letters(index,width);
  return hue+letters(Math.round(q.R*max),width)+letters(Math.round(q.L*max),width);
 }
 function decode(code){
  const syntax=scale.gamut==='srgb'?/^[0-9A-Z]{2}[0-4][A-Z]{6}$/:/^[A-Z]{12}$/;
  if(typeof code!=='string'||!syntax.test(code))throw new TypeError(`Invalid ${scale.gamut} short-code syntax (${scale.pattern})`);
  const index=scale.gamut==='srgb'?nativeNumber(code.slice(0,width)):number(code.slice(0,width));
  const R=number(code.slice(width,2*width))/max,L=number(code.slice(2*width))/max;
  if(R>L)throw new RangeError('Code violates the triangle: Reach R exceeds Level L');
  return {H:hues.decode(index),R,L};
 }
 function toCanonical(q){valid(q);return {H:wrap(q.H),R:q.R*scale.maximum,L:q.L*scale.maximum};}
 function fromCanonical(q){valid(q,scale.maximum);return {H:wrap(q.H),R:q.R/scale.maximum,L:q.L/scale.maximum};}
 function quantize(q,options){
  const code=encode(q,options),coordinates=decode(code),canonical=toCanonical(coordinates);
  // Exact centi-unit presentation; normalized arithmetic still uses the integers.
  canonical.R=Math.round(canonical.R*100)/100;canonical.L=Math.round(canonical.L*100)/100;
  return {code,coordinates,canonical,error:{hueDegrees:hueDifference(coordinates.H,q.H),reachNormalized:coordinates.R-q.R,levelNormalized:coordinates.L-q.L}};
 }
 function serialize(q,options){return {code:encode(q,options),context};}
 function deserialize(envelope){
  if(!envelope||!envelope.context||stableJSON(envelope.context)!==contextJSON)
   throw new RangeError('Short-code snapshot context does not match this codec');
  return decode(envelope.code);
 }
 return Object.freeze({scale,context,encode,decode,toCanonical,fromCanonical,quantize,serialize,deserialize});
}
