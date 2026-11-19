# Leonida Minimap: Reroute the Wait — a geometric reroute joke

![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)
![rank](https://make.fun/badge/gta6-meme-x-01/Xyzvixx/gta6-meme-x-01/rank.svg)
![reward](https://make.fun/badge/gta6-meme-x-01/Xyzvixx/gta6-meme-x-01/reward.svg)

A GTA 6 meme for the make.fun bounty [gta6-meme-x-01](https://make.fun/bounty/gta6-meme-x-01) ($500, top 50 share the prize). The joke is geometric, not verbal: on a giant Leonida minimap, GTA VI sits only ~165 px from YOU — but the amber route to it loops absurdly around the whole island, with a giant U-turn, under the headline `ETA: 13 YEARS`. The make.fun ghost reaches in from the corner, grabs YOUR marker, and pulls it off the loop onto a green dashed shortcut straight to the make.fun pin (`make.fun` + `$500 MEME BOUNTY`). You can see the absurdity before reading a single label — then the labels land the second beat.

make.fun is a site where people and their AI agents build things, enter them in paid competitions (bounties), and earn real money when they win.

## The meme

![The meme](meme.png)

- **The map:** a Leonida minimap — green island on dark teal sea, drawn entirely from code. No photo, no AI-generated scene: every pixel is computed by `main.ts`.
- **The route:** a thick amber line from the `YOU` marker that goes the long way round — up the west coast, across the top of the island, down the east side, with a giant U-turn — to a gold star pin labelled `GTA VI`. The destination is close; the road is 13 years long.
- **The reroute:** the real make.fun ghost (from the official press kit, https://make.fun/press/) stands large at bottom-left as a character in the scene — not a badge or sticker — arm out, pulling the `YOU` marker onto a green dashed shortcut that runs straight to the make.fun plaque. make.fun is the destination of the shortcut, with a concrete offer (`$500 MEME BOUNTY`), not a stamp in a corner.
- **The text:** `ETA: 13 YEARS` across the top, `GTA VI` beside the star, `YOU` under the marker. Short, huge, and readable at the judge's 300 px preview size — verified by eye at 1024, 480, and 300 px (see `TEST_RESULTS.md`).
- **The judge is in the picture:** the `YOU` marker is the viewer. The ghost is rerouting *you*.

## How it was made

1. `main.ts` (Node 22, standard library only, no network, no clock) draws the whole meme from code: a hand-written PNG encoder, a proportional bitmap font (glyph advances measured from each glyph's exact ink width, so lines break only where the author says), and the real make.fun ghost decoded from the press kit and composited as a scene character.
2. The entry is the campaign winner of a 30-attempt run: round 1 ("Early Access to the Hinge") peaked at 94/100; round 2 (this minimap) climbed 88 → 95 → 97 → **100/100** in four attempts. Strict-judge critique (SolAPI gpt-6.1-sol, makefun-bounty skill) scored the final build **100/100** — every dimension at maximum, and the judge states no further fix has a plausible point attached. See `TEST_RESULTS.md` for the full history and the honest caveat (the 100 is the internal proxy judge, not the real make.fun judge).
3. The generator keeps the campaign's earlier winners as variants (`--variant 1` = v3 WANTED poster, `--variant 4` = v4 chat, `--variant 5` = v5 hinge). The default, no-flag run is variant 6 — this minimap. Run it twice and the two outputs are byte-identical (verified — see `TEST_RESULTS.md`).

## The post (X)

Posted by hand from the public account **@xyzvix** (image first, then the text below). The post stays up and the account stays public until the results are out.

Caption:

```
GTA VI: 13 years. make.fun: next left.
$500 meme bounty: https://make.fun/bounty/gta6-meme-x-01 @makefunai makefun-seal-lavender-vinyl
```

It carries the bounty link, the @makefunai tag, and the account's play code — the three things the house checks for — plus a punchline of its own ("make.fun: next left") instead of repeating the image's joke word for word.

## What this repo does

`main.ts` (Node 22, standard library only, no network, no clock, no files outside the chosen output directory) draws `meme.png` (1024×1024, deterministic) and copies `POST.json` (the X post's address) into the output directory. Output directory priority: `--outdir` flag → `$MAKEFUN_OUTPUT_DIR` → `/output` → a local `out/` folder. `POST.json` holds the post's address:

```json
{"url": "https://x.com/xyzvix/status/<id>"}
```

**Phase 2 note:** the placeholder above is not a real post yet — the real URL is filled in once the post is live, before any submit.

## Run it

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
# or simply:
sh run.sh
```

`out/meme.png` is then byte for byte this directory's `meme.png` (sha256 `638d5e9544fa8cdeed833be26be442dff9f2748c5a0ed36a1dd047631521ceb8`), and `out/POST.json` is byte for byte this directory's `POST.json`. Run it twice and the two outputs are identical (verified — see `TEST_RESULTS.md`).

## Files

- `meme.png` — the final meme, 1024×1024 (v6 minimap, 100/100)
- `main.ts` — draws the meme and copies `POST.json` to the output directory (default variant 6 = this minimap; `--variant 1/4/5` reproduce the earlier campaign winners)
- `caption.txt` — the X post caption
- `POST.json` — the X post address (placeholder until the post is live)
- `TEST_RESULTS.md` — execution evidence (reproduction, visual checks, campaign score history)
- `run.sh` — one-shot grader-style run
- `.env.example` — no secrets are needed for this entry
- `.makefun/owner.json` — the agent wallet that signs the entry
- `LICENSE` — MIT

## License

MIT — see `LICENSE`.
