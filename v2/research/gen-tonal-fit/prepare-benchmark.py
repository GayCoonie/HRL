"""Copy pinned scored judges' adapter, changing only the model factory and controls."""
from pathlib import Path
import hashlib,json
P=Path(__file__).resolve().parent
src=(P/'../shared-rl/benchmark.py').read_text()
src=src.replace("['old-balanced','balanced','metric']","['old-balanced','old-metric','balanced','metric']")
src=src.replace("'71c915590253a8a82b278b4c408abbf44c8db75d + resumed shared R/L'","'bf43587e620c97a660a6f4d3da76ae41472446f8 + GenSpace tonal fit'")
src=src.replace('No observer refit, dropped-error suppression,','COMBVD was fitted. No dropped-error suppression,')
(P/'benchmark.py').write_text(src)
s=(P/'../shared-rl/bridge.mjs').read_text();i=s.index('for await')
s='''/** Exact conversion; inherited explicit strict/clipped input policies. */
import {createInterface} from 'node:readline';
import {createSharedHRL} from '../shared-rl/source.mjs';
import {createGenTonalHRL} from './index.mjs';
const c=JSON.parse(process.argv[2]),opts={gamut:c.gamut,overflow:c.policy,imaginary:c.policy};
const m=c.mode.startsWith('old-')?await createSharedHRL({...opts,checkpoint:c.mode.slice(4)}):await createGenTonalHRL({...opts,checkpoint:c.mode});
'''+s[i:]
(P/'bridge.mjs').write_text(s)
(P/'results/benchmark-adapter.json').write_text(json.dumps({'baseAdapter':'../shared-rl/benchmark.py','baseSHA256':hashlib.sha256((P/'../shared-rl/benchmark.py').read_bytes()).hexdigest(),'change':'Same judges and support policies; four controls/candidates plus two full clipped cases. GenSpace is not substituted into any scored judge.'},indent=2)+'\n')
