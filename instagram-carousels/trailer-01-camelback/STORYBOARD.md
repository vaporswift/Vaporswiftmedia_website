# Trailer 01 — Camelback

A 28-second luxury property trailer. Scottsdale desert contemporary near
Camelback Mountain, one character, one car, one unbroken mood. 1080×1440 (3:4),
hyper-real, measured pace. Promo text is added after generation — the edit
leaves room for it.

---

## Architecture: one generation, not six

The whole trailer is **a single 30s Seedance 2.5 `omni_reference` pass** with
multi-shot structure written into the prompt, plus reference stills pinning the
cast. Not six clips stitched together.

Why this is the right call and not just the easy one:

- **Consistency is inherent.** The same man, the same car, the same house in
  every cut, because every cut comes out of one generation. Shot-stitching
  makes consistency a per-shot battle; one pass makes it free.
- 2.5's flagship capability is exactly this — logically connected shots with
  setup, development and resolution inside one take.
- Native 3:4 at 4–30s, native audio. Verified against the account, not docs.

The cost of this choice: **720p ceiling** (upscale after — see Finishing), and
less per-shot control. The fallback if any beat misbehaves is `video_edit` /
`video_extension` on the master take before resorting to per-shot regeneration.

## Phase 1 — the cast sheet (stills before any video)

Four reference stills, `nano_banana_pro`, 3:4, 2k. These are the contract the
video has to honour — approve them **before** spending on the 30s pass.

### R1 — The character

Run through the `character-sheet` workflow at generation time. Brief:

> Man in his early 40s, relaxed confidence, olive skin, short dark hair with
> grey at the temples, two-day stubble. Unstructured sand-coloured linen blazer
> over a white tee, dark tapered trousers, suede loafers, no socks. Vintage
> steel watch. Unretouched realism — visible pores, sun creases at the eyes.
> Never looks at camera.

### R2 — The car

> Porsche 911 (992 generation) in GT Silver Metallic, unbadged trim, staged
> three-quarter front on warm asphalt at golden hour. Slight desert dust film
> on the lower panels — driven, not showroom. Photoreal automotive editorial,
> 85mm, low sun flaring across the fender line.

Dust on the paint is the realism lever — a spotless car reads CGI.

### R3 — The house

> Desert contemporary single-story near Camelback Mountain: rammed-earth and
> board-formed concrete walls, deep bronze-framed glazing, flat overhanging
> roof planes, a floating walkway over decomposed granite to a monumental
> pivot front door in blackened steel. Saguaro and golden barrel cactus,
> mature palo verde. Camelback's red sandstone silhouette behind, dusk sky.
> Warm interior light already on. 24mm tilt-shift, verticals corrected.

*(Option: reuse the Episode 01 twilight house for account continuity — but its
architecture isn't desert-specific, and "near Camelback" is the brief. New
build recommended.)*

### R4 — The street

> Quiet Paradise Valley street at golden hour, long shadows across warm
> asphalt, low ranch walls, palo verde and saguaro, Camelback rising at the
> end of the road. Heat shimmer at the far vanishing point. No cars, no
> people.

## Phase 2 — the beat map (~28s)

Measured, not fast. Six beats, average ~4.7s — long for social, correct for
luxury.

| # | Time | Shot | Content | Sound |
|---|---|---|---|---|
| 1 | 0:00–0:03.5 | ECU, low | Rear wheel rolling slowly over warm asphalt, low sun flaring through the spokes, heat shimmer | Tire on asphalt, low engine note |
| 2 | 0:03.5–0:07.5 | ECU, interior | Hand on the wheel, watch catching stripes of passing light, unhurried | Muted cabin, indicator tick |
| 3 | 0:07.5–0:13 | **Side profile, ~15ft, tracking** | Camera travels parallel at car-door height, the 911 gliding past low walls and palo verde, Camelback behind | Engine swell, wind |
| 4 | 0:13–0:18 | Wide, static | Car turns into the driveway, slows, settles to a stop. Dusk deepening, interior lights of the house warm | Gravel crunch, engine dies |
| 5 | 0:18–0:23 | Medium, static | He steps out without hurry, door closes with a soft thunk, walks the floating path | Door thunk, footsteps on stone, crickets |
| 6 | 0:23–0:28 | **Behind him, accelerating** | Camera rushes toward his back as he crosses the threshold — and cuts to black at the moment of contact | Footsteps swallowed by interior; hard silence at the cut |

Beat 6 is the Episode 03 lesson applied in reverse: there the phrase was
*"never pausing at the threshold"* to force continuity — here the cut **is**
the threshold, so the prompt says the black happens *at contact with his back*,
not after entering. That's what makes the ending feel authored.

## The master prompt (draft — to run in Phase 2)

```
A 28-second luxury property trailer in six connected shots, one continuous
mood. Golden hour deepening into dusk, Scottsdale desert, hyper-realistic.
The SAME man, the SAME silver Porsche 911, and the SAME house as the
reference images, in every shot.

SHOT 1 (3.5s) — extreme close-up, low to the road: the rear wheel of the
silver 911 rolling slowly over warm asphalt, low sun flaring through the
spokes, heat shimmer rising.

SHOT 2 (4s) — extreme close-up inside the cabin: his hand relaxed on the
wheel, vintage steel watch catching stripes of passing golden light.
Unhurried.

SHOT 3 (5.5s) — exterior side profile, camera fifteen feet away at
door-panel height, tracking parallel: the 911 glides past low ranch walls
and palo verde trees, Camelback Mountain red in the background.

SHOT 4 (5s) — wide and static: the car turns into the driveway of the
desert contemporary house, slows, settles to a stop. Dusk. The interior
lights of the house glow warm through bronze-framed glass.

SHOT 5 (5s) — medium, static: he steps out quietly, closes the door with a
soft thunk, and walks the floating stone path toward the monumental pivot
door. No hurry.

SHOT 6 (5s) — from behind him at the doorway: the camera accelerates
quickly toward his back as he steps through the open front door — CUT TO
BLACK exactly at the moment the camera reaches him. The black holds.

LIGHT: one continuous golden-hour-into-dusk progression across all six
shots. Warm key sinking lower each shot; the house interior 2700K.

MEDIUM: anamorphic 35mm, shallow focus in close-ups, cinematic grain,
natural lens flare, luxury automotive and architectural commercial language.

SOUND: low engine note, tire on asphalt, gravel, one soft door thunk,
footsteps on stone, evening crickets. No music, no voices.

NOT: no people other than the driver, no other cars, no text, no logos
invented on screen, no camera shake, no fast cutting, no morphing between
shots — each cut is clean.
```

References attached: R1 (character), R2 (car), R3 (house), R4 (street) as
`image_references`.

## Finishing

1. **Upscale** — 2.5 caps at 720p; Topaz to 1080p → 1080×1440. Non-optional.
2. **Extend the black** — don't buy end-card time from the generation. The cut
   to black is the last frame; hold it with ffmpeg for as long as the promo
   text needs (3–4s), at zero cost.
3. **Text** — added after generation. The composite pipeline from
   `episode-03-impossible-walkthrough/build-video-slide.js` works unchanged:
   transparent 1080×1440 plate from the brand tokens, ffmpeg overlay. Beats 1–2
   hold their upper third clear and the black tail is fully yours; keep type
   out of the bottom 150px per the safe-zone rule.

## Budget

| Item | Est. credits |
|---|---|
| 4 reference stills (+1 retry each) | ~30 |
| 30s master pass @ 720p | ~195 |
| One full retake in reserve | ~195 |
| Topaz upscale | ~20 |
| **Plan total** | **~440** |

Preflight the master with `get_cost` before submitting — the 195 figure is
extrapolated from a 32.5-credit 5s preflight.

## Risks

- **Six shots in one pass is the model's advertised edge, not a guarantee.**
  If it merges beats or drops one, first try `video_edit` on the master take;
  regenerate per-shot only if editing fails. Beats 3→4→5 (car → house → man)
  carry the most continuity load.
- **The Porsche.** The model will approximate badging, and misdrawn logos are
  the fastest hyper-realism killer — hence "unbadged trim" in R2 and "no logos
  invented on screen" in the master. Silhouette says 911 without a crest.
  (Also the safer commercial choice for a promo.)
- **Faces in motion.** He never addresses camera and beat 6 is his back —
  the design keeps the face small or absent everywhere except beat 5. That's
  deliberate; don't add a close-up of his face when tempted.
- **Watch beat 6.** "Cut to black at contact" is the most fragile instruction;
  if the model eases through the door instead, `video_edit` the tail.

## Assumptions to confirm before Phase 1

1. Character: man, early 40s, linen-casual (above). Say the word to recast.
2. Car: 992-era 911, GT Silver, unbadged. Colour is one word to change.
3. House: new desert contemporary, not the Episode 01 house.
4. Dusk arc (golden hour → twilight), matching the account's aesthetic.
