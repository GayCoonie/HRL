/** Direct-runtime native hue-sheet panels. Data uses XYZ; clipping is display only. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHRLv2} from '../../index.mjs';
import {createJointHRL} from '../joint-contours/index.mjs';
import {createHRL as createRelease1} from '../../../src/index.mjs';
import {XYZ_TO_SRGB,mul3,encodeSRGB} from '../../lib/srgb-triangles.mjs';
import {genRuler} from '../tonal-semantics/ruler.mjs';

const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x));
export function renderSheet(model,H,{width=121,height=141}={}){
  if(!Number.isFinite(H)||!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3||height%2!==1)throw RangeError('Require finite H, width>=3 and odd height>=3');
  const pixels=Buffer.alloc(width*height*4);let valid=0,clipped=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const R=x/(width-1),L=1-y/(height-1)+R/2;if(L<R-1e-12||L>1+1e-12)continue;
    const xyz=model.toXYZ({H,R,L:Math.max(R,clamp(L))}),linear=mul3(XYZ_TO_SRGB,xyz);
    if(!xyz.every(Number.isFinite)||!linear.every(Number.isFinite))throw Error('Nonfinite pixel at '+JSON.stringify({H,R,L}));
    if(linear.some(v=>v< -2e-9||v>1+2e-9))clipped++;
    const i=4*(y*width+x);for(let k=0;k<3;k++)pixels[i+k]=Math.round(255*encodeSRGB(clamp(linear[k])));pixels[i+3]=255;valid++;
  }return{pixels,width,height,valid,clipped};
}

let crcTable;function crc(data){if(!crcTable)crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type,payload){const t=Buffer.from(type),body=Buffer.concat([t,payload]),out=Buffer.alloc(body.length+8);out.writeUInt32BE(payload.length,0);body.copy(out,4);out.writeUInt32BE(crc(body),body.length+4);return out;}
export function encodePNG({pixels,width,height}){const raw=Buffer.alloc(height*(1+4*width));for(let y=0;y<height;y++)pixels.copy(raw,y*(1+4*width)+1,y*4*width,(y+1)*4*width);
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
/** Release 1 has different vivid endpoints; match appearance approximately. */
export function matchReleaseHue(release,targetXYZ){const q=release.fromXYZ(targetXYZ),matched=release.toXYZ({H:q.H,R:1,L:1});
  return{H:q.H,importedR:q.R,importedL:q.L,GenSpaceVividDelta:distance(genRuler(matched),genRuler(targetXYZ))};
}

function parse(args){const opt={gamut:'srgb',hues:[120,182.5,237.5,273,300,330],width:121,height:141,release1:false,compare:[]};for(let i=0;i<args.length;i++){
    if(args[i]==='--release1'){opt.release1=true;continue;}const a=args[i];if(!['--out','--gamut','--hues','--width','--height','--candidate-record','--candidate-module','--candidate-export','--candidate-label','--compare-record'].includes(a))throw Error('Unknown option '+a);
    const value=args[++i];if(a==='--hues')opt.hues=value.split(',').map(Number);else if(['--width','--height'].includes(a))opt[a.slice(2)]=+value;else opt[a.slice(2).replaceAll('-','_')]=value;
    if(a==='--compare-record'){const at=value.indexOf('=');if(at<=0||!path.isAbsolute(value.slice(at+1)))throw Error('Use --compare-record label=/absolute/record.json');opt.compare.push({label:value.slice(0,at),file:value.slice(at+1)});}
  }if(!opt.out||!path.isAbsolute(opt.out)||fs.existsSync(opt.out))throw Error('--out must be a new absolute directory');
  if(!['srgb','full'].includes(opt.gamut)||opt.release1&&opt.gamut!=='srgb')throw Error('Release 1 comparison is native sRGB only');
  if(!opt.hues.length||opt.hues.length>36||!opt.hues.every(x=>Number.isFinite(x)&&x>=0&&x<360))throw Error('Invalid hues');
  return opt;
}
async function fresh(opt){if(!opt.candidate_module&&!opt.candidate_record&&!opt.compare.length)return[];
  const u=opt.candidate_module?(opt.candidate_module.startsWith('.')?new URL(opt.candidate_module,import.meta.url):pathToFileURL(path.resolve(opt.candidate_module))):new URL('./index.mjs',import.meta.url);
  const mod=await import(u.href),factory=mod[opt.candidate_export??'createFreshFieldHRL'];if(typeof factory!=='function')throw Error('Missing candidate factory '+u);
  const entries=[...(opt.candidate_record?[{label:opt.candidate_label??'Fresh field',file:opt.candidate_record}]:[]),...opt.compare];
  return Promise.all(entries.map(async({label,file})=>{const raw=fs.readFileSync(file),record=JSON.parse(raw);return{label,model:await factory({gamut:opt.gamut,record}),recordSHA256:sha(raw)};}));
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export async function writePanels(opt){const models=[{label:'Beta 1',model:await createHRLv2({gamut:opt.gamut})},{label:'Frozen joint',model:await createJointHRL({gamut:opt.gamut})}];
  models.push(...await fresh(opt));let release;if(opt.release1)release=await createRelease1({gamut:'srgb'});
  fs.mkdirSync(opt.out,{recursive:false});const meta={schema:'hrl-fresh-field-visual-panels-v1',createdUTC:new Date().toISOString(),gamut:opt.gamut,width:opt.width,height:opt.height,hues:opt.hues,display:'actual XYZ converted to sRGB; panel pixel clipping is display-only',panels:[]};
  for(const H of opt.hues){const rows=[...models.map(x=>({...x,H}))];if(release){const matched=matchReleaseHue(release,models[0].model.vivid(H));rows.push({label:'Release 1 (matched vivid)',model:release,H:matched.H,anchorCorrespondence:matched});}
    for(const row of rows){const out=renderSheet(row.model,row.H,{width:opt.width,height:opt.height}),png=encodePNG(out),name=`h${String(H).replace('.','p')}-${row.label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`;
      fs.writeFileSync(path.join(opt.out,name),png);meta.panels.push({requestedH:H,label:row.label,renderedH:row.H,file:name,sha256:sha(png),recordSHA256:row.recordSHA256??null,validPixels:out.valid,displayClippedPixels:out.clipped,anchorCorrespondence:row.anchorCorrespondence??null});
      console.log(row.label,'H',row.H,'from',H,'clipped',out.clipped,'/',out.valid);
    }
  }
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HRL native hue sheets</title><style>body{font:16px system-ui;background:#211a29;color:#f2e9fb;margin:2rem}a{color:#91e9cc}section{margin:2rem 0}h2{border-bottom:1px solid #674b71;padding-bottom:.5rem}.grid{display:flex;flex-wrap:wrap;gap:1rem}figure{margin:0;padding:.75rem;border:1px solid #674b71;border-radius:.5rem;background:#30273a}img{display:block;width:240px;image-rendering:auto;background:repeating-conic-gradient(#ddd 0% 25%,#999 0% 50%) 50%/18px 18px}figcaption{max-width:240px;margin-top:.5rem}small{color:#b9a8c6}p{max-width:80ch}</style></head><body><h1>HRL ${esc(opt.gamut)} direct runtime sheets</h1><p>Vivid upper right, white upper left, black lower left. Every panel samples the same public hue, Reach and Level coordinates, and calls that model’s toXYZ. Display conversion is sRGB; clipped-pixel counts appear below each image. Full-gamut clipped pixels do not reveal the original color differences. Release 1, when included, imports Beta 1’s vivid XYZ by fromXYZ, uses the imported hue at its own vivid edge, and reports the remaining anchor difference. <a href="methods.html">Read audit methods and limits</a>. Quantitative diagnostics use original XYZ before display clipping.</p>${opt.hues.map(H=>`<section><h2>Requested H ${H}°</h2><div class="grid">${meta.panels.filter(p=>p.requestedH===H).map(p=>`<figure><img src="${esc(p.file)}" alt="${esc(p.label)} triangle at H ${p.renderedH}"><figcaption>${esc(p.label)} · H ${p.renderedH}°<br><small>Display-clipped ${p.displayClippedPixels}/${p.validPixels}${p.anchorCorrespondence?` · matched vivid ΔGen ${p.anchorCorrespondence.GenSpaceVividDelta.toFixed(5)}`:''}</small></figcaption></figure>`).join('')}</div></section>`).join('')}</body></html>`;
  const methods=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HRL hue sheet audit methods</title><style>body{font:16px/1.55 system-ui;background:#211a29;color:#f2e9fb;max-width:85ch;margin:2rem auto;padding:0 1rem}a{color:#91e9cc}code{color:#fcd88e}</style></head><body><h1>Direct runtime hue sheet audit</h1><p><a href="index.html">View panels</a> · <a href="manifest.json">Panel manifest and SHA-256 hashes</a></p><h2>Same public triangle</h2><p>All models receive the same public H, Reach R and Level L, with 0 ≤ R ≤ L ≤ 1. Panel pixels sample R from left to right and L = 1 − y/(height − 1) + R/2, discarding points outside the triangle. The top left is white, lower left black, rightmost tip vivid. Each pixel comes from the model’s own toXYZ call. For display only, XYZ becomes sRGB, then channels outside [0, 1] are clamped. A display-clipped pixel has at least one out-of-range linear sRGB channel before clamping. Thus full-gamut panels are visual aids and cannot establish full-domain smoothness.</p><h2>Defect-map measurements</h2><p><code>audit.mjs</code> evaluates actual model XYZ through the frozen HelmLab 1.0.0 GenSpace ruler before any sRGB display conversion. The versioned quick grid has 24 hues at H = 2.5 + 15k, 24 shifted hues at 1.25 + 15k, plus 20 explicit critical hues; dense mode uses 72 of each regular/shifted grid. After sampling the regular grid, a common adaptive grid adds ±0.625° around prominent white-edge variation and fixed-Reach retreat found in any model. Because adaptive hues depend on the candidates, compare adaptive rows only inside the same JSON receipt. The regular, shifted and critical grids stay fixed across receipts.</p><p>At each hue, 65 points trace the white-to-vivid, black-to-vivid, neutral gray, six fixed public Levels, six fixed public Reaches, and three dilution fans from each end; 129 points trace each first-quarter near-gray Level path. A fixed-Reach path holds the original public R constant while L moves from R to 1. Path step coefficient of variation measures changes in 3D GenSpace distance; endpoint two steps are trimmed for this CV. Lightness J and physical luminance Y reversals are separately reported, including their largest negative step and total retreat.</p><p>The gray-area fraction samples 11 × 11 triangle midpoints and weights by L, the area Jacobian under R = L × U. Chroma is the GenSpace opponent-plane distance from the same-Level gray divided by the same-Level vivid-edge distance. The fraction below 0.1 or 0.2 means low relative chroma at sampled coordinates, not a universal threshold for human gray perception. A two-scale 9-point stencil measures local GenSpace gradient curvature on critical hues and every fourth regular hue; its summary covers those sampled hues only.</p><h2>Limits</h2><p>These checks are geometric and appearance-space diagnostics, not observer ratings or a substitute for the COMBVD benchmark. Finite hue grids and numerical stencils cannot prove continuous-domain monotonicity. The sRGB image of a full-gamut model may hide strong out-of-gamut differences; use the unclipped JSON report for full-domain claims. Release 1 uses an approximate matched vivid anchor imported from Beta 1 XYZ and its internal coordinates cannot be interpreted as the same public HRL parameterization. A visually smooth sheet alone is not evidence of benchmark improvement.</p></body></html>`;
  fs.writeFileSync(path.join(opt.out,'index.html'),html);fs.writeFileSync(path.join(opt.out,'methods.html'),methods);fs.writeFileSync(path.join(opt.out,'manifest.json'),JSON.stringify(meta,null,2)+'\n');return meta;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  try{const opt=parse(process.argv.slice(2));await writePanels(opt);console.log('Wrote panels',opt.out);}
  catch(error){console.error(error.stack||error.message);process.exitCode=1;}
}
