"""Compatibility entry point for the current live-gallery browser test."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('browser_live.py')),run_name='__main__')
