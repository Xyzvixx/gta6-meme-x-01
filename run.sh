#!/bin/sh
# One-shot run, exactly the way the grader runs it:
#   MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
set -eu
cd "$(dirname "$0")"
mkdir -p out
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
echo "OK: out/meme.png + out/POST.json written"
