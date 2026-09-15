import {ringForward} from './observer-ring-retune.mjs';
import {nearestSheet} from '../base/core.mjs';

// Physical vivid RGB anchors retain their sheet identifiers; R8 changes their
// angular labels. The old calibration remains the source for earlier profiles.
export function observerRingCalibration(cal,parameters){
 const sheetToHue=cal.sheetToHue.map(H=>ringForward(H,parameters));
 const rotatedToSheet=sheetToHue.map((H,i)=>({H,i})).sort((a,b)=>a.H-b.H).map(p=>p.i);
 const result={...cal,sheetToHue,rotatedToSheet,profile:'observer8',sourceProfile:'accepted-ring'};
 result.degreeToSheet=Array.from({length:360},(_,H)=>nearestSheet(result,H));
 return result;
}
