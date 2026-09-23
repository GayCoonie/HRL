/** HRL whole-sheet defect map: actual inverse XYZ, before display clipping.
 * Reproducible diagnostic grids; this is not observer validation or a fit.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHRLv2} from '../../index.mjs';
import {createJointHRL} from '../joint-contours/index.mjs';
import {genRuler,pathStats} from '../tonal-semantics/ruler.mjs';

const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const quant=(a,p)=>{const sorted=a.slice().sort((x,y)=>x-y);return sorted[Math.floor((sorted.length-1)*p)];};
const turn=a=>Math.max(0,(a.slice(1).reduce((s,x,i)=>s+Math.abs(x-a[i]),0)-Math.abs(a.at(-1)-a[0]))/2);
const norm=x=>Math.hypot(...x);
const toXYZ=(model,q)=>{const xyz=model.toXYZ(q);if(xyz.length!==3||!xyz.every(Number.isFinite))throw Error(`Nonfinite XYZ at ${JSON.stringify(q)}`);return xyz;};

export const GRID=Object.freeze({version:'hrl-fresh-field-direct-audit-v1',regular:{count:72,start:2.5,step:5},shifted:{count:72,start:1.25,step:5},critical:[120,171.25,177.5,182.5,187.5,192.5,232.5,237.5,263,269,273,275,277,281,285,288,293,300,307.5,330],
  fixedLevels:[.005,.02,.08,.2,.4,.8],fixedReaches:[.005,.02,.05,.2,.35,.65],whiteFans:[.15,.45,.8],blackFans:[.15,.45,.8],pathSamples:65,nearGraySamples:129,areaLevels:11,areaU:11,areaThresholds:[.1,.2],gradientScales:[1/32,1/64]});

/** Sample named *public* HRL coordinate paths. fixedReach never fixes U=R/L. */
export function tracePath(model,{kind,H,fixed=0,count=65}){
  if(!Number.isFinite(H)||!Number.isInteger(count)||count<5||!Number.isFinite(fixed)||fixed<0||fixed>1)throw RangeError('Invalid path sampling');
  const result=[];for(let i=0;i<count;i++){const t=i/(count-1);let q;
    switch(kind){
      case 'fixedReach':q={H,R:fixed,L:fixed+(1-fixed)*t};break;
      case 'fixedLevel':q={H,R:fixed*t,L:fixed};break;
      case 'nearGray':q={H,R:fixed*.25*t,L:fixed};break;
      case 'whiteEdge':q={H,R:1-t,L:1};break;
      case 'blackVividEdge':q={H,R:t,L:t};break;
      case 'grayEdge':q={H,R:0,L:t};break;
      case 'whiteFan':q={H,R:fixed*(1-t),L:fixed+(1-fixed)*t};break;
      case 'blackFan':q={H,R:fixed*t,L:t};break;
      default:throw RangeError('Unknown path '+kind);
    }
    const xyz=toXYZ(model,q);result.push({q,xyz,gen:genRuler(xyz)});
  }return result;
}

export function summarizePath(rows){
  const stat=pathStats(rows.map(r=>r.xyz)),J=rows.map(r=>r.gen[0]),Y=rows.map(r=>r.xyz[1]);
  const jDrops=J.slice(1).map((v,i)=>Math.max(0,J[i]-v)),yDrops=Y.slice(1).map((v,i)=>Math.max(0,Y[i]-v));
  const steps=rows.slice(1).map((r,i)=>norm(r.gen.map((v,j)=>v-rows[i].gen[j])));
  const gradients=steps.slice(1).map((v,i)=>Math.abs(v-steps[i])/Math.max(1e-15,(v+steps[i])/2));
  return {stepCV:stat.cv,totalArc:stat.totalArc,meanRelativeStepJump:mean(gradients),p95RelativeStepJump:quant(gradients,.95),maxRelativeStepJump:Math.max(...gradients),
    JTurn:turn(J),negativeJSteps:jDrops.filter(v=>v>1e-8).length,totalJRetreat:jDrops.reduce((a,b)=>a+b,0),worstJDrop:Math.max(...jDrops),
    negativeYSteps:yDrops.filter(v=>v>1e-8).length,totalYRetreat:yDrops.reduce((a,b)=>a+b,0),worstYDrop:Math.max(...yDrops),
    maxJDropAt:jDrops.indexOf(Math.max(...jDrops))/(rows.length-1),startXYZ:rows[0].xyz,endXYZ:rows.at(-1).xyz};
}

function weightedQuantile(rows,p){const v=rows.slice().sort((a,b)=>a.x-b.x),target=p*v.reduce((s,r)=>s+r.w,0);let acc=0;for(const r of v){acc+=r.w;if(acc>=target)return r.x;}return v.at(-1).x;}

/** Relative opponent-chroma coverage at fixed public Level and local vivid edge.
 * The (L,U) area Jacobian is L, so each midpoint row carries weight L.
 */
export function areaNeutrality(model,H,{levelSamples=GRID.areaLevels,uSamples=GRID.areaU,thresholds=GRID.areaThresholds}={}){
  if(levelSamples<2||uSamples<2||!thresholds.every(x=>x>0&&x<1))throw RangeError('Invalid area grid');
  const counts=Object.fromEntries(thresholds.map(t=>[String(t),0])),rows=[],thresholdCross=[];let total=0;
  for(let i=0;i<levelSamples;i++){const L=(i+.5)/levelSamples,gray=genRuler(toXYZ(model,{H,R:0,L})),vivid=genRuler(toXYZ(model,{H,R:L,L}));
    const denom=Math.hypot(vivid[1]-gray[1],vivid[2]-gray[2]);if(!(denom>1e-12))throw Error('Undefined local chromatic gamut at '+JSON.stringify({H,L}));
    let crossing=1;const t=.2;for(let k=0;k<=uSamples;k++){const u=k/uSamples,x=genRuler(toXYZ(model,{H,R:L*u,L})),fraction=Math.hypot(x[1]-gray[1],x[2]-gray[2])/denom;
      if(fraction>=t){crossing=u;break;}}
    thresholdCross.push({x:crossing,w:L});
    for(let k=0;k<uSamples;k++){const U=(k+.5)/uSamples,x=genRuler(toXYZ(model,{H,R:L*U,L})),fraction=Math.hypot(x[1]-gray[1],x[2]-gray[2])/denom;
      for(const t of thresholds)if(fraction<t)counts[String(t)]+=L;
      rows.push({x:fraction,w:L});total+=L;
    }
  }
  return {method:'GenSpace-opponent-chroma-relative-to-same-Level-gray-and-R=L-edge',weights:'equilateral-area-L',valid:levelSamples*uSamples,grid:{levelSamples,uSamples,midpoints:true},
    fractions:Object.fromEntries(thresholds.map(t=>[String(t),counts[String(t)]/total])),relativeChroma:{p10:weightedQuantile(rows,.1),p50:weightedQuantile(rows,.5),p90:weightedQuantile(rows,.9)},
    uAt20PercentChroma:{p10:weightedQuantile(thresholdCross,.1),p50:weightedQuantile(thresholdCross,.5),p90:weightedQuantile(thresholdCross,.9)}};
}

/** Equilateral 2D stencil: normalized Hessian energy across multiple scales. */
export function gradientSheet(model,H,{scales=GRID.gradientScales,mesh=12}={}){
  const centres=[];for(let j=2;j<mesh;j+=2)for(let i=2;i<j-1;i+=2)centres.push({R:i/mesh,L:j/mesh});
  for(const L of [.02,.08,.2])for(const U of [.15,.4,.7])centres.push({R:L*U,L});
  const out={method:'nine-point-GenSpace-Hessian-over-equilateral-gradient',centres:centres.length,scales:{}};
  for(const scale of scales){const values=[];let minGradient=Infinity;for(const {R,L} of centres){const h=Math.min(scale/2,R/2,(L-R)/3,(1-L)/2);if(!(h>0))continue;
    const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],v=offsets.map(([a,b])=>genRuler(toXYZ(model,{H,R:R+a*h,L:L+b*h})));
    let gradient=0,hessian=0;for(let c=0;c<3;c++){const dr=(v[1][c]-v[2][c])/(2*h),dl=(v[3][c]-v[4][c])/(2*h),rr=(v[1][c]+v[2][c]-2*v[0][c])/h**2,ll=(v[3][c]+v[4][c]-2*v[0][c])/h**2,rl=(v[5][c]-v[6][c]-v[7][c]+v[8][c])/(4*h*h);
      const gx=(2*dr+dl)/Math.sqrt(3),xx=(4*rr+4*rl+ll)/3,xz=(2*rl+ll)/Math.sqrt(3);gradient+=gx*gx+dl*dl;hessian+=xx*xx+2*xz*xz+ll*ll;}
    minGradient=Math.min(minGradient,gradient);values.push(scale*scale*hessian/Math.max(gradient,1e-8));
  }
  out.scales[String(scale)]={samples:values.length,mean:mean(values),p95:quant(values,.95),p99:quant(values,.99),max:Math.max(...values),minGradient};
  }return out;
}

function hueGrid(mode){const n=mode==='dense'?72:24,step=360/n,regular=Array.from({length:n},(_,i)=>2.5+i*step),shifted=Array.from({length:n},(_,i)=>1.25+i*step);
  const unique=[...new Set([...regular,...shifted,...GRID.critical])].sort((a,b)=>a-b);return{regular,shifted,critical:GRID.critical,all:unique};}
function auditHue(model,H,{count,detail=false,gradient=false}={}){
  const paths={edges:{},fixedLevel:[],nearGray:[],fixedReach:[],whiteFan:[],blackFan:[]};
  for(const kind of ['whiteEdge','blackVividEdge','grayEdge'])paths.edges[kind]=summarizePath(tracePath(model,{kind,H,count}));
  for(const fixed of GRID.fixedLevels){paths.fixedLevel.push({fixed,...summarizePath(tracePath(model,{kind:'fixedLevel',H,fixed,count}))});
    paths.nearGray.push({fixed,...summarizePath(tracePath(model,{kind:'nearGray',H,fixed,count:Math.max(count,GRID.nearGraySamples)}))});}
  for(const fixed of GRID.fixedReaches)paths.fixedReach.push({fixed,...summarizePath(tracePath(model,{kind:'fixedReach',H,fixed,count}))});
  for(const fixed of GRID.whiteFans)paths.whiteFan.push({fixed,...summarizePath(tracePath(model,{kind:'whiteFan',H,fixed,count}))});
  for(const fixed of GRID.blackFans)paths.blackFan.push({fixed,...summarizePath(tracePath(model,{kind:'blackFan',H,fixed,count}))});
  return{H,paths,area:detail?areaNeutrality(model,H):null,gradient:gradient?gradientSheet(model,H):null};
}
function summarizeRows(rows){const ranked=(get,n=8)=>rows.slice().sort((a,b)=>get(b)-get(a)).slice(0,n).map(r=>({H:r.H,value:get(r)}));
  return{hues:rows.length,meanWhiteEdgeCV:mean(rows.map(r=>r.paths.edges.whiteEdge.stepCV)),meanBlackVividEdgeCV:mean(rows.map(r=>r.paths.edges.blackVividEdge.stepCV)),
    worstWhiteEdges:ranked(r=>r.paths.edges.whiteEdge.stepCV),worstBlackVividEdges:ranked(r=>r.paths.edges.blackVividEdge.stepCV),
    worstNearGrayTurn:ranked(r=>Math.max(...r.paths.nearGray.map(p=>p.JTurn))),worstFixedReachJDrop:ranked(r=>Math.max(...r.paths.fixedReach.map(p=>p.worstJDrop))),
    worstFixedReachIntegratedRetreat:ranked(r=>Math.max(...r.paths.fixedReach.map(p=>p.totalJRetreat))),
    worstP95Gradient:ranked(r=>r.gradient?.scales[String(GRID.gradientScales[0])]?.p95??0)};
}
/** Choose one union of probe offsets, then rerun every model at those angles. */
export function chooseAdaptiveAngles(modelRows,existing,perMetric=2){
  const all=modelRows.flatMap(({label,rows})=>rows.map(r=>({label,...r}))),by=(key)=>all.slice().sort((a,b)=>b[key]-a[key]).slice(0,perMetric);
  const trigger=[...by('whiteEdgeCV'),...by('fixedReachRetreat')];
  const angles=[...new Set(trigger.flatMap(r=>[r.H-.625,r.H+.625].map(x=>Math.round((((x%360)+360)%360)*1000)/1000)))].filter(H=>!existing.includes(H)).sort((a,b)=>a-b);
  return{angles,trigger:trigger.map(({label,H,whiteEdgeCV,fixedReachRetreat})=>({label,H,whiteEdgeCV,fixedReachRetreat}))};
}
function opts(args){const options={mode:'quick',gamut:'srgb'};for(let i=0;i<args.length;i++){
    const a=args[i];if(!['--out','--mode','--gamut','--candidate-record','--candidate-module','--candidate-export','--candidate-label'].includes(a))throw Error('Unknown argument '+a);options[a.slice(2).replaceAll('-', '_')]=args[++i];
  }if(!options.out||!path.isAbsolute(options.out))throw Error('--out must be an absolute JSON path');if(fs.existsSync(options.out))throw Error('Refusing to overwrite '+options.out);
  if(!['quick','dense'].includes(options.mode)||!['srgb','full','both'].includes(options.gamut))throw Error('Invalid --mode or --gamut');
  if(options.candidate_label&&!/^[a-z0-9-]+$/.test(options.candidate_label))throw Error('Candidate label must contain lowercase letters, digits, and hyphens');
  if(options.candidate_record&&!options.candidate_module)options.candidate_module='./index.mjs';return options;
}
async function candidate(options,gamut){if(!options.candidate_module)return null;
  const moduleURL=options.candidate_module.startsWith('.')?new URL(options.candidate_module,import.meta.url):pathToFileURL(path.resolve(options.candidate_module));
  const imported=await import(moduleURL.href),fn=imported[options.candidate_export??'createFreshFieldHRL'];if(typeof fn!=='function')throw Error('Missing candidate factory in '+moduleURL);
  const record=options.candidate_record?JSON.parse(fs.readFileSync(options.candidate_record,'utf8')):null;
  const modelURL=new URL('./model.mjs',moduleURL),modelCodeSHA256=moduleURL.protocol==='file:'&&fs.existsSync(modelURL)?sha(fs.readFileSync(modelURL)):null;
  return{label:options.candidate_label??'fresh-field',model:await fn({gamut,record}),recordSHA256:options.candidate_record?sha(fs.readFileSync(options.candidate_record)):null,
    factorySHA256:moduleURL.protocol==='file:'?sha(fs.readFileSync(moduleURL)):null,modelCodeSHA256};
}
export async function runAudit(options){const h=hueGrid(options.mode),gamutList=options.gamut==='both'?['srgb','full']:[options.gamut],sourceFiles={
    audit:'./audit.mjs',ruler:'../tonal-semantics/ruler.mjs',beta1:'../../index.mjs',joint:'../joint-contours/index.mjs',appearance:'../../../src/base/appearance-runtime.mjs'},
  sourceSHA256=Object.fromEntries(Object.entries(sourceFiles).map(([name,relative])=>[name,sha(fs.readFileSync(new URL(relative,import.meta.url)))]));
  let sourceCommit=null;try{sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:fileURLToPath(new URL('../../../',import.meta.url)),encoding:'utf8'}).trim();}catch{}
  const receipt={schema:GRID.version,createdUTC:new Date().toISOString(),sourceCommit,sourceSHA256,
    grid:{...GRID,regular:{count:h.regular.length,start:2.5,step:360/h.regular.length},shifted:{count:h.shifted.length,start:1.25,step:360/h.shifted.length},mode:options.mode,regularHues:h.regular,shiftedHues:h.shifted,criticalHues:h.critical,allHues:h.all,route:'actual runtime toXYZ -> pinned GenSpace, no display clipping'},
    limits:['GenSpace smoothness and hue-sheet colors are diagnostic proxies, not perceptual preference votes.','COMBVD is evaluated separately and is not predicted by this report.','Shifted/adaptive hue grids and finite stencils do not establish a continuous-domain guarantee.','Full-domain colors are not faithfully displayed on an sRGB screen.'],models:{}};
  const critical=new Set(h.critical),gradientHues=new Set([...h.critical,...h.regular.filter((_,i)=>i%4===0)]);
  for(const gamut of gamutList){const models=[{label:'beta1',model:await createHRLv2({gamut})},{label:'joint',model:await createJointHRL({gamut})}];const fresh=await candidate(options,gamut);if(fresh)models.push(fresh);
    const base=[];for(const item of models){const rows=[];for(const H of h.all){const detail=critical.has(H)||h.regular.includes(H),gradient=gradientHues.has(H),row=auditHue(item.model,H,{count:GRID.pathSamples,detail,gradient});rows.push(row);}
      base.push({...item,rows});console.log(item.label,gamut,'base hues',rows.length);
    }
    const adaptive=chooseAdaptiveAngles(base.map(x=>({label:x.label,rows:x.rows.filter(r=>h.regular.includes(r.H)).map(r=>({H:r.H,whiteEdgeCV:r.paths.edges.whiteEdge.stepCV,fixedReachRetreat:Math.max(...r.paths.fixedReach.map(p=>p.totalJRetreat))}))})),h.all);
    receipt.grid[`adaptiveHues_${gamut}`]=adaptive.angles;
    for(const {label,model,recordSHA256,factorySHA256,modelCodeSHA256,rows} of base){const regularRows=rows.filter(r=>h.regular.includes(r.H)),shiftedRows=rows.filter(r=>h.shifted.includes(r.H));
      const adaptiveRows=adaptive.angles.map(H=>auditHue(model,H,{count:GRID.pathSamples,detail:false,gradient:false}));
      receipt.models[`${label}-${gamut}`]={recordSHA256:recordSHA256??(label==='joint'?sha(fs.readFileSync(new URL('../joint-contours/results/joint.json',import.meta.url))):label==='beta1'?sha(fs.readFileSync(new URL('../boundary-tonal/results/metric.json',import.meta.url))):null),factorySHA256,modelCodeSHA256,
        regular:summarizeRows(regularRows),shifted:summarizeRows(shiftedRows),adaptive:{trigger:adaptive.trigger,...summarizeRows(adaptiveRows)},
        rows:[...rows,...adaptiveRows]};
      console.log(label,gamut,JSON.stringify({regular:receipt.models[`${label}-${gamut}`].regular,shiftedHues:shiftedRows.length,adaptiveHues:adaptiveRows.length}));
    }
  }
  return receipt;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  try{const options=opts(process.argv.slice(2)),out=await runAudit(options);fs.writeFileSync(options.out,JSON.stringify(out,null,2)+'\n');console.log('Wrote',options.out);}
  catch(error){console.error(error.stack||error.message);process.exitCode=1;}
}
