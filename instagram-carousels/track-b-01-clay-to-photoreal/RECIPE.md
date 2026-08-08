# Track B, Episode 01 — Clay → Photoreal

Non-real-estate version of the Episode 01 teaching format, built on Seedance 2.5's
`omni_reference` mode. Subject: food & beverage (whiskey serve).

This mimics ByteDance's own Seedance 2.5 demo structure — a textureless clay pass
locks camera, blocking and motion paths; reference images supply material,
lighting, colour and reflections. Their published example is a car assembly
sequence; this is the same technique on a cocktail.

## Why this is the right non-real-estate analogue

It's the same lever as Episode 01 — *structure in one input, realism in another* —
so the teaching framework transfers intact. Glass, liquid, ice and condensation
are the hardest material set in commercial work, which makes the payoff obvious
at a glance.

## Model facts (verified against the account, not the docs)

| | |
|---|---|
| Model | `seedance_2_5` |
| Mode | `omni_reference` |
| Duration | 4–30s |
| Resolution | **480p / 720p only** — no 1080p, no 4K |
| Audio | `generate_audio` native |
| Reference roles | `image_references`, `video_references`, `audio_references` |
| Aspect | auto, 21:9, 16:9, 4:3, 1:1, 3:4, 9:16 |
| Cost | 32.5 credits @ 5s 9:16 |

Two gotchas:

- **`seedance_2_5` does not appear in `models_explore` search results.** Only 1.5
  Pro, 2.0 and 2.0 Mini come back. The model is live regardless — confirm with a
  `get_cost` preflight or `models_explore action:get`, not search.
- **No `start_image` / `end_image` role.** Unlike Seedance 2.0, structure is
  carried by `image_references` plus an explicit prompt instruction, not a start
  frame.
- 720p ceiling means anything destined for a feed wants `upscale_video` after.

## Step 1 — the clay pass

`nano_banana_pro`, 9:16, 2k.

```
Untextured clay render / matte grey 3D previsualization of a cocktail scene,
vertical composition. A heavy-bottomed rocks glass sits on a bar counter with a
single large cube of ice inside and a citrus twist resting on the rim. Behind it,
slightly further back, a spirits bottle and a bar spoon. A small dish of garnish
to one side.

EVERYTHING is uniform matte grey modelling clay: no textures, no colour, no
labels, no branding, no transparency. The glass and ice are solid opaque grey
clay, not glass. Neutral even studio lighting, soft ambient occlusion in the
contact shadows, smooth subdivided polygon surfaces.

Three-quarter view, camera at counter height, mild shallow depth of field.
Classic clay-render turntable / modelling pass look. No text. No people.
```

The line that matters: **"the glass and ice are solid opaque grey clay, not
glass."** Without it the model renders real glass and you've lost the clay pass.

## Step 2 — the material plate

`nano_banana_pro`, 9:16, 2k. This carries no geometry — only look.

```
Photoreal material and lighting reference plate for a premium spirits commercial,
vertical. Moody low-key bar interior at night. A cut-crystal rocks glass holding
amber whiskey over one large clear hand-cut ice cube, heavy condensation beading
down the glass, a curl of orange peel. Warm 2700K practical light from the left
raking across the liquid so the amber glows, deep specular highlights in the
crystal facets, a cool blue rim light from behind separating the glass from a
dark walnut bar top.

Rich reflections in the polished counter. Shallow depth of field, 100mm macro,
f/2.8. Shot on Arri Alexa, commercial beverage photography, Campari and Diageo
advertising language.

Subtle sensor grain, natural chromatic aberration. No text, no labels, no
branding, no people.
```

## Step 3 — the omni_reference pass

`seedance_2_5`, `mode: omni_reference`, 10s, 720p, 9:16, audio on.
Both stills passed as `image_references`, clay first.

```
STRUCTURE REFERENCE (the grey clay render): use it strictly for spatial
structure. Lock the camera angle, composition, shot scale, and the exact position
and proportion of the glass, the ice cube, the bottle behind, the bar spoon and
the garnish dish. Do not rearrange the layout. Do not redesign the objects.

MATERIAL REFERENCE (the photoreal plate): take material, lighting, colour and
reflections from it. Cut-crystal rocks glass. Amber whiskey. One large clear
hand-cut ice cube. Heavy condensation. Warm 2700K key light raking from the left,
cool blue rim light from behind, polished dark walnut counter with rich
reflections.

Render the clay scene as a photoreal premium spirits commercial. Slow continuous
push-in on the rocks glass across the full 10 seconds, camera drifting gently
left to right so specular highlights travel across the crystal facets and the
amber liquid glows as the key light rakes through it. Condensation beads slide
down the outside of the glass. The ice settles a fraction with a soft clink.
Ambient low bar-room tone.

100mm macro, f/2.8, shallow depth of field, Arri Alexa, subtle film grain.

NOT: no text, no labels, no branding, no people, no hands, no clay or grey
untextured surfaces in the output.
```

The last NOT clause is load-bearing. Passing a clay image as a reference invites
the model to keep some of it — you have to say the output contains none.

### Declining the preset

Higgsfield's server pattern-matches moody prompts and suggests its "IN THE DARK"
preset. Decline it — a style preset replaces the reference-driven technique
that's the entire point. Pass `declined_preset_id` to retry literally.

## Teaching frame (maps 1:1 onto Episode 01)

| Episode 01 slot | Track B equivalent |
|---|---|
| PRESERVE | STRUCTURE REFERENCE — the clay locks blocking |
| CAMERA | still the camera line, now also the move |
| LIGHT / MATERIAL | pushed into the MATERIAL REFERENCE plate |
| ATMOSPHERE | condensation, ice settle, bar tone |
| MEDIUM | Arri Alexa, commercial beverage language |
| NOT | plus "no clay in the output" |

Same seven slots. The lesson is that on a video model, two of the slots stop
being *words* and become *images*.
