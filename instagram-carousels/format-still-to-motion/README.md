# Format — Still → Motion

A third format alongside the carousel and the impossible-shot Reel. Show a
photograph, then show the same photograph alive.

## Why it earns a slot

The other two formats need something to start from — a draft render, two
planned frames, a clay pass. **This one needs a photo you already have**, which
makes it the most broadly useful thing on the account. Anyone with a camera roll
can act on it the same day.

It also demos differently. Start/end frames impress people who already think
about camera moves. A still coming alive lands on everyone, because everyone
knows what a photograph is supposed to do.

## The one thing that makes or breaks it

**The frame has to hold.**

If the animated version drifts — recomposes, invents an object, moves the
camera — the comparison collapses and you are just showing two different
pictures. The whole claim is *same photo*.

So the prompt is built inside-out from that constraint. Instead of describing
motion, you name the small set of things allowed to move and pin everything
else:

```
HOLD THE FRAME. The camera does not move at all — locked off on a tripod.
The composition, framing and every element stay exactly where they are.
This is a still photograph that has come alive, not a new shot.

ONLY THESE THINGS MOVE:
[the short list — clouds, water, foliage, steam, light]

Everything else is completely static.

Subtle, restrained, slow.

NOT: no camera movement, no push-in, no pan, no zoom, no reframing,
no new objects, no people, no text.
```

Same family as `PRESERVE` and `ONLY ADD FURNISHINGS` — constrain, then permit a
named few things. Listing what may move is far more reliable than asking for
"subtle motion", because subtlety is not a thing a model can measure.

## What to animate

Pick motion that is **ambient, not narrative** — it should look like the world
continuing, not like something happening:

| Good | Why |
|---|---|
| Drifting cloud, shifting light | Slow, no focal point, reads as time passing |
| Water, reflections, condensation | Physics the eye trusts |
| Foliage, grass, fabric in a breeze | Small amplitude, hard to get wrong |
| Steam, haze, dust in light | Soft edges hide model error |

Avoid anything with a face, hands, or a beginning-middle-end. It draws the eye
straight to the part most likely to break.

## Build

```bash
npm install
./fetch-assets.sh          # or drop your own clip at assets/motion.mp4
node build-comparison.js   # → out/still-to-motion.mp4
```

The builder freezes **frame 1 of the clip itself**, holds it 1.6s under "the
photo you already have", then plays the clip under "one prompt later". Using the
clip's own first frame rather than the source still guarantees the two halves
are genuinely the same picture — if the model drifted, you will see it here
rather than after posting.

Audio carries through from the clip; if the source is silent the builder
detects it and falls back rather than failing.

Point it at any clip:

```bash
node build-comparison.js path/to/other.mp4
```

## Posting

Works as a Reel or as carousel slide 1. As a Reel it needs no caption to be
understood, which is rare and worth using — the hook is visual and lands with
sound off.

Caption still carries the full prompt. The format is the hook; the prompt is
the save.
