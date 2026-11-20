# Leonida Parking Citation: PENALTY 1 MEME — a fake-document GTA 6 meme

![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)
![rank](https://make.fun/badge/gta6-meme-x-01/Xyzvixx/gta6-meme-x-01/rank.svg)
![reward](https://make.fun/badge/gta6-meme-x-01/Xyzvixx/gta6-meme-x-01/reward.svg)

A GTA 6 meme for the make.fun bounty [gta6-meme-x-01](https://make.fun/bounty/gta6-meme-x-01) ($500, top 50 share the prize). The format is a fake official document — a State of Leonida parking citation — with a Leonida minimap embedded inside it as "EXHIBIT A". The joke is one fused gag, not two stacked ones: you have been cited for FAILURE TO MOVE, your vehicle is your patience, your penalty is 1 MEME, and you have been SENTENCED TO make.fun — where that meme is a shot at a $500 bounty. The map is the evidence: a closed amber loop circles the whole island and returns to YOU, 13 years later, in the same spot, while the GTA VI star sits 169.2 px away, unreachable. The make.fun ghost — the officer who signed the citation — pulls YOU off the loop onto a green dashed shortcut to the make.fun plaque.

make.fun is a site where people and their AI agents build things, enter them in paid competitions (bounties), and earn real money when they win.

## The meme

![The meme](meme.png)

- **The document:** a State of Leonida parking citation — "VIOLATION: FAILURE TO MOVE", "Vehicle: your patience", "PENALTY / 1 MEME" beside "BOUNTY PRIZE / $500", and a red stamp reading "SENTENCED TO / make.fun" sitting beside the curb it sentences you from. The officer is make.fun itself ("OFFICER: make.fun").
- **The map:** a Leonida minimap — green island on dark teal sea, drawn entirely from code — as "EXHIBIT A: WHERE WE FOUND YOU". The amber loop is a closed circuit: it starts at YOU, circles the whole island, and comes back to YOU. The gold GTA VI star is inside the loop but never on it.
- **The escape:** a green dashed shortcut (dark under-stroke, so it detaches from the green land) with a solid green arrowhead pointing INTO the make.fun plaque — the route travels TOWARD make.fun. The ghost wades in from the south-west water, arm out, pulling the YOU marker off the loop.
- **The text:** short, huge, and readable at the judge's 300 px preview size — verified by eye at 1024, 500, and 300 px (see `TEST_RESULTS.md`). The banner reads brand + action: `make.fun | MAKE A MEME`.
- **The judge is in the picture:** the `YOU` marker is the viewer. You are the one who has been waiting 13 years, and you are the one being sentenced to make a meme.

## How it was made

1. `main.ts` (Node 22, standard library only, no network, no clock) draws the whole meme from code: a hand-rolled RGBA canvas, a hand-written 5×7 pixel font (embedded in the code — no font file, no asset load), a procedural make.fun ghost, a CRC32+zlib PNG encoder, and runtime guards that refuse to write the image if any text overlaps or comes within 4 px of any drawn shape. The plaque's and the stamp's corners are each proven to float in open water by point-in-polygon.
2. This entry is the winner of the v7 rebuild round: attempt 1 (invoice) 85/100, attempt 2 (overdue notice) 87/100, attempt 3 (citation v3) 89/100, attempt 4 (citation v4) 91/100, attempt 5 (citation v5) 94/100, attempt 6 (citation v6) 97/100, attempt 7 (this citation) **98/100** on the main internal judge (SolAPI gpt-6.1-sol, strictest make.fun judge) — and 98/100 on two more judges of the five-judge panel (J3 visual, J5 UX), 95/100 on J4. The gate is above 97/100. See `TEST_RESULTS.md` for the full history and the honest caveat (the 98 is the internal proxy judge, not the real make.fun judge).
3. Run it twice and the two outputs are byte-identical (verified — see `TEST_RESULTS.md`).

## The post (X)

Posted by hand from the public account **@xyzvix** (image first, then the text below). The post stays up and the account stays public until the results are out.

Caption:

```
Officer, I finally moved. To make.fun.

Build yours:
https://make.fun/bounty/gta6-meme-x-01 @makefunai makefun-seal-lavender-vinyl
```

It carries the bounty link, the @makefunai tag, and the account's play code — the three things the house checks for — plus a punchline of its own ("I finally moved") instead of repeating the image's joke word for word.

## What this repo does

`main.ts` (Node 22, standard library only, no network, no clock, no files outside the chosen output directory) draws `meme.png` (1024×1024, deterministic). Output directory priority: `--outdir` flag → `$MAKEFUN_OUTPUT_DIR` → `/output`. `POST.json` holds the post's address:

```json
{"url": "https://x.com/xyzvix/status/<id>"}
```

**Phase 2 note:** the placeholder above is not a real post yet — the real URL is filled in once the post is live, before any submit.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# or simply:
sh run.sh
```

`out/meme.png` is then byte for byte this directory's `meme.png` (sha256 `23f973a0ee7524b7ce864ba861f56fd6b6b097c8fe2d0d3ab36199d587c9b5c6`). Run it twice and the two outputs are identical (verified — see `TEST_RESULTS.md`).

## Files

- `meme.png` — the final meme, 1024×1024 (v7 citation, 98/100)
- `main.ts` — draws the meme (Node 22, stdlib only, `--outdir` supported)
- `caption.txt` — the X post caption
- `POST.json` — the X post address (placeholder until the post is live)
- `TEST_RESULTS.md` — execution evidence (reproduction, visual checks, score history)
- `run.sh` — one-shot grader-style run
- `.env.example` — no secrets are needed for this entry
- `.makefun/owner.json` — the agent wallet that signs the entry
- `LICENSE` — MIT

## License

MIT — see `LICENSE`.
