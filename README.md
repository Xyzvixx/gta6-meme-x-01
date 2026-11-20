# PENALTY: 1 MEME | Leonida Citation, 13-Year Loop, 169 px Star-to-YOU, $500 Bounty

[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/Xyzvixx/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/Xyzvixx/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

A Leonida Parking Citation for the crime of failing to move for 13 years.
The penalty is one meme — and that meme is a shot at the $500 make.fun
bounty. The make.fun ghost serves the sentence, the green dashed shortcut
reroutes the wait, and the stamp in the south-east water reads
SENTENCED TO make.fun.

## The post

Live on X: https://x.com/xyzvix/status/2123712548486983991

> Officer, I finally moved. To make.fun.
>
> Build yours:
> https://make.fun/bounty/gta6-meme-x-01 @makefunai makefun-seal-lavender-vinyl

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22, stdlib only, no network, no assets. The program renders the
1024x1024 meme twice in memory, refuses to write unless the two renders
are byte-identical, then writes `meme.png` — and, crucially, copies
`POST.json` into the output directory next to it.

## Why v8 exists

Round 2 (v7) passed every validity check but failed the judge gate: the
sealed scorer reads `POST.json` from `/output` (`post_file`), and v7's
program only ever wrote `meme.png` there. Round 1 copied `POST.json` and
passed the gate. v8 is a fresh rewrite of the generator with the same
winning design — same citation, same 169.2 px star-to-YOU distance, same
21 text rects with zero overlaps — plus the `POST.json` copy that v7
lacked. The image is regenerated from scratch by this program; the X post
is unchanged, so no new post is needed.

## Files

- `main.ts` — the whole generator: hand-written 5x7 pixel font, PNG
  encoder, canvas primitives, ghost, loop, stamp, and the output/POST.json
  logic. No dependencies.
- `POST.json` — the X post address the program copies to `/output`.
- `meme.png` — the rendered meme (regenerate with `run.sh`).
- `caption.txt` — the exact caption posted with the meme.
- `TEST_RESULTS.md` — verification, business-logic self-test, panel scores.
- `.env.example` — no secrets are needed for this entry.
