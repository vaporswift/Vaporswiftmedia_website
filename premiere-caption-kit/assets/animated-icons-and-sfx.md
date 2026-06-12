# Animated Icons + Sound FX + Mic Preset Chain

The "extras" that make short-form feel produced: pointing arrows, underline scribbles,
emphasis circles, whooshes, pops — plus clean audio. All free.

---

## 1. Animated icons (arrows, underlines, scribbles, circles)

### Easiest: free animated overlay packs (drag-and-drop)
Download once, keep in a `B-Roll/Overlays` bin, drag onto the timeline above your footage and
set blend mode to **Screen** (for white-on-black) or use ones with alpha:
- **Mixkit** — free, commercial use, no attribution. Search "arrow", "scribble", "circle".
- **Pixabay** / **Pexels** — free overlay clips.
- **Motion Array** (free tier) — animated icon `.mogrt`s.

> If a file is white-on-black (no alpha), apply blend mode **Screen** to drop the black out.
> If it's a green screen, use **Ultra Key**.

### Build-your-own simple ones (native, save as `.mogrt`)
For clean geometric arrows/underlines/circles you can make them in Premiere and reuse:
1. **Pen / Rectangle / Ellipse tool** → draw the shape (underline bar, circle outline, arrow
   from a triangle + rectangle).
2. Set stroke to your accent color, no fill (for circles/underlines).
3. Animate a **reveal**: scale the shape from one anchor (e.g. underline scales X 0→100% over
   6 frames), or animate the **Pen** path with a Linear Wipe / Write-on style using a Linear
   Wipe transition for a "hand-drawn" feel.
4. Export as `.mogrt`. Reuse by dragging in and recoloring/repositioning.

Hand-drawn squiggle scribbles are hard natively — for those, grab a free scribble overlay
pack rather than building from scratch.

---

## 2. Free Sound FX library (build a `SFX` bin)

Download a starter set and keep them in a project bin / Premiere **Libraries** so they're one
drag away. Free, license-clear sources:
- **Pixabay** (sound effects) — free, commercial use.
- **Mixkit** (sfx) — free, no attribution.
- **Uppbeat** — free tier with attribution-free options.
- **YouTube Audio Library** — free SFX section.
- **Freesound.org** — huge, check each clip's license (CC0 preferred).

**Grab these categories (the short-form essentials):**
| Category | Use |
|----------|-----|
| Whoosh / swoosh | Transitions, text entrances |
| Pop / click | Caption appears, bullet points |
| Impact / boom | Hook hits, hard cuts |
| Riser | Build tension before a reveal |
| Ding / notification | Emphasis, "key point" |
| Subtle UI ticks | Fast-cut list videos |

Tip: keep them trimmed and renamed (`whoosh_01`, `pop_soft`, `impact_big`) so you can find
the right one instantly under deadline.

---

## 3. Mic cleanup preset chain (Essential Sound — free, native)

Make any mic sound podcast-clean, then save it as a preset so it's one click forever.

1. Select your dialogue clip(s) → **Window → Essential Sound**.
2. Tag the clip as **Dialogue**.
3. Apply, in this order:
   - **Repair → Reduce Noise** ~ 4–6 (only as much as needed; too much sounds underwater).
   - **Repair → Reduce Rumble** on (kills low hum).
   - **Repair → DeHum** if there's electrical buzz (50/60 Hz to match your region).
   - **Clarity → EQ** → preset like "Vocal Enhance" or boost presence ~ 3–5 kHz slightly.
   - **Clarity → Dynamics** ~ 5–7 (evens loud/quiet — this is the "radio voice" glue).
   - **Loudness → Auto-Match** (targets broadcast loudness; see export doc for the social
     target).
4. Once dialed in, click the **preset save icon** in Essential Sound (or right-click the
   effect stack in Effect Controls → **Save Preset**) → name it `VSM Voice Clean`.
5. Reuse: drag the preset from **Effects → Presets** onto any new dialogue clip.

> One caution: don't stack noise reduction + heavy compression too aggressively or voices get
> that "AI/underwater" artifacting. Start gentle and only push each slider until it's clean.
