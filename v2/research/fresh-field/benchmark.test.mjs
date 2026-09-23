import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadInputs,run,stress,parseArgs,candidateIdentity} from './benchmark.mjs';

test('input identity, six source families, and the original retained population are pinned',()=>{
  const x=loadInputs();
  assert.equal(x.all.length,3813);assert.equal(x.native.length,3331);
  assert.equal(x.identity.sourceNPZSHA256,'a04f0986100a2131fe9930d745bc2323f1e3089d6d8ff8fb74b3b6bdf9e659a9');
  assert.equal(x.identity.nativeMaskSHA256,'c95b0a38cd038fff9163f0d38ed4924addb95b1156283cf4a2ed65909efa2251');
  assert.deepEqual(Object.values(x.identity.familyCounts),[2028,200,548,307,312,418]);
});

test('weighted STRESS minimizes a fitted scale on the selected population',()=>{
  assert.ok(Math.abs(stress([0,1],[2,4],[1,2],[1,9]))<1e-6);
  assert.throws(()=>stress([],[1],[1],[1]),/nonempty/);
  assert.throws(()=>stress([0],[NaN],[1],[1]),/Nonfinite/);
});

test('frozen Beta 1 and joint runtime scores independently reproduce the three populations',async()=>{
  const x=await run(parseArgs(['--models','beta1,joint']));
  const near=(got,want)=>assert.ok(Math.abs(got-want)<1e-8,`${got} != ${want}`);
  for(const [name,sw,su,mw,mu,fw,fu] of [
    ['beta1',29.107047807815427,30.71258817521673,34.489196386295546,38.12633858568467,29.948554645320506,32.127879751619034],
    ['joint',26.795160959084658,28.474657914110246,33.35823689498577,36.43119169860092,26.902322208333274,28.783791842379326]
  ]){
    const s=x.models[name].srgb,f=x.models[name].full;
    near(s.retained.weighted,sw);near(s.retained.unweighted,su);
    near(s.mappedAll.weighted,mw);near(s.mappedAll.unweighted,mu);
    near(f.retained.weighted,fw);near(f.retained.unweighted,fu);
    assert.equal(s.retained.pairs,3331);assert.equal(s.retained.mappedPairs,0);
    assert.equal(s.mappedAll.pairs,3813);assert.equal(s.mappedAll.mappedPairs,482);
    assert.equal(f.retained.pairs,3813);assert.equal(f.retained.mappedPairs,0);
  }
  // A pooled improvement must not conceal a family-specific deterioration.
  assert.ok(x.models.joint.full.retained.perFamily['BFD-P( C )'].weighted >
            x.models.beta1.full.retained.perFamily['BFD-P( C )'].weighted);
});

test('candidate factory is an explicit module contract',()=>{
  assert.throws(()=>parseArgs(['--models','candidate']),/candidate-module/);
  assert.throws(()=>parseArgs(['--models','candidate','--candidate-module','index.mjs']),/candidate-record/);
  assert.throws(()=>parseArgs(['--models','beta1,beta1']),/distinct/);
});

test('candidate identity changes when the imported sibling model changes',()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'hrl-benchmark-source-'));
  try{
    const entry=path.join(folder,'index.mjs'),model=path.join(folder,'model.mjs'),record=path.join(folder,'frozen.json');
    fs.writeFileSync(entry,"import './model.mjs';\nexport const name='candidate';\n");
    fs.writeFileSync(model,'export const warp=1;\n');fs.writeFileSync(record,'{"coefficient":1}\n');
    const a=candidateIdentity(entry,record);
    fs.writeFileSync(model,'export const warp=2;\n');
    const b=candidateIdentity(entry,record);
    assert.equal(a.moduleSHA256,b.moduleSHA256);
    assert.equal(a.recordSHA256,b.recordSHA256);
    assert.notEqual(a.modelSHA256,b.modelSHA256);
    fs.writeFileSync(record,'{"coefficient":2}\n');
    assert.notEqual(b.recordSHA256,candidateIdentity(entry,record).recordSHA256);
  }finally{fs.rmSync(folder,{recursive:true,force:true});}
});

test('candidate manifest recursively pins a second-level import and distinguishes commentary from imports',()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'hrl-benchmark-closure-'));
  try{
    const entry=path.join(folder,'index.mjs'),model=path.join(folder,'model.mjs'),nested=path.join(folder,'shared.mjs'),record=path.join(folder,'frozen.json');
    fs.writeFileSync(entry,'// import "./nonexistent.mjs";\nimport "./model.mjs";\nexport {x} from "./shared.mjs";\n');
    fs.writeFileSync(model,'import {x} from "./shared.mjs";\nexport const y=x;\n');
    fs.writeFileSync(nested,'export const x=1;\n');fs.writeFileSync(record,'{}\n');
    const a=candidateIdentity(entry,record);
    assert.deepEqual(a.dependencies.map(x=>x.path),[entry,model,nested].sort());
    fs.writeFileSync(nested,'export const x=2;\n');
    const b=candidateIdentity(entry,record);
    assert.equal(a.moduleSHA256,b.moduleSHA256);
    assert.equal(a.modelSHA256,b.modelSHA256);
    assert.equal(a.recordSHA256,b.recordSHA256);
    assert.notEqual(a.dependencyManifestSHA256,b.dependencyManifestSHA256);
    assert.notEqual(a.dependencies.find(x=>x.path===nested).sha256,b.dependencies.find(x=>x.path===nested).sha256);
  }finally{fs.rmSync(folder,{recursive:true,force:true});}
});

test('boundary-tonal runtime checkpoint changes candidate identity even if all JS is unchanged',()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'hrl-benchmark-resources-'));
  try{
    const base=path.join(folder,'v2'),entry=path.join(base,'research/fresh-field/index.mjs');
    const boundary=path.join(base,'research/boundary-tonal/index.mjs');
    const model=path.join(base,'research/fresh-field/model.mjs');
    const record=path.join(base,'research/fresh-field/frozen.json');
    fs.mkdirSync(path.dirname(boundary),{recursive:true});fs.mkdirSync(path.dirname(entry),{recursive:true});
    fs.writeFileSync(entry,'import "./model.mjs";\nimport "../boundary-tonal/index.mjs";\n');
    fs.writeFileSync(model,'export const x=1;\n');fs.writeFileSync(boundary,'export const boundary=1;\n');fs.writeFileSync(record,'{}\n');
    const paths=['boundary-1nm.json','results/metric.json','../../a-smooth/definitions.json',
      '../../a-smooth/source-srgb.json','../../a-smooth/source-full.json','../../data/hue-field-0.6.json',
      '../../data/release1-angles.json','../../data/appearance-readouts.json',
      '../rl-c1/candidate.json','../relative-domain/results/source-full.json'];
    for(const relative of paths){const p=path.resolve(path.dirname(boundary),relative);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,'{}\n');}
    const a=candidateIdentity(entry,record);assert.equal(a.runtimeResources.length,10);
    fs.writeFileSync(path.resolve(path.dirname(boundary),'results/metric.json'),'{"metric":2}\n');
    const b=candidateIdentity(entry,record);
    assert.equal(a.dependencyManifestSHA256,b.dependencyManifestSHA256);
    assert.notEqual(a.resourceManifestSHA256,b.resourceManifestSHA256);
  }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
