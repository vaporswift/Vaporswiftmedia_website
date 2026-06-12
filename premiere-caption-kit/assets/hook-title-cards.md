# Hook Title Cards (first-2-seconds attention grabbers)

Big animated opening text that stops the scroll. Build each as a reusable **Motion Graphics
Template (`.mogrt`)** with editable text, so reusing it on a new video is: drag in → retype.

All specs for **1080 × 1920**.

---

## Build method (one time, per template)

1. New sequence at your delivery size, or work in your edit.
2. **Type tool (T)** → click on the Program monitor → type your hook (e.g. `STOP SCROLLING`).
3. Style in **Essential Graphics** (font/size/color/stroke per the recipes below).
4. Animate with **Motion** keyframes in Effect Controls (recipes below).
5. Select the text graphic → Essential Graphics → **Export as Motion Graphics Template** →
   save to **Local Templates Folder**, name it (e.g. `VSM Hook – Punch In`).
6. ✅ Done. In any project: Essential Graphics → **Browse** → drag it onto the timeline →
   double-click the text to retype. Fully drag-and-drop.

> Pro tip: before exporting, in the Essential Graphics **Edit** view you can promote the text
> field to an editable control so the `.mogrt` exposes a clean "Type your hook" box. Right-click
> the text layer → ensure the **Source Text** is included as an editable property.

---

## Recipe 1 — "Punch In" (impact zoom)

The aggressive hype hook.

| Property | Value |
|----------|-------|
| Font | Anton (free), or Bebas Neue, or Montserrat Black |
| Case | ALL CAPS |
| Size | 150–190 px, 1–3 lines |
| Fill | White, with a bright accent word (color one key word your highlight color) |
| Stroke | Black 14 px |
| Shadow | Black, 70%, distance 10, blur 14 |
| **Animation** | Scale 130% → 100% over 8 frames (ease out) + opacity 0→100% in first 3 frames |
| Extra | Add a tiny `Transform` shake or a 1px position jitter at the impact frame for energy |
| Duration | 1.0–1.5 s on screen |

---

## Recipe 2 — "Slide Stack" (word-by-word build)

Cleaner, modern, each line slides up in sequence.

| Property | Value |
|----------|-------|
| Font | Montserrat ExtraBold / Poppins Bold |
| Case | Title Case or ALL CAPS |
| Size | 110–140 px |
| Layout | 2–3 separate text layers stacked (so each animates independently) |
| Fill | White + one accent line |
| **Animation per line** | Position +60px → 0 and opacity 0→100% over 6 frames, **staggered** 4 frames between lines |
| Easing | Right-click keyframes → **Ease Out** (or use Temporal Interpolation → Bezier) |
| Duration | 1.5–2 s |

---

## Recipe 3 — "Bar Reveal" (text behind a sliding bar/box)

A solid color bar wipes across to reveal the text — premium/brand feel.

| Property | Value |
|----------|-------|
| Font | Bebas Neue / Anton |
| Bar | Rectangle (Pen/Rectangle tool) in your accent color, full text width |
| **Animation** | Bar scales horizontally 0→100% (anchor left) over 6 frames, then text fades up as bar continues off, then bar scales to 0 (anchor right) |
| Feel | Snappy — keep total reveal under 12 frames |
| Duration | 1.5 s |

---

## Hook copy that actually works (bonus)

The animation only matters if the words hook. Reusable openers:
- "Stop scrolling if you…"
- "Nobody talks about this, but…"
- "Here's how to [result] in [time]"
- "3 things I wish I knew before…"
- "You're doing [X] wrong. Here's why."

Build a `.mogrt` for each of your top 3 hook layouts and you'll never keyframe a title from
scratch again.
