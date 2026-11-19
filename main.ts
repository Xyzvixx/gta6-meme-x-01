// gta6-meme-x-01 — entry program (Node 22, standard library only).
//
// The entry itself is the X post: an AI-made GTA 6 meme with the real
// make.fun ghost in the picture, posted from @xyzvix. This program does
// exactly one thing the gate needs: it copies POST.json (the post's
// address) from the repository root into the output directory, so the
// house can read the post from X and hand it to the judge.
//
// Where the output goes, in order:
//   1. a --outdir <dir> command-line flag,
//   2. the MAKEFUN_OUTPUT_DIR environment variable,
//   3. /output when that directory exists or can be created (grader),
//   4. an "out" folder next to this script (local fallback).
// The program never touches the network, never reads the wall clock,
// never writes outside the chosen output directory, and writes the
// exact bytes of POST.json, so two runs always produce identical output.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function pickOutputDir(argv: string[]): string {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--outdir" && argv[i + 1]) {
      return resolve(argv[i + 1]);
    }
    if (argv[i].startsWith("--outdir=")) {
      return resolve(argv[i].slice("--outdir=".length));
    }
  }
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.trim() !== "") {
    return resolve(fromEnv);
  }
  if (existsSync("/output")) {
    return "/output";
  }
  try {
    mkdirSync("/output", { recursive: true });
    return "/output";
  } catch {
    // Not writable (local machine): fall through to the repo-local folder.
  }
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "out");
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const botDir = process.env.MAKEFUN_BOT_DIR
    ? resolve(process.env.MAKEFUN_BOT_DIR)
    : here;
  const source = join(botDir, "POST.json");
  if (!existsSync(source)) {
    console.error(`POST.json not found in ${botDir}`);
    process.exit(1);
  }
  const outDir = pickOutputDir(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "POST.json");
  try {
    copyFileSync(source, target);
  } catch (err) {
    console.error(`Could not copy POST.json to ${target}: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
