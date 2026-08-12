# Trailer 01 — Paradise Valley

A 28-second luxury property trailer. Real assets: the client's subject
(headshot supplied) and a Paradise Valley estate (listing render supplied).
One car, one man, one unbroken dusk. 1080×1440 (3:4), hyper-real. Promo text
is added after generation — the edit leaves room for it.

## Camera grammar — five locked frames, one move

**The camera never moves until the last shot.** Beats 1–2 are rigid car-mount
rigs (static relative to the car), beats 3–5 are locked-off tripods, and beat 6
is the only camera movement in the film — the fast push to his back, cut to
black.

This is the luxury read: real estate and automotive films are shot on rigs and
sticks, so the stillness is what makes it feel *produced* rather than
generated. And a single move spent in a film full of held frames lands with
force no moving-camera piece can buy.

## Architecture: one generation, not six

One **30s Seedance 2.5 `omni_reference` pass**, six shots written into the
prompt, references pinning the cast. Consistency of man, car and house across
cuts is inherent — every cut comes from the same generation. 720p ceiling,
upscaled after. Fallback ladder: `video_edit` on the master take →
`video_extension` → per-shot regeneration, in that order.

## Phase 0 — asset intake (before anything generates)

| Asset | Media/job ID | Status |
|---|---|---|
| Subject headshot | `fd3d79ee-323b-42c8-8cd3-56b928849da9` | Uploaded. **200×200 px — small for an identity lock**; a higher-res original would tighten the face match |
| House render (clean) | `6aba65bf-58fd-4658-a45a-56ac7f53f3a3` | Watermark cropped (1365×956), verified zero residual, uploaded |
| House render (original) | `6cc35b1e-066c-4813-b4db-2eef740f2fab` | Keep as backup; do not use as a reference (carries the ARMLS text) |
| Casting still | `6371090c-cd11-4d7f-b11d-69ade9a87c9e` | **PICKED** (second candidate) |
| Car still | `a00d8ac1-785c-4ddb-a1c9-90be018c569c` | **PICKED** (second candidate) |
| Master pass | job `da16f0ca-2737-481c-aebc-65668f641599` | Submitted — 28s, 3:4, 720p, 182 credits. Prompt saved verbatim in `PROMPT.md` |

**Moderation note:** a generative "remove the watermark text" edit was rejected
by Higgsfield's filter (watermark-removal pattern — it can't see rights). Don't
re-word around it; the deterministic crop in the sandbox is the clean path:
locate the text band programmatically, crop above it, verify zero residual
white pixels, re-upload. Also verified: **the sandbox can reach both CDNs this
environment can't** — it is the read/verify path for everything visual.

The headshot is a chest-up shot in a henley; the film needs him full-length in
a suit. So Phase 1 makes a **casting still** — identity from the headshot,
wardrobe from the brief — which gets approved before it drives the video.

## Phase 1 — the cast sheet

### R1 — Casting still (from the supplied headshot)

`nano_banana_pro`, headshot as identity reference:

> Full-length editorial portrait of THIS MAN — exact same face, skin tone and
> head shape as the reference. Early-to-mid 30s, athletic build, warm confident
> presence. Sharply tailored midnight-navy suit, crisp white shirt open at the
> collar, no tie, polished dark-brown loafers, steel watch. Standing relaxed on
> stone paving at dusk, warm architectural lighting. Unretouched skin texture.
> Not looking at camera.

### R2 — The car

> Porsche 911 (992 generation), GT Silver Metallic, unbadged trim,
> three-quarter front on herringbone pavers at dusk. Fine desert dust film on
> the lower panels — driven, not showroom. Automotive editorial, 85mm, warm
> path-light reflections along the fender line.

Dust is the realism lever; a spotless car reads CGI. Unbadged because misdrawn
logos are the fastest hyper-realism killer — the silhouette says 911.

### R3 — The house (supplied)

The listing render, watermark cropped. For the prompt's own vocabulary: white
stucco with stacked-stone entry masses, dark standing-seam metal hip roofs,
black steel-framed glazing, tall stone chimney, herringbone-paved circular
motor court with low flowering borders and path lights, manicured lawn,
saguaros along the side wall, interior lights warm at dusk.

### R4 — The street

> Quiet Paradise Valley street at last light, long shadows over warm asphalt,
> low ranch walls, mature palo verde, Camelback Mountain's red silhouette at
> the end of the road. No cars, no people.

## Phase 2 — beat map (~28s)

| # | Time | Rig | Content | Sound |
|---|---|---|---|---|
| 1 | 0:00–0:03.5 | **Car mount**, low on the fender | Rear wheel rolling over warm asphalt, last sun flaring through the spokes, road sliding beneath a rigid frame | Tire on asphalt, low flat-six note |
| 2 | 0:03.5–0:07.5 | **Car mount**, cabin | Suit cuff and watch on the wheel, stripes of dusk light crossing the navy sleeve. Unhurried | Muted cabin, indicator tick |
| 3 | 0:07.5–0:13 | **Tripod**, street-side, locked | Frame holds empty a beat — the 911 enters left, glides through profile ~15ft away, exits right. Camelback behind | Engine swell past, then fading |
| 4 | 0:13–0:18 | **Tripod**, motor court, locked wide | Car turns in over the herringbone pavers, slows, settles. The house glows behind it | Tires on pavers, engine dies |
| 5 | 0:18–0:23 | **Tripod**, locked medium | He steps out in the fitted suit, closes the door with a soft thunk, walks between the path lights toward the stone-and-glass entry | Door thunk, footsteps, crickets |
| 6 | 0:23–0:28 | **The only move** | From behind him at the threshold: the camera accelerates hard at his back as he steps through the front door — CUT TO BLACK at contact | Footsteps swallowed; hard silence |

## Master prompt (draft)

```
A 28-second luxury property trailer in six connected shots, one continuous
dusk. Paradise Valley, Arizona, hyper-realistic. The SAME man (reference),
the SAME silver Porsche 911, and the SAME house (reference) in every shot.

THE CAMERA NEVER MOVES IN SHOTS 1–5. Shots 1–2 are rigid car-mounted rig
shots, locked to the car body. Shots 3–5 are locked-off tripod shots — the
frame is completely still and the subject moves through it. Shot 6 is the
only camera movement in the film.

SHOT 1 (3.5s) — car-mounted rig, low by the rear fender: the wheel rolling
over warm asphalt, last sunlight flaring through the spokes, the road
sliding beneath a perfectly rigid frame.

SHOT 2 (4s) — car-mounted rig inside the cabin: his hand on the wheel,
navy suit cuff and steel watch catching stripes of passing dusk light.
Unhurried.

SHOT 3 (5.5s) — locked-off tripod at the roadside: the frame holds still
and empty for a moment, then the silver 911 enters frame left and glides
through in full side profile about fifteen feet away, Camelback Mountain
red behind, and exits frame right. The camera does not follow it.

SHOT 4 (5s) — locked-off tripod, wide on the motor court: the car turns in
over herringbone pavers, slows, and settles to a stop. White stucco and
stacked stone, dark metal roofs, warm interior light through black-framed
glass, path lights on.

SHOT 5 (5s) — locked-off tripod, medium: he steps out in the tailored navy
suit, closes the door with a soft thunk, and walks without hurry between
the path lights toward the stone-and-glass front entry.

SHOT 6 (5s) — from behind him at the threshold: the camera accelerates
quickly toward his back as he steps through the open front door — CUT TO
BLACK exactly at the moment the camera reaches his back. The black holds.

LIGHT: one continuous dusk across all shots, deepening slightly; house
interior warm 2700K; path lights and landscape lighting on.

MEDIUM: anamorphic 35mm, cinematic grain, natural flare, luxury automotive
and architectural commercial language.

SOUND: low flat-six engine, tires on pavers, one soft door thunk, footsteps
on stone, evening crickets. No music, no voices.

NOT: no camera drift or handheld shake in shots 1–5, no pans, no zooms
before shot 6, no other people, no other cars, no on-screen text, no
invented logos or badges, no morphing between shots — every cut is clean.
```

## Finishing

1. Topaz upscale past the 720p cap → 1080×1440.
2. ffmpeg-extend the black tail 3–4s for the promo text — never buy end-card
   time from the generation.
3. Text composited from the brand tokens (`build-video-slide.js` pipeline works
   unchanged). Bottom 150px stays clear.

## Budget

~440 credits total: stills ~30, master pass ~195, one retake in reserve ~195,
upscale ~20. Preflight the master with `get_cost` before submitting.

## Risks

- **Static frames are their own test** — video models like to drift. The NOT
  block bans it explicitly; if shots 1–5 breathe, that's the first `video_edit`
  target.
- **Shot 3's empty-frame beat** (car enters a held frame) is the most
  distinctive and most fragile instruction. If the model tracks the car
  instead, retake before editing — it's the shot that sells the grammar.
- **Beat 6's cut at contact** — if the model eases through the door, edit the
  tail.
- **The supplied render is a listing image (ARMLS).** Crop the watermark before
  reference use, and confirm rights to use the property imagery in a promo.

## Confirmed / outstanding

- ✅ Subject: supplied headshot. Suit: fitted navy assumed — say the word for
  charcoal/black.
- ✅ House: supplied Paradise Valley render.
- ✅ Camera: locked until the final move.
- ⬜ Car: unbadged GT Silver 992 still assumed — one word to change colour.
- ⬜ Uploads: headshot + cropped render into Higgsfield (widget) before Phase 1.
