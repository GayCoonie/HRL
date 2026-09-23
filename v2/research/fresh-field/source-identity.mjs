/** Hash the recursive ESM static-import closure without evaluating candidate code.
 * Run under `node --experimental-vm-modules --no-warnings source-identity.mjs ENTRY RECORD`.
 * Node's own module parser supplies static import/export specifiers; no regex approximates JS syntax.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {builtinModules} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {SourceTextModule} from 'node:vm';

const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const builtins=new Set(builtinModules.map(name=>name.replace(/^node:/,'')));
// These are the exact runtime-loaded data used by createSpectralTonalHRL({checkpoint:'metric'})
// via getBoundarySource -> createRelativeHRL -> createRLC1 -> createASmooth.
// The supplied candidate bank replaces the separate fresh/conditional seed.
const BOUNDARY_RUNTIME_DATA=[
  'boundary-1nm.json','results/metric.json',
  '../../a-smooth/definitions.json','../../a-smooth/source-srgb.json','../../a-smooth/source-full.json',
  '../../data/hue-field-0.6.json','../../data/release1-angles.json','../../data/appearance-readouts.json',
  '../rl-c1/candidate.json','../relative-domain/results/source-full.json'
];

export function candidateIdentity(modulePath,recordPath){
  if(!modulePath||!recordPath)throw Error('Candidate entry and explicit frozen record are required');
  if(typeof SourceTextModule!=='function')throw Error('SourceTextModule requires --experimental-vm-modules');
  const module=fs.realpathSync(path.resolve(modulePath));
  const model=fs.realpathSync(path.join(path.dirname(module),'model.mjs'));
  const record=fs.realpathSync(path.resolve(recordPath));
  const recordBytes=fs.readFileSync(record);JSON.parse(recordBytes);
  const visited=new Map(),queued=[module];
  while(queued.length){
    const file=queued.pop();if(visited.has(file))continue;
    const bytes=fs.readFileSync(file);
    const esm=new SourceTextModule(bytes.toString('utf8'),{identifier:file});
    const imports=[...new Set(esm.dependencySpecifiers)].sort();
    const resolved=[];
    for(const spec of imports){
      if(spec.startsWith('node:')||builtins.has(spec))continue;
      if(!spec.startsWith('.')&&!spec.startsWith('/')&&!spec.startsWith('file:'))throw Error(`Unpinned external JS dependency ${spec} in ${file}`);
      const dependency=fs.realpathSync(fileURLToPath(new URL(spec,pathToFileURL(file))));
      if(!/\.(?:mjs|js)$/.test(dependency))throw Error(`Non-JS local import requires a separate pin: ${dependency}`);
      resolved.push(dependency);queued.push(dependency);
    }
    visited.set(file,{path:file,sha256:sha(bytes),imports:resolved.sort()});
  }
  if(!visited.get(module)?.imports.includes(model))throw Error('Candidate entry must directly import sibling ./model.mjs');
  const dependencies=[...visited.values()].sort((a,b)=>a.path.localeCompare(b.path));
  const boundary=[...visited.keys()].find(p=>p.replaceAll('\\','/').endsWith('/research/boundary-tonal/index.mjs'));
  const runtimeResources=boundary?BOUNDARY_RUNTIME_DATA.map(relative=>{
    const file=fs.realpathSync(path.resolve(path.dirname(boundary),relative));
    return {path:file,sha256:sha(fs.readFileSync(file))};
  }).sort((a,b)=>a.path.localeCompare(b.path)):[];
  return {module,model,record,moduleSHA256:visited.get(module).sha256,modelSHA256:visited.get(model).sha256,
    recordSHA256:sha(recordBytes),dependencies,dependencyManifestSHA256:sha(JSON.stringify(dependencies)),
    runtimeResources,resourceManifestSHA256:sha(JSON.stringify(runtimeResources))};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(candidateIdentity(process.argv[2],process.argv[3]))+'\n');}
  catch(e){console.error(e.stack??String(e));process.exitCode=1;}
}
