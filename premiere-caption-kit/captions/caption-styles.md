# Caption Style Specs

Exact, copy-paste-ready values for the two looks you picked. All values are tuned for a
**1080 × 1920 vertical (9:16)** sequence — the standard for Reels / TikTok / Shorts. If you
edit at a different size, scale the font sizes proportionally (e.g. for 4K vertical, ×2).

You apply these in the **Essential Graphics** panel (`Window → Essential Graphics`) after
creating captions, then **save them as a Track Style** so they become one-click. The how-to
is in `build-and-reuse-workflow.md`.

---

## Style 1 — Bold Karaoke Highlight (the TikTok/Reels signature)

The big, punchy, all-caps look where the current word pops in a bright color.

| Property | Value |
|----------|-------|
| **Font** | TheBoldFont (free) — or Montserrat **ExtraBold/Black**, Poppins **Black** |
| **Case** | ALL CAPS (toggle in Essential Graphics) |
| **Size** | 115–130 px |
| **Tracking** | 0 to +20 |
| **Leading (line spacing)** | tight, ~90% |
| **Fill color** | White `#FFFFFF` |
| **Highlight color** | Yellow `#FFE000` **or** green `#36F000` (pick one as your brand accent) |
| **Stroke / Edge** | Black `#000000`, weight 12–16 px |
| **Shadow** | Black, opacity 75%, angle 135°, distance 8, blur 12 |
| **Background** | Off (the stroke does the work) |
| **Position** | Horizontally centered; vertical ~58–62% down (just above center) |
| **Max width** | ~80% of frame so words wrap to 1–3 words per line |
| **Animation** | Scale pop on each caption: 92% → 106% → 100% over 6–8 frames (see workflow doc) |

**About the per-word highlight (read this):** native Premiere captions style the *whole*
caption block one color — they don't auto-recolor just the word being spoken. To get the
true 2-color karaoke effect, see the three honest options in
`build-and-reuse-workflow.md → "Per-word karaoke highlight"`. The spec above gives you the
bold styled look; the highlight section tells you how to add the moving color.

---

## Style 2 — Clean Minimal White (talking-head / podcast)

Understated, professional, readable. No shouting.

| Property | Value |
|----------|-------|
| **Font** | Inter **SemiBold**, or Montserrat **SemiBold**, or Helvetica Now |
| **Case** | Sentence case |
| **Size** | 72–85 px |
| **Tracking** | 0 |
| **Fill color** | White `#FFFFFF` |
| **Stroke / Edge** | Off (or 2 px black for contrast on bright footage) |
| **Shadow** | Black, opacity 60%, angle 135°, distance 5, blur 14 (soft, subtle) |
| **Background** | Optional pill: black `#000000` at 28% opacity, corner radius high, padding generous |
| **Position** | Centered; vertical ~80% down (lower third, inside title-safe) |
| **Max width** | ~85% of frame, 1–2 lines |
| **Animation** | Gentle fade up: opacity 0→100% + position +20px → 0 over 8 frames |

---

## Color & contrast notes

- Always keep a **dark stroke or shadow** on white text — footage is unpredictable and white
  on white disappears. The shadow in both specs guarantees legibility.
- Pick **one** highlight accent and use it across all your videos — that consistency is what
  makes content look "branded" the way paid packs do.
- Stay inside the **action-safe / title-safe** guides (enable in Program monitor → wrench →
  Safe Margins) so captions aren't covered by the TikTok/Reels UI on the right and bottom.

---

## Recommended starter set

Build **both** styles as Track Styles and you cover ~90% of short-form work:
- **Bold Karaoke Highlight** → hype/educational/list content.
- **Clean Minimal White** → interviews, vlogs, premium/brand content.
