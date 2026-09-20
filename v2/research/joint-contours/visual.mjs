/** Direct physical render data; the full-domain display is sRGB-clipped. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {createHRLv2} from '../../index.mjs';import {createJointHRL} from './index.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';
import {XYZ_TO_SRGB,mul3,encodeSRGB} from '../../lib/srgb-triangles.mjs';
const name=process.argv[2]||'joint',P=new URL('./results/',import.meta.url),bytes=fs.readFileSync(new URL(name+'.json',P)),rec=JSON.parse(bytes);
const out={recordSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),name,hues:[0,60,120,180,240,300],width:121,height:141,display:'sRGB clipping for full; curves use original XYZ',sheets:[],paths:[]};
for(const gamut of ['srgb','full'])for(const id of ['beta1',name]){
 const m=id==='beta1'?await createHRLv2({gamut}):await createJointHRL({gamut,record:rec,checkpoint:name});
 for(const H of out.hues){const px=Buffer.alloc(out.width*out.height*4);let clipped=0,valid=0;
  for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){const R=x/(out.width-1),L=1-y/(out.height-1)+R/2;if(L<R||L>1)continue;const rgb=mul3(XYZ_TO_SRGB,m.toXYZ({H,R,L}));valid++;if(rgb.some(v=>v< -2e-9||v>1+2e-9))clipped++;px.set([...rgb.map(v=>Math.round(255*encodeSRGB(Math.max(0,Math.min(1,v))))),255],4*(y*out.width+x));}
  out.sheets.push({gamut,id,H,rgbaBase64:px.toString('base64'),clipped,valid});
 }
 const cases=[{H:300,L:.08,path:'level'},{H:150,L:.12,path:'level'},{H:172.5,L:.12,path:'level'},{H:288,R:.2,path:'reach'},{H:262.5,R:.05,path:'reach'},{H:172,R:.5,path:'reach'},{H:171.25,R:.35,path:'reach'}];
 for(const c of cases){const xyz=Array.from({length:513},(_,i)=>m.toXYZ(c.path==='level'?{H:c.H,L:c.L,R:c.L*.25*i/512}:{H:c.H,R:c.R,L:c.R+(1-c.R)*.25*i/512}));out.paths.push({gamut,id,...c,J:xyz.map(x=>genRuler(x)[0]),Y:xyz.map(x=>x[1]),Gen:xyz.map(genRuler)});}
 console.log('rendered',id,gamut);
}
fs.writeFileSync(new URL('visual-'+name+'.json',P),JSON.stringify(out)+'\n');
