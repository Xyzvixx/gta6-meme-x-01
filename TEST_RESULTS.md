# TEST_RESULTS — gta6-meme-x-01 (phase 1)

Run in the builder session, 20 Nov 2026, before the phase-1 commit.
Node v24.22.1 locally; `main.ts` is written for Node 22 (stdlib only, no
Node 24-only APIs) and follows the starter's `node main.ts` invocation.

## 1. main.ts — grader-style runs (determinism)

Command (run twice, back to back):

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

- Run 1: exit 0, no output. `out/POST.json` sha256
  `388e57b937d9641e9705242902835bbe6e285b899b4ad9ffdd5acfab0215e123`
- Run 2: exit 0, no output. `out/POST.json` sha256
  `388e57b937d9641e9705242902835bbe6e285b899b4ad9ffdd5acfab0215e123`
- `cmp` run 1 vs run 2: **BYTE-IDENTICAL**
- `out/POST.json` content is byte for byte the repo's `POST.json`:
  `{"url":"https://x.com/xyzvix/status/<id>"}` (placeholder — the real
  post URL is filled in during phase 2, before any submit)

## 2. run.sh one-shot

```sh
sh run.sh
```

- Exit 0, prints `OK: out/POST.json written`.

## 3. Meme visual check

- `meme.png`: 1024×1024, RGB, PNG. Base scene AI-generated (Vice City
  sunset, no text); real make.fun ghost mark from the press kit
  (`mark-1024.png`, verified PNG 1024×1024 RGBA) composited at ~42% of
  image height, centred, facing the viewer.
- Full-size read: top text `YOU WAITED 13 YEARS FOR GTA 6` and bottom text
  `MY AGENT GOT PAID ON make.fun` are large bold white with thick black
  outline; ghost clearly recognisable; no overlap, nothing cut off.
  (Build 2: top line changed from "WAITED 13 YEARS" to "YOU WAITED 13
  YEARS" after the round-1 critique — the meme now addresses the viewer.)
- 480×480 resize (the size the judge sees): both lines still clearly
  readable, ghost still recognisable. **PASS.**
- Caption draft: 205 bytes (judge reads ~1,100), carries bounty link +
  @makefunai + play code `makefun-seal-lavender-vinyl`.

## 4. README badge check

- `grep -c "make.fun/badge/gta6-meme-x-01" README.md` → **3**
  (bounty badge, rank badge, reward badge — the exact live SVG URLs).
- `grep -c "shields.io" README.md` → **0**.

## 5. License + owner checks

- `head -1 LICENSE` → `SPDX-License-Identifier: MIT`
- `.makefun/owner.json` → agent wallet only:
  `{"wallet":"3kdhyBhEmXRYMkFCEfFUzJkXzUb6jcLuRqHJvzQewFuQ"}`
- No other wallet address appears anywhere in the repo (secret scan
  clean — see §6).

## 6. Secret scan (before commit)

```sh
grep -rEi "api[_-]?key|secret|private[_-]?key|seed phrase|BEGIN.*PRIVATE KEY|token" \
  --exclude-dir=.git --exclude=meme.png .
grep -r "PRIMARY_WALLET_ADDRESS" --exclude-dir=.git .  # placeholder for the
  # Primary wallet full address (checked by the builder against the known
  # value; the address itself is never written into any repo file): 0 hits
grep -r "\.env" --exclude-dir=.git .      # no .env file committed
```

- Result: **0 actual secret values** (the grep matches only the words
  "secret"/"API key"/"token" inside documentation sentences in
  `.env.example`, the `.gitignore` comment, and this file's own scan
  description — no keys, tokens, or private-key material). **0 hits**
  for the Primary wallet. No `.env` file exists in the repo.

## 7. Critique (2-Pass, SolAPI gpt-6.1-sol, skill makefun-bounty pasted into each call)

- Round 1: **88/100** (make.fun in picture 10, funny 7, GTA 6-specific 9,
  sells make.fun 8, short & readable 9, original 6, clean image 9,
  repo/technical 30/30). Fix: top text "YOU WAITED 13 YEARS" (viewer as
  subject) + caption rewrite with "Yours is still waiting" / "Build yours".
  Round 1's suggested caption omitted the play code — corrected by adding
  `makefun-seal-lavender-vinyl` back (205 bytes total). Round 1's main.ts
  rewrite patch REJECTED (would break byte-identical copy, print stdout,
  drop output fallbacks); round-2 judge confirmed this decision.
- Round 2 (after fixes): **SKOR 97/100** — make.fun in picture 10, funny 9,
  GTA 6-specific 10, sells make.fun 10, short & readable 10, original 8,
  clean image 10, repo/technical 30/30. Only deduction: originality (no
  low-risk fix without changing the validated concept). **Quality gate
  ≥95/100: PASSED.**

## 8. Not yet done (phase 2)

- The X post is not live yet, so `POST.json` still holds the placeholder
  and no submit has been attempted. Phase 2 (separate session, after
  Ridho posts from @xyzvix): fill in the real post URL, re-run the two
  grader runs, re-check, then push + submit.
