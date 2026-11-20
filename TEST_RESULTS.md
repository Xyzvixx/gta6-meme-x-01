# TEST_RESULTS — gta6-meme-x-01 (winner: v7 citation, 98/100)

Run in the v7 rebuild session, 20 Nov 2026. The entry program `main.ts` is
written for Node 22 (stdlib only, no Node 24-only APIs) and follows the
starter's `node main.ts` invocation. The grader's pinned version is
node:22-bookworm-slim, NODE_VERSION=22.23.4 — the generator was verified
with the local Node v24.22.1 (same stdlib APIs used: `fs`, `path`,
`crypto`, `zlib` — all stable across Node 18+).

## 1. main.ts — grader-style runs (determinism)

```sh
node main.ts --outdir /tmp/meme-v7-a7
```

- Exit 0. `meme.png` sha256
  `23f973a0ee7524b7ce864ba861f56fd6b6b097c8fe2d0d3ab36199d587c9b5c6`
- Size: 34,696 bytes, 1024x1024.
- The program renders twice in memory and refuses to write unless both
  PNGs are byte-identical (determinism self-check in `main()`); the run
  printed `determinism: two in-memory renders byte-identical`.
- A second, separate run produced the same sha256 (verified when the
  render was re-run for the 500 px / 300 px previews).
- Star-to-YOU distance printed by the program: 169.2 px (target 160-170).
- Text rects guarded: 21, overlaps: 0, shape-guard violations: 0.

## 2. Visual checks (by eye, this session)

- **Full size (1024x1024):** title, violation lines, PENALTY 1 MEME /
  BOUNTY PRIZE $500, banner (make.fun + MAKE A MEME), EXHIBIT A title,
  SENTENCED TO make.fun stamp beside the curb with its red dashed leader,
  closed amber loop, white "13 YEARS. SAME SPOT.", green shortcut with
  dark under-stroke and arrowhead into the plaque, ghost + YOU + NO
  WAITING, plaque "make.fun", GTA VI star. No overlaps, no clipped text.
- **500 px preview:** every hero read comfortably legible (title,
  violation, penalty/prize strip, banner, EXHIBIT A, loop label, ghost +
  YOU + NO WAITING, plaque, GTA VI, stamp).
- **300 px preview:** the big reads survive (title, violation lines,
  PENALTY 1 MEME / BOUNTY PRIZE $500, banner, EXHIBIT A, 13 YEARS. SAME
  SPOT., island + closed loop + star + GTA VI, ghost + YOU + NO WAITING,
  plaque, stamp). The 14 px fine print (citation number, OFFICER line,
  SENTENCED TO) is fine print by design, not a hero read.

## 3. Runtime guards (in main.ts — the build fails loudly, never silently)

- `checkTextGuards()`: all 21 text rects checked for overlap and for the
  80 px content margins — 0 violations.
- `checkShapeGuards()`: every text rect sampled against the loop
  polyline, the green shortcut, the ghost arm, the star circle, the YOU
  marker circle, the curb, the plaque, the ghost box, and the stamp rect,
  minimum 4 px ink gap — 0 violations. (The guard caught three real
  near-collisions during the v5 build; each was fixed by moving a label,
  never by weakening the guard.)
- Plaque corners and stamp corners each proven to be in open water by
  point-in-polygon against the island polygon — the program throws if any
  corner is on land.

## 4. Score history (v7 rebuild round, standard rubric, SolAPI main judge)

| Attempt | Concept | J2 (SolAPI, main gate) | Panel |
|---|---|---|---|
| 1 | Steam invoice B | 85/100 | — |
| 2 | Library overdue notice A | 87/100 | — |
| 3 | Parking citation v3 | 89/100 | — |
| 4 | Citation v4 TIME SERVED | 91/100 | J3 94, J4 86, J5 88; J1 unavailable |
| 5 | Citation v5 SAME SPOT | 94/100 | J3 96, J4 85, J5 91; J1 unavailable |
| 6 | Citation v6 SENTENCED TO make.fun | 97/100 | J3 98, J4 82, J5 91; J1 unavailable |
| **7** | **Citation v7 PENALTY 1 MEME** | **98/100** | **J3 98, J4 95, J5 98; J1 unavailable** |

Gate: above 97/100 on the main judge (SolAPI as strictest make.fun
judge). Attempt 7 clears it (98/100), and also scores 98/100 on J3
(visual) and J5 (UX). J1 (deepseek-v4.1-flash-free via 100milionseek) is
unavailable as a text judge for this entry: it returns `content: null`
with a reasoning-only trace and tries to invoke tools it does not have
(3 attempts in the v4 round, plus a 120 s timeout on a short prompt) —
recorded as unavailable, not a pass.

**Honest caveat:** the 98/100 is the internal proxy judge (SolAPI
gpt-6.1-sol judging a render description, not the real make.fun pairwise
judge, which sees the actual image). The live top 5 for this bounty are
all fake official documents; this entry competes in that format with the
strongest fused document+map joke of the series. Round 1 ("Leonida
Minimap: Reroute the Wait", internal 100/100) is NOT in the live top 50
— format, not quality, is why it is not ranking.

## 5. Secret scan (this staging repo)

- 0 secrets. The Primary wallet address appears NOWHERE in this repo
  (checked by grep across all files, including TEST_RESULTS.md — the
  address itself is never written into any repo file, not even to say it
  is absent).
- `.makefun/owner.json` contains only the agent wallet
  `3kdhyBhEmXRYMkFCEfFUzJkXzUb6jcLuRqHJvzQewFuQ`.
- No `.env`, private key, seed phrase, API key, or token in the repo.
- README contains exactly the 3 live make.fun badge SVGs and 0
  shields.io links. LICENSE starts with `SPDX-License-Identifier: MIT`.

## 6. Kit check (with bundle) — PASS

- Staging repo assembled from the v7 winner (`main.ts` + `meme.png`) plus
  the repo scaffolding (README, LICENSE, `.makefun/owner.json`,
  `POST.json` placeholder, `caption.txt`, `run.sh`, `.env.example`).
- Bundle: `/tmp/gta6-meme-x-01-a7-bundle.tar.gz` (1,164,856 B, sha256
  `8f166a389e27d3317cb491ab681f80733d3d28b646e94acce39c68df118090ea`),
  4 sessions (`--no-discover`): the rebuild builder
  `f98589ee-320b-4520-949e-01b94be3996d`, the round-1 builder
  `81f05f8b-f9b4-494c-a0e5-fd6a10860a18`, plus the parent chain the kit
  found on its own (`042c53a2` requester, `8c9034a0` main agent). Run
  record: handed-off prompt (Ridho's verbatim rebuild order in
  `~/workspace/makefun/prompt-rebuild-gta6-meme-x-01-v7.txt`), system
  prompt uploaded, instruction files collected (1), MCP none, harness
  muse-app 1.3, model ipnext/avocado-5.17-v2, provider ipnext, effort
  high. Usage file `~/.makefun/muse-usage-gta6-meme-x-01-a7.jsonl`
  (12 rows from muse.db; the rebuild builder session has no usage rows
  yet — it is still running, and usage is flushed when the session
  ends — the same situation as the round-1 v2b bundle, where one
  session had no rows and the check still passed).
- Check (`makefun check --kit . --repo staging-a7 --worktree
  --transcripts <bundle> --json`): **ok: true, failed: []**.
  - **thinking_reproduces: PASS — 98.8%** (899 of 909 counted lines
    authored, 0 copied, 0 pasted, 7 read, 3 absent; at least 30%
    required; unwritten 0.3%, at most 40% allowed; the entrypoint
    `main.ts` has 746 authored lines). This is the new method working:
    every line of the generator was written by the builder in its own
    recorded session — nothing was copied from a SolAPI code-generation
    call. (Round-1 best was 35.7% after 5 rewrite trials.)
  - thinking_priced: PASS (5 usage records, each priced to a known model).
  - thinking_in_window: PASS (614 timestamps between the opening
    2026-11-19T14:00:00Z and the receipt).
  - thinking_own_work: PASS (899/909 lines the agent's own writing).
  - thinking_turns: PASS (268 assistant turns).
  - thinking_revised: PASS (main.ts takes its final content from 32
    messages that write or edit it).
  - transcripts_run_record: PASS (handed-off prompt, agent facts,
    system prompt uploaded, instruction files collected, parent chat,
    no MCP).
  - The 5 `submission`-status checks (repo_public, repo_owner,
    repo_created_after_open, commit_in_repo, duplicate_snapshot) are
    only evaluated at submit time, against the real GitHub repo — they
    are expected to show `submission` locally.
