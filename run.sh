#!/bin/sh
# One-shot run, exactly the way the grader runs it:
#   MAKEFUN_OUTPUT_DIR=out node main.ts
set -eu
cd "$(dirname "$0")"
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
echo "OK: out/meme.png written"
