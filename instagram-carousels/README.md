# Vaporswift — Instagram content system

Three tracks, one design system, one build pipeline.

| Track | Subject |
|---|---|
| **A** | AI prompting for real estate |
| **B** | AI prompting, everything else |
| **C** | Working with Claude — the tool itself, and using it on your own posts |

**Start here:** [`PLAYBOOK.md`](PLAYBOOK.md) is the accumulated craft — prompt
framework, design system, model gotchas. Read it before building an episode.
[`POSTING-LOG.md`](POSTING-LOG.md) is the record — what shipped, how it did,
what we learned. Fill it in as you post.

---

## What's built

| # | Episode | Format | Folder |
|---|---|---|---|
| A01 | Render → photo | 8-slide carousel | `episode-01-render-to-photo/` |
| A02 | Empty room → staged | 8-slide carousel | `episode-02-empty-to-staged/` |
| A03 | Drone through the front door | Video + 7 slides | `episode-03-impossible-walkthrough/` |
| B01 | Clay → photoreal cocktail | Reel | `track-b-01-clay-to-photoreal/` |
| B02 | Into the watch movement | 8-slide carousel | `track-b-02-into-the-watch/` |
| C01 | The 125-character hook | Video + 4 slides | `track-c-01-hook-truncation/` |
| C02 | What is Claude | Video + 4 slides | `track-c-02-what-is-claude/` |
| C03 | Claude vs ChatGPT | Video + 4 slides | `track-c-03-claude-vs-chatgpt/` |
| — | Trailer: Paradise Valley | Video + 4 slides | `trailer-01-camelback/` |

Track C shares one opener: the same vapor-bed clip backs every episode and
only the `overlay.html` text changes, so a C post is recognisable on sight.

## Formats

| Folder | What it is |
|---|---|
| `format-still-to-motion/` | Photo → the same photo alive. Reusable builder; needs only a still you already have |
| `brand-preview/` | Palette harness — test tokens against a real deck without editing it |

`format-still-to-motion/` is a tool, not an episode. Point it at any clip:

```bash
cd format-still-to-motion && npm install
./fetch-assets.sh && node build-comparison.js
# or: node build-comparison.js path/to/your-clip.mp4
```

## Building an episode

```bash
cd <episode-folder>
npm install            # playwright + chromium, via postinstall (first time only)
./fetch-assets.sh      # pulls source images (and video) from Higgsfield
node render.js         # → out/slide-*.png
```

Episode A03 and all of Track C have one extra step, because their first
carousel slide is video:

```bash
node build-video-slide.js   # → out/slide-01-video.mp4
```

Track C also carries a caption check, because C01 shipped a draft that
miscounted its own character claim:

```bash
node check-caption.js       # measures the hook, fails if the claim drifted
```

Everything must run on a machine that can reach the Higgsfield CDN. Fonts ship
in each folder, so output is identical anywhere.

**Watch for `OVERFLOW` in the render output.** Slides clip with
`overflow:hidden`, so text that no longer fits is cut silently. `render.js`
measures for it and reports how many pixels over.

## Posting

Reel first, carousel 24–48h later. Reels pull roughly 1.36× the reach;
carousels win saves. The Reel buys attention, the carousel banks it.

Captions live in each folder's `caption.md`, with the Reel cutdown at the
bottom. Paste the prompt as plain text — image text isn't selectable, and a
copyable prompt is the biggest save driver in this format.

Log every post in [`POSTING-LOG.md`](POSTING-LOG.md) the day it goes out, and
the numbers a week later.

## Still to build

Episodes 04–12 of Track A are listed in `PLAYBOOK.md`. Don't build ahead —
four weeks of real numbers should decide what comes next.
