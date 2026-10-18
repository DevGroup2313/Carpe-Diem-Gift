# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# PyInstaller runtime hook, as Inkwell's: a windowed program has no console, so
# Python gives it no standard output. Anything Carpe Diem prints goes nowhere
# instead of stopping the program.
import os
import sys

if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")
