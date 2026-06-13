# After Effects → Premiere: True Karaoke Caption `.mogrt`

This is the piece you **can't** do in Premiere alone: a reusable Motion Graphics Template
where the **current word lights up** in your accent color (the real TikTok/Reels karaoke
look), with fully **editable text and colors** once it's in Premiere.

You build it once in After Effects, export a `.mogrt`, and from then on it's pure
drag-and-drop in Premiere — exactly like the paid packs, but yours.

> Requires After Effects (part of a full Creative Cloud plan). If you only have the
> single-app Premiere plan, stick with the native workflow in
> `../captions/build-and-reuse-workflow.md`.

---

## How the effect actually works (the concept)

A text layer in AE can have a **Text Animator** with a **Range Selector**. The Range
Selector picks *which characters/words* an animated property applies to. We point that
property at **Fill Color** and tell the range to select **one word at a time, by word
index**. Then we move that selection across the line — word 1, word 2, word 3 — so the
highlight color sweeps with the speech. That's karaoke.

The text stays a single editable string, so in Premiere the editor just retypes it.

---

## Build it — step by step

### 1. Set up the comp
- New composition matching your delivery: **1080 × 1920**, frame rate matching your footage
  (24/30/60), ~5 s duration (you'll trim per use).

### 2. Create + style the text
- **Text tool** → type a placeholder: `THIS IS YOUR CAPTION`.
- Character panel: **Montserrat ExtraBold** (or your caption font), size ~115 px, **all caps**,
  fill **white** `#FFFFFF`.
- Add the outline + shadow as **Layer Styles** (right-click layer → Layer Styles):
  - **Stroke** — black, size 10–14, position Outside.
  - **Drop Shadow** — black, opacity ~75%, distance 8, softness 12.
- Center the text; set the layer **anchor point to its center** (so any scale pops from the
  middle) — use `Layer → Transform → Center Anchor Point in Layer Content`.

### 3. Add the highlight animator
- Select the text layer → next to **Text** in the timeline, click **Animate ▸** → **Fill
  Color**. This adds **Animator 1** with a **Range Selector 1** and a **Fill Color** property.
- Set **Fill Color** = your highlight, e.g. yellow `#FFE000` (this is the color the selected
  word turns).

### 4. Make the range select ONE WORD at a time
- Expand **Range Selector 1 → Advanced**:
  - **Units: Index**
  - **Based On: Words**
- Back in **Range Selector 1**: set **Start = 0**, **End = 1**. That selects exactly the first
  word. We'll move it with **Offset**.

### 5. Drive the highlight across the words
Two ways — pick one:

**A) Tap-to-beat with markers (fast, recommended)**
- Add this expression to **Range Selector 1 → Offset** (alt/option-click the stopwatch):
  ```
  n = 0;
  for (i = 1; i <= thisLayer.marker.numKeys; i++) {
    if (marker.key(i).time <= time) n++;
  }
  n;
  ```
- Now, with the layer selected, **press `*` (numpad) during playback** to drop a layer marker
  on each word as it's spoken. The highlight automatically jumps to the next word at every
  marker. Re-tapping is faster than keyframing and easy to nudge afterward.

**B) Hold keyframes (precise)**
- Keyframe **Offset**: 0 at word 1's start, 1 at word 2's start, 2 at word 3's start, etc.
- Set all keyframes to **Hold** (right-click → Toggle Hold Keyframe) so the highlight snaps
  cleanly word-to-word instead of sliding.

### 6. (Optional) add the scale pop
- On the layer's **Transform → Scale**, keyframe 92% → 106% → 100% over ~7 frames at the in
  point. Easy Ease the keyframes (F9).

### 7. Expose editable controls for Premiere ← makes it a real template
- `Window → Essential Graphics` (in AE). Set **Master: [your comp]**.
- Drag these into the Essential Graphics panel so Premiere editors can change them:
  - The text layer's **Source Text** → rename it **"Caption Text"**.
  - **Animator 1 → Fill Color** → rename **"Highlight Color"**.
  - The text's base **Fill Color** (Character) → **"Text Color"** (add via the text Fill if you
    want it editable).
  - Optionally **Scale** and **Position** for repositioning.
- Cleaner controls = less fiddling later.

### 8. Export the `.mogrt`
- In the Essential Graphics panel → **Export Motion Graphics Template…**
- Destination: **Local Templates Folder** (so it appears in Premiere automatically) — or a
  Creative Cloud **Library** to sync across machines.
- Name it, e.g. `VSM Karaoke Caption`.

---

## Use it in Premiere (drag-and-drop)

1. `Window → Essential Graphics` → **Browse** tab → find `VSM Karaoke Caption`.
2. **Drag it onto the timeline** above your footage.
3. Select it → **Edit** tab → type your line into **Caption Text**, tweak **Highlight Color**.
4. Trim its length to the spoken phrase. Duplicate for the next phrase.

---

## Honest expectations

- **Timing is still per-clip.** The MOGRT gives you the *look* and editable text, but you set
  when each word lights up (markers or keyframes in AE, or by trimming phrase-by-phrase in
  Premiere). AE can't auto-sync to arbitrary speech on its own.
- **For a whole video**, this is more work than Premiere's native Track Styles. So the smart
  workflow is **hybrid**:
  - **Native Premiere captions + Track Style** for the bulk of the talking (fast).
  - **The AE karaoke `.mogrt`** for *hero lines* — the hook, the punchline, the key CTA — where
    the eye-catching highlight earns its keep.
- **Fully automatic word-sync** (type once, it times itself to the audio) is what scripts/
  plugins do. If you find yourself doing long-form karaoke constantly, that's the point where a
  transcription-driven caption script/extension pays off — but for hero lines, the manual build
  above is free and looks identical.

---

## Bonus: word-by-word *reveal* template (no color highlight)

Same setup, but instead of Fill Color, choose **Animate ▸ Opacity** (or **Scale**), set the
Range Selector to **Based On: Words**, and animate **Offset** so each word pops in one at a
time. Great for clean kinetic builds. Export the same way.
