import {AppearanceReadout} from '../lib/research.mjs';
export class SourceAppearanceReadout extends AppearanceReadout {
 constructor(field,legacyBrightness,saturation,calibration){super(field,legacyBrightness,saturation);this.calibration=calibration;}
 evaluate(xyz,options={}){
  const r=super.evaluate(xyz,options);if(xyz[1]<=1e-20)return r;
  const {theta,rho}=this.field.coordinates(xyz),t=theta*Math.PI/180,c=this.calibration.coefficients;
  let v=c[0];for(let k=1;k<=this.calibration.harmonics;k++)v+=c[2*k-1]*Math.cos(k*t)+c[2*k]*Math.sin(k*t);
  const lift=Math.max(v,0)+Math.log1p(Math.exp(-Math.abs(v)));
  const y=xyz[1]*Math.exp(3*rho*lift),B=y<=216/24389?24389*y/2700:(29*Math.cbrt(y)-4)/25;
  return {brightness:B,saturation:r.saturation,chromaticContent:B*r.saturation/.25};
 }
}
