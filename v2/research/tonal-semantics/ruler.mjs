/** Frozen HelmLab 1.0.0 GenSpace ruler. Never aliases MetricSpace or Oklab.
 * This is an external diagnostic, not a redefinition of public HRL Level.
 */
import {genFromXYZ,GEN_PARAMETERS,D65} from '../../../src/base/appearance-runtime.mjs';
export const RULER=Object.freeze({id:'helmlab-1.0.0-genspace',neutralCorrection:false,
  input:'D65 relative XYZ, Ywhite=1',role:'diagnostic only; no re-fitted coefficients',
  source:'src/base/appearance-runtime.mjs + src/base/gen-parameters.mjs'});
export function inspectGenDomain(xyz) {
  if (!xyz || xyz.length!==3 || !Array.from(xyz).every(Number.isFinite))throw new TypeError('Finite XYZ triplet required.');
  const responses=GEN_PARAMETERS.M1.map(r=>r.reduce((s,v,i)=>s+v*xyz[i],0));
  return {valid:responses.every(v=>v>=-1e-12),responses};
}
export function genRuler(xyz) {
  const domain=inspectGenDomain(xyz);
  if (!domain.valid)throw new RangeError('XYZ requires negative-response clipping in the pinned GenSpace; diagnostic unavailable.');
  return genFromXYZ(xyz);
}
export const GEN_WHITE=Object.freeze(genRuler(D65));
/** Require full path support. No silently dropping bad interior samples. */
export function pathStats(points) {
  const vals=points.map(genRuler),d=vals.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-vals[i][j])));
  const ds=d.slice(2,-2),mean=ds.reduce((s,v)=>s+v,0)/ds.length;
  if (!(mean>1e-15))return {constant:true,cv:0,meanStepJump:0,maxStepJump:0,totalArc:0,negativeLightnessSteps:0};
  const jumps=ds.slice(1).map((v,i)=>Math.abs(v-ds[i])/Math.max(1e-15,(v+ds[i])/2));
  return {constant:false,cv:Math.sqrt(ds.reduce((s,v)=>s+(v-mean)**2,0)/ds.length)/mean,
    meanStepJump:jumps.reduce((s,v)=>s+v,0)/jumps.length,maxStepJump:Math.max(...jumps),
    totalArc:d.reduce((s,v)=>s+v,0),
    startLightness:vals[0][0],endLightness:vals.at(-1)[0],
    retreatFromStartSteps:vals.slice(1).filter((v,i)=>Math.hypot(...v.map((x,j)=>x-vals[0][j])) < Math.hypot(...vals[i].map((x,j)=>x-vals[0][j]))-1e-8).length,
    retreatFromEndSteps:vals.slice(1).filter((v,i)=>Math.hypot(...v.map((x,j)=>x-vals.at(-1)[j])) > Math.hypot(...vals[i].map((x,j)=>x-vals.at(-1)[j]))+1e-8).length,
    negativeLightnessSteps:vals.slice(1).filter((v,i)=>v[0]<vals[i][0]-1e-8).length};
}
