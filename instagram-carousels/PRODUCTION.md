# Production runbook

`PLAYBOOK.md` is the craft — voice, technique, why a slide looks the way it
does. **This file is the sequence**: what to run, in what order, and which
mistakes have already been paid for.

It exists because the expensive part of an episode was never the thinking. It
was re-deriving decisions that had already been made, re-rendering slides to
look at them, and re-generating media that only needed editing. All three are
avoidable and all three are written down below.

---

## Cold start

Paste this into a new session. It replaces roughly an hour of re-explaining.

> Building a new Instagram carousel for VaporSwift Media, in
> `instagram-carousels/`.
>
> Read `PLAYBOOK.md` and `PRODUCTION.md` first — voice rules, design tokens,
> verified model behaviour and the known traps are all in there. Don't
> re-derive them and don't read other episode folders unless you need a
> specific reference; the docs are the source of truth.
>
> Then scaffold with `./new-episode.sh <slug> <CODE>` and work inside that
> folder only.
>
> Episode brief: **[one paragraph — subject, track, and what the reader gets]**
>
> Constraints that always apply: 1080×1440, hook under 125 characters, the
> full prompt as plain text in the caption, no adversary in the voice, and
> every claim about a model verified the same day it goes on a slide.

Two things that prompt buys you:

- **It forbids the archaeology.** Without it a session reads five episode
  folders to infer the system. That is the single largest avoidable token cost
  in this project.
- **It states the constraints up front**, so they don't get discovered at
  render time when fixing them is a rewrite.

---

## The sequence

```bash
./new-episode.sh track-c-04-my-topic C04   # scaffolds the folder
cd track-c-04-my-topic
```

Then, in order:

1. **Write `caption.md` first.** The caption is the article; the slides are the
   trailer for it. Writing slides first produces decks that say things the
   caption then has to justify. `node check-caption.js` before you go further.
2. **Write `meta.json`** — title, description, two FAQ pairs. Question-shaped
   title; these pages are aimed at search and answer engines.
3. **Draft `slides.html`** against the geometry table below. Do not invent
   spacing — the numbers are known-good and iterating on them visually is the
   expensive path.
4. **Generate media, if any.** Read *Where the credits go* before spending.
5. `node render.js` — asserts size, overflow, and pin containment.
6. **Look at the output once.** Not once per change: see *Where the tokens go*.
7. `node ../content/build-content.js` — regenerates the site manifest.
8. Commit, push, update `POSTING-LOG.md` the day it goes out.

Steps 1, 2, 5, 7 all self-check. If one fails, fix the cause — the checks exist
because something shipped broken once.

---

## Where the credits go (Higgsfield)

Every rule here was bought with wasted credits.

**Preflight everything.** `get_cost` before any generation, always. A 28-second
3:4 master pass ran 182 credits; finding that out after submitting is how you
discover you had no budget for a retake.

**Approve stills before spending on video.** Trailer 01 spent ~30 credits on
casting and car stills to protect a ~195-credit video pass. Getting the subject
wrong inside the video means re-rolling the whole generation. Cheap gate, big
save — the full ladder is in `trailer-01-camelback/STORYBOARD.md`.

**Edit, don't re-generate.** There is a dedicated tool for almost every fix:
`upscale_image` / `upscale_video`, `outpaint_image` (extend a frame — keeps the
approved shot, unlike a re-roll), `reframe` (video aspect only), `video_edit`,
`video_extension`, `remove_background`. Re-prompting to fix one flaw pays full
price for everything that was already right.

**Reuse the openers.** Every Track C post shares one vapor-bed clip; only
`overlay.html` changes. Three episodes, one generation. That repetition is also
what makes a Track C post recognisable on sight — the saving and the branding
are the same decision.

**Never attempt watermark removal generatively.** It trips moderation, because
the filter can't see that you hold the rights. Rewording around it wastes more
attempts. The deterministic path costs nothing: locate the text band in
`sandbox_exec`, crop above it, verify zero residual pixels, re-upload.

**Decline the preset.** Higgsfield offers style presets on moody prompts. When
the reference technique *is* the lesson, a preset replaces it with a look
filter — pass `declined_preset_id`.

**Batch independent generations.** `generate_image_batch` / `generate_video_batch`
plus `jobs_wait`, then one `show_generation_by_ids`. Polling each job separately
burns tokens for no extra information.

**The sandbox reaches CDNs this environment can't.** `sandbox_exec` is the
read-and-verify path for anything visual when egress is blocked locally.

---

## Where the tokens go (Claude)

**Reading rendered slides is the dominant cost.** A 1080×1440 PNG is expensive
to look at, and the temptation is to look after every tweak. Don't. The
assertions in `render.js` — exact geometry, overflow on every clipping
container, pins inside their diagram — catch nearly everything a glance would.

Budget roughly **one visual pass per deck**, at the end, on the two or three
slides carrying real layout risk. Fix everything the assertions report first,
in one batch, then look.

**Measure in the browser, not by eye.** When layout is genuinely wrong, one
`page.evaluate` returning the boxes you care about answers it in a fraction of
what reading three screenshots costs — and gives a number instead of an
impression. This is how the head-collision bug in C02 was found.

**Don't read episode folders to learn the system.** `PLAYBOOK.md` and this file
are the source of truth. Read a specific episode only when you need a specific
reference from it.

**Batch the edits.** Six small fixes in one script beats six round trips.

---

## Known-good geometry

These are the shipped values. Starting from them means a deck lands first try
instead of after four render-and-look cycles.

| | Value |
|---|---|
| Canvas | 1080 × 1440 |
| Margins | side 88 · top 84 · bottom 150 (dots live in the bottom band) |
| `.card .head` | `margin-top:100px; margin-bottom:38px` |
| `.card.tight .head` | `margin-top:52px; margin-bottom:30px; flex:none` — for diagram and prompt slides. **52 is the floor**; less collides with the brand line at top 84 |
| `h2` | 60px / 1.05 / 600 |
| `.kicker` | 21px mono, `.2em` tracking |
| `.promptbox pre` | 27px when the slide has a headline and box; **32px / 1.5 when the box is the whole payload**. Ceiling ≈ 21 lines, longest line ≈ 37 characters |
| `.win` (diagram) | height 500 · titlebar 50 · rail 198 · panel 282 |
| `.pin` | 46px disc, sits **on** what it names — no leader rules |
| Legend row | 25px body, 17px sub-label |
| `.score` row | 32px question, 23px sub, 62px checkbox |

Two hard rules the numbers encode: **nothing legible below the bottom 150px**,
and **the swipe arrow sits below the content box**, never inside it.

---

## Reusable assets

Don't regenerate these.

| Asset | Where | Used by |
|---|---|---|
| Track C vapor bed | `track-c-*/fetch-assets.sh` (same CDN URL in each) | C01, C02, C03 — only `overlay.html` differs |
| Vendored fonts | `*/fonts/` — Inter Variable, JetBrains Mono | every deck; both SIL OFL |
| `render.js` | any episode folder | copy verbatim; it carries all the assertions |
| `check-caption.js` | any Track C folder | copy verbatim |
| Brand tokens | `../../brand/tokens.css` | the house palette, owned by the site session |

---

## Traps, and what each one cost

| Trap | Cost | Avoid by |
|---|---|---|
| `elementHandle.screenshot()` on a tall page | Two silently corrupt PNGs that passed every assertion | `render.js` isolates each slide and shoots the viewport. Two runs must be byte-identical |
| Claiming a character count without measuring | A post *about* character counts shipped wrong twice | `check-caption.js`. It also caught three shipped hooks at 131/139/153 |
| Trusting `models_explore` search | Reported Seedance 2.5 unavailable when it was live | Verify with `get_cost` or `action:get`, never by searching |
| Citing a model's capabilities from memory | A stale claim reached a finished slide | Re-check the model card the same day the claim goes on a slide |
| Generative watermark removal | A rejected generation, then a wasted reword | Deterministic crop in `sandbox_exec` |
| Hardcoded global npm paths in `render.js` | A broken run on the user's machine | Local-then-global resolution, `postinstall: playwright install chromium` |
| Assuming system fonts exist | Fallback faces on another machine | Fonts vendored per folder; verified by deleting the system copy |
| Adversarial CTAs | A full rewrite of every CTA in two episodes | The voice test in `PLAYBOOK.md`: does it work because it's *relevant*, or because it makes someone look foolish? |
| Prices and model names on slides | Would have dated C03 within weeks | Ship a test the reader runs, not a spec table |
| Episode N promising something Episode N+1 doesn't deliver | Continuity break between A02 and A03 | Only tease the next episode once it exists |

---

## Verifying a claim instead of eyeballing it

When a post's whole promise is a property of the media, measure it. Trailer 01
claims a locked camera, so the master was analysed rather than watched: sample
frames at 8fps, take the mean inter-frame pixel difference, flag spikes above
~3× the clip mean as cuts, compare per-segment averages against the clip mean.
Locked shots came in at 1.16–4.01 against a 5.54 mean; the one intentional move
climbed to 27.7. It catches drift before posting, and the numbers are better
caption material than an adjective.
