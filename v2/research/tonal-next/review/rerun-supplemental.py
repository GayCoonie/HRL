# Execute original reviewer unchanged; redirect its sole output to this review directory.
from pathlib import Path
import runpy
source=Path('/workspace/scratch/20abb8fd27ac/hrl-optimization/review-runtime-round3-supplemental-check.py')
original_write=Path.write_text
old=Path('/workspace/scratch/20abb8fd27ac/hrl-optimization/review-runtime-round3-supplemental-evidence.json')
new=Path('/workspace/scratch/13a5381bdd27ac/review/supplemental-fresh.json')
new=Path('/workspace/scratch/13a5381bdd70/review/supplemental-fresh.json')
def write_text(self,*args,**kwargs):
 assert self==old, f'Unexpected attempted output: {self}'
 return original_write(new,*args,**kwargs)
Path.write_text=write_text
runpy.run_path(str(source),run_name='__main__')
