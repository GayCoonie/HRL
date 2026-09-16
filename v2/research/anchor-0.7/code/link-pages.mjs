/** Add navigation only. Never change v1 conversion code or old prototype definitions. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
for(const [name,link] of [['index.html','v2/opal-anchor.html'],['v2/index.html','opal-anchor.html']]){
 const p=path.join(root,name);let s=fs.readFileSync(p,'utf8');if(!s.includes(link)){
  const html=`<a href="${link}">OPAL 0.7 · gamut-anchored</a>`;
  if(s.includes('</nav>'))s=s.replace('</nav>',html+'</nav>');else s=s.replace('<body>','<body><nav>'+html+'</nav>');fs.writeFileSync(p,s);
 }
}
for(const [name,link,report] of [['README.md','v2/opal-anchor.html','v2/research/anchor-0.7/README.md'],['v2/README.md','opal-anchor.html','research/anchor-0.7/README.md']]){
 const p=path.join(root,name);let s=fs.readFileSync(p,'utf8');if(!s.includes('## OPAL 0.7 gamut-anchor research')){s+=`\n## OPAL 0.7 gamut-anchor research\n\n[Open the 0.7 comparison picker](${link}) · [Methods, source intake and scores](${report}). The default balances direct COMBVD fitting against the accepted OPAL 0.6 layout. Its own-gamut anchor controls normalization throughout the R/L construction. OPAL 0.6 and Release 1 are preserved. These are explicitly in-sample research fits, not an accepted Release 2.\n`;fs.writeFileSync(p,s);}
}
