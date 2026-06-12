# The Caption Speed System (build once, reuse forever)

This is the backbone of the whole kit. Once set up, captioning any new video is **three
clicks**. This is the same outcome the paid "one-click caption system" sells — done natively.

---

## Part A — The native drag-and-drop workflow (free, fast, reliable)

### 1. Transcribe (free, on-device)
- `Window → Text` to open the Text panel.
- **Transcript** tab → **Transcribe Sequence**. Pick language, choose the right audio track.
- Premiere transcribes locally — no cost, no upload, works offline.

### 2. Create captions
- In the Text panel → **Captions** tab → **Create Captions** (from transcript).
- This drops a styled caption track onto your timeline above the video. Each caption is one
  timed block synced to speech.
- Tip: set **Max length per line** and **Lines** low (e.g. 1 line, ~12–20 chars) to force the
  punchy 1–3-words-per-line short-form look.

### 3. Style it once (Essential Graphics)
- Select a caption on the timeline → open **Essential Graphics** (`Window → Essential
  Graphics`) → **Edit** tab.
- Dial in font / size / fill / **Appearance** (stroke, shadow, background) / **Align &
  Transform** position, using the exact values in `caption-styles.md`.

### 4. Save it as a Track Style ← THIS is the drag-and-drop magic
- Still in Essential Graphics, find the **Track Style** dropdown (top of the caption
  properties).
- Choose **Create Style…**, name it (e.g. `VSM – Bold Karaoke` / `VSM – Clean White`).
- Now that style is **saved into Premiere permanently**. On any future project, after step 2
  you just pick your style from the **Track Style** dropdown and **every caption updates at
  once**. That's your "one-click caption preset."

### 5. (Optional) add the scale pop animation
Native captions don't animate by themselves, so to add the pop:
- Select the caption clip(s) → **Effect Controls** → **Motion → Scale**.
- Keyframe: frame 0 = 92%, frame +3 = 106%, frame +7 = 100%. Copy these keyframes and paste
  onto other caption clips (`Cmd/Ctrl+C` on the keyframes → select clip → paste).
- Faster: save the animated caption as a **preset** — right-click the effect in Effect
  Controls → **Save Preset** → drag from the Effects panel onto any clip.

---

## Part B — Per-word karaoke highlight (the honest section)

The 2-color "current word lights up yellow" effect is the one thing **native Premiere can't
do automatically**. Captions are styled as whole blocks. Here are your real options, cheapest
first — pick based on how much that exact look matters:

### Option 1 — Word-by-word *reveal* (free, native, closest you'll get)
Instead of recoloring the spoken word, reveal words one at a time so attention tracks the
audio. In **Create Captions**, set lines/length very short (1–3 words) so each caption *is*
basically one phrase, then apply the scale-pop from Part A step 5. Reads as "kinetic" and is
fully native. Not true 2-tone highlight, but free and fast.

### Option 2 — CapCut for captions, Premiere for everything else (free)
CapCut (free desktop app) has true auto-karaoke caption templates. Workflow some creators
use: generate the highlighted captions in CapCut, export, finish the edit in Premiere. Adds a
round-trip step but gives the exact look for $0. Trade-off: less control inside Premiere.

### Option 3 — A low-cost Premiere extension (the "earns its keep" buy)
If true karaoke matters and you want it **inside Premiere as drag-and-drop**, this is the one
place a small purchase is justified. Look at extensions/panels (search Adobe Exchange and
creator stores) that do auto-karaoke captioning in Premiere — typically far cheaper than a
$77 pack and they automate the whole thing. Vet for current Premiere-version support and real
reviews before buying.

> Recommendation: start with **Option 1** (free, native) for most videos. Only reach for
> Option 2/3 if a specific client/series needs the literal 2-tone karaoke look.

---

## Part C — Organizing your reusable library

- **Track Styles** live inside Premiere automatically once created — they follow your user
  profile and appear in every project.
- **Motion Graphics Templates (`.mogrt`)** you build (hooks, lower-thirds): save via Essential
  Graphics → **Export as Motion Graphics Template** → save to **Local Templates Folder** so
  they show up in the **Browse** tab of Essential Graphics in every project.
- **Effect presets** (the scale-pop, audio chain): live in the **Effects panel → Presets**
  bin. Right-click → **Export Presets** to back them up / move them to another machine.
- Back everything up: copy your presets + Local Templates folder to cloud storage so a
  reinstall doesn't wipe your library.

---

## The payoff

After one afternoon of setup, your per-video caption process is:

> **Transcribe Sequence → Create Captions → pick Track Style → (drag scale-pop preset).**

That's the entire value of the paid "caption system," rebuilt for free and tuned to your brand.
