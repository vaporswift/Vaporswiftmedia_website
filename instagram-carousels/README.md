# Vaporswift — Instagram content kits

Two tracks, one design system. Every slide is 1080×1440 (3:4) so it fills the
feed and matches the profile grid with no crop.

| Track | Subject | Format |
|---|---|---|
| **A** | AI prompting for real estate | Carousel |
| **B** | AI prompting, everything else | Reel (+ optional carousel) |

---

## POST 1 — Track A, Episode 01: Render → Photo

**Format:** 8-slide carousel, 1080×1440
**Folder:** `episode-01-render-to-photo/`

### To produce it

```bash
cd episode-01-render-to-photo
npm install            # playwright + chromium, via postinstall (first time only)
./fetch-assets.sh      # pulls the 5 source images from Higgsfield
node render.js         # → out/slide-01.png … slide-08.png
```

Run this on your own machine — the environment these were built in can't reach
the Higgsfield CDN.

Fonts (Inter, JetBrains Mono) ship in `fonts/` and load via `@font-face`, so
nothing needs installing system-wide and the output is identical on any
machine.

### Slide map

| # | Content |
|---|---|
| 1 | The twilight result, full bleed + BEFORE inset. Hook |
| 2 | The raw SketchUp render. Second-serve cover |
| 3 | Prompt, part 1 — PRESERVE / CAMERA / LIGHT |
| 4 | Prompt, part 2 — MATERIAL / ATMOSPHERE / MEDIUM / NOT |
| 5 | Anatomy — the seven slots |
| 6 | The one lever — three lighting swaps |
| 7 | Spec receipts |
| 8 | CTA |

Caption is in `episode-01-render-to-photo/caption.md`. Paste the prompt as plain
text — image text isn't selectable, and a copyable prompt is the biggest save
driver in this format.

---

## POST 2 — Track B, Episode 01: Clay → Photoreal

**Format:** Reel, 9:16, 10s, 1080p, sound on
**Folder:** `track-b-01-clay-to-photoreal/`

### Status: ready to post

The video is finished. Download the upscaled 1080p file from Higgsfield and
post it — nothing to assemble.

Built with Seedance 2.5 `omni_reference`: a grey clay render carries structure,
a photoreal plate carries material and light, and the prompt assigns each
reference its job. Full recipe in `RECIPE.md`, caption in `caption.md`.

**Post with sound on.** The native audio (bar tone, ice settle) is generated —
watch time is the top Reels signal and silent video gives it away.

---

## Posting order

Lead with **Post 1** — the real estate carousel is the conversion asset and
sets the format. Give it 24–48h, then **Post 2** as the Reel; Reels pull
roughly 1.36× the reach of carousels and will feed profile visits back to the
carousel.

Track the four numbers that matter: saves ÷ reach, sends ÷ reach, swipe-through
to the final slide, follows ÷ reach. Hold the format for four weeks before
changing anything.

---

## Reusing the system

`episode-01-render-to-photo/slides.html` is the template for every future
carousel. Two masters (`.photo`, `.card`) and the tokens in `:root` never
change — swap the copy and the asset files.

`slides-hosted.html` is the same deck with Higgsfield CDN URLs instead of local
paths, for tools that fetch images server-side.
