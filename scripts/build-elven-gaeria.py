"""Compatibility entrypoint for the shared regional compiler."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('compile-region.py')), run_name='__main__')
