/** Actual shared-map central differences; no XYZ or perceptual derivative. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sharedCoordinates} from '../shared-rl/core.mjs';

const request = JSON.parse(fs.readFileSync(0, 'utf8'));
const results = {};
const legal = q => [q.H,q.R,q.L].every(Number.isFinite) && q.R>0 && q.R<q.L && q.L<1;
for (const {name, record} of request.records) {
  results[name] = request.points.map(point => {
    const [H,R,L] = point.q, q = {H,R,L};
    assert(legal(q));
    const value = sharedCoordinates(q,record);
    const numerical = request.factors.map(factor => {
      assert(factor>0 && factor<1);
      const h = factor*Math.min(R,L-R,1-L);
      const stencil = [{H,R:R-h,L},{H,R:R+h,L},{H,R,L:L-h},{H,R,L:L+h}];
      assert(stencil.every(legal));
      assert(stencil[0].R<R && stencil[1].R>R && stencil[2].L<L && stencil[3].L>L);
      const [a,b,c,d] = stencil.map(x=>sharedCoordinates(x,record));
      const J = [[(b.R-a.R)/(2*h),(d.R-c.R)/(2*h)],[(b.L-a.L)/(2*h),(d.L-c.L)/(2*h)]];
      assert(J.flat().every(Number.isFinite));
      return {factor,h,J};
    });
    return {id:point.id,q:point.q,value:[value.H,value.R,value.L],numerical};
  });
}
process.stdout.write(JSON.stringify({nodeVersion:process.version,results}));
