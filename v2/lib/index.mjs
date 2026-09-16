/** Separate HRL v2 prototype entry point. Does not modify ../.. /src/index.mjs. */
import {HueField, ReleaseRing} from './hue-field.mjs';
import {SRGBTriangles, SRGB_TO_XYZ, mul3, decodeSRGB} from './srgb-triangles.mjs';
import {BASRModel} from './basr.mjs';
export {HueField, ReleaseRing, SRGBTriangles, BASRModel};
export {levelToNonblack,nonblackToLevel,toBaseCoordinates,fromBaseCoordinates,basrShares,BASR_NAME,BASR_VERSION} from './basr.mjs';

/** Rebuild the original 1,530 XYZ anchors losslessly from stored Release 1 H. */
export function expandReleaseAngles(record) {
  if (!record || !Array.isArray(record.H) || record.H.length!==1530 || record.H.some(x=>!Number.isFinite(x))) {
    throw new TypeError('Expected the checked 1,530-entry Release 1 angle record');
  }
  const entries=record.H.map((H,index)=>{
    const s=Math.floor(index/255),t=index%255;
    const rgb8=[[255,t,0],[255-t,255,0],[0,255,t],[0,255-t,255],[t,0,255],[255,0,255-t]][s];
    return {index,rgb8,H,xyz:mul3(SRGB_TO_XYZ,rgb8.map(x=>decodeSRGB(x/255)))};
  });
  const {H,inventory,original_record_sha256,...metadata}=record;
  return {...metadata,entries};
}
const v2Wrap=x=>((x%360)+360)%360;
function v2Interpolate(xs,ys,x) {
  let lo=0,hi=xs.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(xs[m]<=x)lo=m;else hi=m;}
  return ys[lo]+(ys[lo+1]-ys[lo])*(x-xs[lo])/(xs[lo+1]-xs[lo]);
}
/** The existing full-span pseudo-RGB triangle with the Release 1 angle attachment. */
export class FullTriangles {
  constructor(field,record) {
    this.field=field instanceof HueField?field:new HueField(field);
    this.ring=new ReleaseRing(this.field,record); this.gamut='full';this.variant='linear';
  }
  labelForHue(H) {if(!Number.isFinite(H))throw new TypeError('H must be finite');return this.ring.label(H);}
  hueForLabel(label) {const r=this.ring;return v2Wrap(v2Interpolate(r.labels,r.H,r.labels[0]+v2Wrap(label-r.labels[0])));}
  toXYZ(q) {return this.field.triangle(this.labelForHue(q.H),q.R,q.L);}
  sampleLabel(label,R,L) {return this.field.triangle(label,R,L);}
  fromXYZ(xyz,neutralHue=0) {
    if(!Number.isFinite(neutralHue))throw new TypeError('neutralHue must be finite');
    const q=this.field.xyzToPseudo(xyz),L=Math.max(...q),R=L-Math.min(...q),label=this.field.label(xyz);
    return {H:label===null?v2Wrap(neutralHue):this.hueForLabel(label),R,L,label};
  }
  toPseudoRGB(q) {return this.field.xyzToPseudo(this.toXYZ(q));}
  fromPseudoRGB(q,neutralHue=0) {return this.fromXYZ(this.field.pseudoToXYZ(q),neutralHue);}
  vivid(H) {return this.toXYZ({H,R:1,L:1});}
  fullVivid(H) {return this.vivid(H);}
  arms(H,t) {return {blackward:this.toXYZ({H,R:t,L:t}),whiteward:this.toXYZ({H,R:t,L:1}),neutral:this.toXYZ({H,R:0,L:t})};}
  sheet(H) {this.labelForHue(H);return(R,L)=>this.toXYZ({H,R,L});}
  embed(q) {return this.field.embed(q.H,q.R,q.L);}
  distance(a,b){const x=this.embed(a),y=this.embed(b);return Math.hypot(...x.map((v,i)=>v-y[i]));}
}
async function v2Read(name) {
  const url=new URL('../data/'+name,import.meta.url);
  if(url.protocol==='file:'){
    const {readFile}=await import('node:fs/promises');return JSON.parse(await readFile(url,'utf8'));
  }
  const response=await fetch(url);if(!response.ok)throw new Error(`Could not load ${url}: ${response.status}`);
  return response.json();
}
let v2Data;
export async function createHRLv2({gamut='srgb',variant='basr'}={}) {
  if(!['srgb','full'].includes(gamut))throw new RangeError('v2 gamut must be srgb or full');
  if(!['linear','basr'].includes(variant))throw new RangeError('v2 variant must be linear or basr');
  if(!v2Data)v2Data=Promise.all([v2Read('hue-field.json'),v2Read('release1-angles.json')]).catch(e=>{v2Data=null;throw e;});
  const [field,angles]=await v2Data,ring=expandReleaseAngles(angles);
  const base=gamut==='srgb'?new SRGBTriangles(field,ring):new FullTriangles(field,ring);
  base.gamut=gamut;base.variant='linear';
  return variant==='basr'?new BASRModel(base):base;
}
