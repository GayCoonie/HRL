"""The continuation must guard current Beta 1, not its older 0.12 parent."""
from pathlib import Path
import hashlib,json,subprocess,sys,tempfile,unittest,os
P=Path(__file__).resolve().parent
class GuardReferenceTest(unittest.TestCase):
 def test_zero_step_continuation_preserves_beta1_and_uses_it_as_guard(self):
  source=P.parent/'boundary-tonal/trials/metric-b2.json'
  baseline=json.loads(source.read_text())
  with tempfile.TemporaryDirectory(prefix='hrl-guard-test-') as temp:
   command=[sys.executable,str(P/'fit.py'),'--name','contract','--start','metric-b2','--steps','0','--stride','8','--samples','17','--layers','7','--mode','bicubic','--gridroot',os.environ['HRL_GRIDROOT'],'--outdir',temp]
   run=subprocess.run(command,capture_output=True,text=True)
   self.assertEqual(run.returncode,0,run.stderr)
   record=json.loads((Path(temp)/'contract.json').read_text())
   self.assertEqual(record['coefficients'],baseline['coefficients'])
   self.assertEqual(record['dark'],baseline['dark'])
   self.assertEqual(record['research']['parent_sha256'],hashlib.sha256(source.read_bytes()).hexdigest(),'Accuracy and path guards must reference the starting Beta 1, not 0.12')
   self.assertAlmostEqual(record['research']['stats']['srgb']['stress'],29.107047807813792,places=8)
   self.assertAlmostEqual(record['research']['stats']['full']['stress'],29.94855464531938,places=8)
if __name__=='__main__':unittest.main()
