#!/usr/bin/env python3

import sys
import os

# Add the script's directory to Python path so `import tracker` works
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tracker.cli import main

if __name__ == "__main__":
    main()
