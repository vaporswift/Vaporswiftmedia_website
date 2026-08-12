# Episode 01 — Render → Photo

Instagram carousel kit. 8 slides, 1080×1440 (3:4).

## Why 3:4 and not 4:5

Instagram's profile grid previews at 3:4, and native 3:4 photo support covers
carousels — a 3:4 upload renders uncropped in both feed and grid. Most sizing
guides still say 4:5/1080×1350 is the ceiling; that's pre-2025 guidance.

Two things to respect:

- **Every slide must share the ratio.** Mixed ratios force a crop.
- **Keep critical content out of the bottom 150px** (`--BOT`). Carousel dots
  and UI chrome sit there. Some third-party schedulers also still enforce the
  old 1350 cap and will silently downscale — posting natively avoids it.

## Build

```bash
node render.js        # → out/slide-01.png … slide-08.png
```

Renders each `.slide` in `slides.html` at exactly 1080×1440 and fails loudly
if any element isn't that size.

Fonts: Inter Variable + JetBrains Mono, installed to `~/.local/share/fonts`.

## Assets

Drop these into `assets/` before rendering. Slides fall back to labelled
placeholders when a file is missing, so the layout is always inspectable.

| File | What it is |
|---|---|
| `before.png` | The raw draft render (slide 1 inset + slide 2 full bleed) |
| `after.png` | The twilight realism pass (slide 1 hero) |
| `lever-twilight.png` | Same as `after.png` |
| `lever-golden.png` | Golden-hour variant |
| `lever-overcast.png` | Bright-overcast variant |

## Slide map

| # | Master | Job |
|---|---|---|
| 1 | photo | Hero (after) + before inset. Scroll-stop |
| 2 | photo | The before. Doubles as the second-serve cover |
| 3 | card | Prompt, part 1 — PRESERVE / CAMERA / LIGHT |
| 4 | card | Prompt, part 2 — MATERIAL / ATMOSPHERE / MEDIUM / NOT |
| 5 | card | Anatomy — the seven slots and why each earns its place |
| 6 | card | The one lever — same house, three lighting swaps |
| 7 | card | Spec receipts |
| 8 | card | CTA — save, send, follow |

Slide 2 matters more than it looks: Instagram re-serves carousels to people who
scrolled past, using a later slide as the cover. It has to hook cold.

## Reusing for episodes 02–12

`slides.html` is the template. Swap the copy and the five asset files; the two
masters (`.photo`, `.card`) and the design tokens in `:root` don't change.

## Design tokens

Anthropic's palette on a forest-cast ground, with **two accents**: orange
carries structure, green carries emphasis. Keeping those roles separate is what
lets a prompt slide distinguish a section header from the line that matters.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0E1311` | forest-cast near-black, slide ground |
| `--card` | `#141B17` | prompt block / thumbnail ground |
| `--paper` | `#faf9f5` | Anthropic light |
| `--accent` | `#d97757` | Anthropic orange — labels, kickers, rules |
| `--accent2` | `#8FA97A` | forest green — headline highlights, key phrases |
| `--muted` | `#9AA394` | captions, spec keys |
| `--body` | `#CBC9C1` | secondary body text |
| `--code` | `#D9D7CF` | prompt block text |
| `--neg` | `#A8756A` | the NOT clause |
| `--M` / `--TOP` / `--BOT` | 88 / 84 / 150 px | margins + safe zone |

Type resolves to SF Pro / SF Mono on macOS, falling back to the bundled Inter
and JetBrains Mono elsewhere. `render.js` asserts on overflow as well as canvas
size, so a font-metric change clips loudly instead of silently.

`../brand-preview/preview.js` renders candidate palettes against this deck
without editing it — use it before changing any token here.
