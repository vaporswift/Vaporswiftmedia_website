# Video Episode 01 — The shot you can't hire

Two Reels, one technique, two verticals. Real estate and product.

## The technique

**Stop describing the camera. Show it.**

Most people write paragraphs trying to specify a camera move, then re-roll until
something close comes out. Text is a terrible way to specify motion — "slow
push-in" has a hundred valid readings and the model picks one at random.

Instead, hand the model a `start_image` and an `end_image`. It only has to
invent the path between two fixed points. The composition is locked at both
ends, so the prompt shrinks to describing *motion* — and gets far more reliable
at the same time.

This is the same idea as `PRESERVE` in Episode 01 and the clay pass in Track B:
**give the model constraints as images, not adjectives.**

Both prompts below are five lines. That is the point, not a shortcut.

## Why these two shots

Pick shots that are *physically expensive or impossible*, not merely pretty. AI
video is a commodity when it's pretty; it's remarkable when it does something a
camera can't.

| | Shot | Why it lands |
|---|---|---|
| Real estate | Drone → through the front door → interior, unbroken | Needs an FPV pilot, a permit and many takes. The aspirational listing shot |
| Product | Wide → through the sapphire crystal → inside the movement | No macro rig on earth does this in one continuous take |

## Model

`seedance_2_0` — chosen over 2.5 specifically because **2.5 has no
`start_image` / `end_image` role**. 2.5 takes `image_references` only, which
guides style but does not pin the first and last frame. For this technique the
frame pinning *is* the technique.

| | |
|---|---|
| Model | `seedance_2_0` |
| Roles used | `start_image`, `end_image` |
| Duration | 8s (supports 4–15) |
| Resolution | 1080p, `mode: std` (4K also available in std) |
| Audio | `generate_audio: true` — native |
| Aspect | 9:16 |

## Frame prep

Both frames must share the output aspect ratio or the model crops them.

The real-estate start frame is the Episode 01 twilight hero, which was 3:4.
`outpaint_image` converted it to 9:16 — it *extends* the frame rather than
re-rolling it, so the approved shot survives intact. Note `reframe` is the
video-only equivalent; it will not accept a still.

The interior end frame was generated with the exterior passed as an image
reference, so the material palette carries across the cut.

## Shot 1 — Real estate

Start: twilight exterior (Ep 01 hero, outpainted to 9:16).
End: warm-lit interior of the same house.

```
One continuous flying shot, no cuts. The camera glides forward toward the
house, rises slightly, and passes through the open front door without
stopping — carrying straight on into the warm lit interior and settling on
the living space.

Smooth FPV drone motion, constant forward momentum, never pausing at the
threshold. Cool twilight light gives way to warm interior light as we cross
inside. Quiet evening ambience.

No people. No text.
```

The load-bearing phrase is **"never pausing at the threshold."** Without it the
model tends to treat the doorway as a cut point and you get two shots stitched
together instead of one continuous move — which kills the entire effect.

## Shot 2 — Product

Start: watch hero on slate.
End: extreme macro inside the movement.

```
One continuous shot, no cuts. The camera pushes slowly forward toward the
watch, then travels through the sapphire crystal and keeps going down into
the movement, ending among the gears.

Constant forward momentum, scale shrinking the whole way. Specular
highlights sweep across the crystal as we pass through it, then the light
becomes tight and raking on the metal inside. Soft mechanical ticking.

No people, no hands. No text.
```

**"Scale shrinking the whole way"** is what sells the impossibility. Without it
the model often cuts to the macro rather than travelling into it.

## Posting

Reels, 9:16, sound on. Native audio is generated — do not post silent, watch
time is the top Reels signal.

The start and end stills make a strong 3:4 carousel companion: frame one, frame
two, then the five-line prompt. It teaches faster than the video does, and the
video is what stops the scroll.
