# Playbook

Everything learned building the first five episodes. Read before starting a new
one — most of it was expensive to find out.

---

## Voice and positioning

This posts to **VaporSwift Media** — a content and production agency (Scottsdale,
since 2015): video, audio, podcast, content strategy, across health and
wellness, product, brand, events and real estate.

The account speaks to **anyone who could save time or money with these tools.**
Not to a job title. An agent, a founder, a marketer, someone doing it
themselves — if they have the problem, the post is for them.

Rules, in order of how easy they are to break:

- **No adversary.** Never frame anyone as the sucker. Copy like "send this to
  the agent still paying $400 a render" was in the first draft of every episode
  and it is wrong twice: it punches at a reader, and it mocks the exact person
  who might hire VaporSwift.
- **Don't undercut the service.** The message is *here's what's possible now*,
  never *don't hire anyone*. Some readers will do it themselves and some will
  hire us. Both are good outcomes; the copy shouldn't push either.
- **Assume no job title.** "Your next vacant listing" excludes most of the
  audience. "The next empty room you photograph" doesn't.
- **Generous by default.** The whole recipe, free, every time — same ethos as
  `premiere-caption-kit/` in this repo: *"you don't need to buy any of it. You
  need it set up once."*
- **Specific over clever.** The named lever beats the punchline. "Wet ground
  buys you reflections" earns more saves than any joke.
- **Cost and time saved is the value** — state it plainly, without a villain.
  "Physical staging costs thousands and takes a week to book" is fine.
  "Stagers charge thousands for this" is not.

The CTA test: does it work because it's *relevant* to someone, or because it
makes someone else look foolish? Only the first kind ships.

---

## The through-line

**Give the model constraints as images, not adjectives.**

Every episode is a variation on this. It's why the content coheres rather than
being five unrelated tricks:

| Episode | The constraint | Carried by |
|---|---|---|
| A01 | Don't redesign the building | `PRESERVE` clause |
| A02 | Don't repaint the room | `ONLY ADD FURNISHINGS` |
| A03 | This camera path, not another | `start_image` + `end_image` |
| B01 | This blocking, that material | clay pass + look plate |
| B02 | This camera path, not another | `start_image` + `end_image` |

Adjectives are ambiguous; images aren't. When a prompt is fighting you, ask
what could be handed over as a picture instead.

---

## Technique 1 — the seven-slot prompt (stills)

Same order every time:

```
[PRESERVE]  lock geometry, proportions, camera position
[CAMERA]    body, lens, height, exposure
[LIGHT]     time of day, direction, colour temperature
[MATERIAL]  two or three named real finishes
[ATMOSPHERE] weather, wear, signs of life
[MEDIUM]    publication and film language, not software
[NOT]       name the failure modes out loud
```

What actually moves the needle:

- **PRESERVE is the one everybody skips.** Without it the model redesigns the
  subject you were hired to sell.
- **"Verticals perfectly corrected"** is the real signature of architectural
  photography. AI defaults to converging lines, which reads as amateur.
- **Wet ground buys reflections.** Reflections are physics, and physics is what
  the eye reads as real.
- **Name real finishes.** "Wood" gives plastic; "white oak with grain variation
  board to board" gives wood.
- **"Perfect" is the enemy.** Realism lives in grain, vignette, uneven light,
  slightly overgrown planting.

### Interiors add two more

- **Light consistency is the whole game.** Staged furniture gets spotted
  because it's lit from a window the room doesn't have. Name the window wall
  and the shadow direction.
- **Contact shadows seat the furniture.** Without ambient occlusion where legs
  meet floor, everything floats and the frame reads as a collage.

---

## Technique 2 — two references, two jobs (B01)

Split structure from look across two reference images, then tell the model
which reference owns which job.

- Reference 1: a clay/untextured pass → camera, blocking, motion paths.
- Reference 2: a photo → material, lighting, colour, reflections.

Two clauses this depends on:

- In the clay prompt: **"the glass and ice are solid opaque grey clay, not
  glass."** Otherwise you get real glass and there is no clay pass.
- In the video prompt: **"no clay or grey untextured surfaces in the output."**
  Feed clay as a reference and the model wants to keep some.

---

## Technique 3 — start and end frames (A03, B02)

**Stop describing the camera. Show it.**

Text is a terrible way to specify motion — "slow push-in" has a hundred valid
readings and the model picks one. Pin `start_image` and `end_image` and the
model only invents the path between two fixed points. Composition locks at both
ends and the prompt shrinks to describing motion. Both shipped prompts are five
or six lines, and that's the technique, not a shortcut.

**Pick shots that are expensive or impossible, not merely pretty.** Pretty AI
video is a commodity. Impossible isn't.

Phrases that carry the shot — each stops the model turning a continuous move
into a cut:

- **"never pausing at the threshold"** (flying through a doorway)
- **"scale shrinking the whole way"** (travelling into a small object)

Frame prep: both frames must match the output aspect or they get cropped.

---

## Technique 4 — hold the frame (still → motion)

One photo in, the same photo alive. The most accessible technique on the
account: it needs nothing but a picture that already exists.

It lives or dies on the frame holding. If the animated version drifts —
recomposes, invents an object, moves the camera — the comparison collapses into
two different pictures, and *same photo* was the entire claim.

So don't describe motion. Pin the frame, then name the short list permitted to
move:

```
HOLD THE FRAME. The camera does not move at all — locked off on a tripod.
This is a still photograph that has come alive, not a new shot.

ONLY THESE THINGS MOVE:
[four or five things, no more]

Everything else is completely static.

NOT: no camera movement, no pan, no zoom, no reframing, no new objects.
```

**Asking for "subtle motion" does not work** — subtlety isn't something a model
can measure. An explicit permit-list is.

Choose **ambient motion, not narrative**: cloud, water, reflections, foliage,
steam, light. Soft edges and no focal point. Avoid faces and hands; they pull
the eye to whatever is most likely to break.

5s is enough — longer and the loop becomes obvious.

`format-still-to-motion/build-comparison.js` freezes the clip's own first frame
rather than the source still, so drift surfaces in the build instead of after
posting.

---

## Model notes (verified, not from docs)

- **`seedance_2_5` does not appear in `models_explore` search.** Only 1.5 Pro,
  2.0 and 2.0 Mini come back. The model is live — confirm with a `get_cost`
  preflight or `action: get`, never by searching.
- **Seedance 2.5's capabilities changed under us — re-verify before citing.**
  When Episode 03 was built, 2.5 exposed `image_references` only; the model
  card now lists `start_image` / `end_image` plus `video_edit` and
  `video_extension` modes, and 3:4 natively at 4–30s. Episode 03's "2.5 can't
  pin frames" claim (slide 7 + caption) is stale — soften before posting.
  General rule: model cards move; check `models_explore action:get` the same
  day you make a claim on a slide.
- **Seedance 2.5 caps at 720p** (up to 30s, native audio). Always
  `upscale_video` before posting.
- **For one-take multi-shot pieces (trailers), prefer one 2.5 pass over
  stitching.** Character/car/location consistency across cuts is inherent when
  every cut comes from one generation. See `trailer-01-camelback/STORYBOARD.md`.
- **Seedance 2.0**: `start_image` + `end_image`, 4–15s, up to 4K in `mode: std`.
- **`reframe` is video-only.** For stills use `outpaint_image` — it extends the
  frame rather than re-rolling it, so an approved shot survives.
- **Higgsfield suggests style presets** on moody prompts. Decline with
  `declined_preset_id` when the reference technique is the point — a preset
  replaces it with a look filter.
- **A `nano_banana_pro` request may be served by `nano_banana_2`.** Check the
  returned `model` field if it matters.
- **The Higgsfield CDN can be blocked by corporate egress.** Build on a machine
  that can reach it; `fetch-assets.sh` in each folder does the download.

---

## Design system

Canvas **1080×1440 (3:4)** — uncropped in feed and grid. Every slide in a
carousel must share the ratio.

Four masters, no more:

| Master | Use |
|---|---|
| `.photo` | full-bleed image + scrim + overlay type |
| `.card` | dark ground, typographic |
| `.frames` | two 9:16 inputs side by side, labelled |
| `.pull` | one statement, for the phrase a shot depends on |

Tokens live in `:root`. Two accents with fixed roles: **orange
(`--accent`)** carries structure — labels, kickers, rules; **forest green
(`--accent2`)** carries emphasis — headline highlights, key prompt phrases.
Keeping those separate is what lets a prompt slide distinguish a section header
from the line that matters.

Rules worth not relearning:

- **Keep critical content out of the bottom 150px.** Carousel dots sit there.
- **The swipe arrow sits below the content box**, not inside it, or it collides
  with the last line on dense slides.
- **Slide 2 must hook cold** — it's the second-serve cover.
- **Watch for `OVERFLOW`.** Slides clip silently; `render.js` asserts on it.
- Type resolves to SF Pro / SF Mono, with Inter and JetBrains Mono vendored per
  folder as fallback. Metrics differ, hence the overflow check.

---

## Caption structure

1. **One sentence** that hooks *and* pivots to the method. It has to land
   before Instagram's ~125-character truncation.
2. **"Here's how."**
3. The mechanism, briefly.
4. **The full prompt as plain text** — this is the save driver.
5. The line doing the heavy lifting, called out.
6. Why it beats the obvious alternative. *Below* the prompt — it justifies the
   technique rather than introducing it.
7. Transferability: what to swap.
8. Save → send → next episode.
9. Disclosure where the work touches a real listing.

Ask for the send explicitly. Sends-per-reach is a top-three signal and almost
nobody asks.

---

## Track A slate

01 render → photo · 02 empty → staged · 03 drone through the door ·
04 daylight → golden hour · 05 floor plan → 3D · 06 facade renovation ·
07 one kitchen three finishes · 08 season swap · 09 believable people ·
10 aerial → site plan · 11 the six AI tells · 12 detail and upscale pass

**Episode 11 is the best save-magnet** — consider promoting it once the format
is proven.

## Compliance

Altered listing imagery and virtual staging must be disclosed under MLS and NAR
rules. Say it on-slide, and never alter the room itself — furniture only. For
an audience of agents, being the account that says this out loud is worth more
than the slide costs.
