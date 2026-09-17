/** Add navigation only. Never replace the v1 picker or existing v2 definitions. */
import fs from 'node:fs';
const root=new URL('../../',import.meta.url);
const notice='<!-- HRL A SMOOTH APPROVED -->\n## Approved v2 prototype: A Smooth\n\n[Open A Smooth](https://gaycoonie.github.io/HRL/v2/a-smooth.html) · [Source and reproducibility](v2/a-smooth/README.md). The approved original-ring R/L fit is the default on this new page. A parent remains selectable. Weighted COMBVD: **28.1724** (3,331 sRGB pairs), **28.9553** (3,813 full-domain pairs). Magenta is an acknowledged follow-up, unchanged here. The Release 1 picker and prior v2 pages remain available.\n\n';
for(const file of ['README.md','v2/README.md']){
 const url=new URL(file,root);let s=fs.readFileSync(url,'utf8');if(s.includes('<!-- HRL A SMOOTH APPROVED -->'))continue;
 const text=file==='README.md'?notice:notice.replace('](v2/a-smooth/README.md)','](a-smooth/README.md)');
 const pos=s.indexOf('\n');s=s.slice(0,pos+1)+'\n'+text+s.slice(pos+1);fs.writeFileSync(url,s);
}
const u=new URL('v2/index.html',root);let s=fs.readFileSync(u,'utf8');
if(!s.includes('<!-- HRL A SMOOTH APPROVED -->')){
 const card='<!-- HRL A SMOOTH APPROVED --><article class="card"><div class="label">APPROVED PROTOTYPE · A SMOOTH</div><h2>Original ring.<br>Smoother Reach &amp; Level.</h2><p>The selected OPAL 0.8 A R/L branch, with the existing hue field and vivid anchors intact. A parent is preserved for comparison. Magenta refinement remains a future task.</p><a class="button" href="a-smooth.html">Open A Smooth</a><p><a href="a-smooth/README.md">Source and exact benchmark record</a></p></article>';
 if(!s.includes('<div class="cards">'))throw Error('Research hub changed; review navigation manually');
 s=s.replace('<div class="cards">','<div class="cards">'+card);fs.writeFileSync(u,s);
}
