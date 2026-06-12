# Social Export Settings (Reels / TikTok / Shorts)

The paid packs include "exact export settings." Here they are. Set these once in the **Export**
panel, then **save as a preset** (gear/preset dropdown → Save Preset) so future exports are one
pick.

---

## Vertical short-form (9:16) — the main one

| Setting | Value |
|---------|-------|
| **Format** | H.264 |
| **Resolution** | 1080 × 1920 |
| **Frame rate** | Match source (24 / 25 / 30 / 60) — don't change it on export |
| **Bitrate encoding** | VBR, **2 pass** |
| **Target bitrate** | 16 Mbps |
| **Maximum bitrate** | 24 Mbps |
| **Profile** | High |
| **Audio** | AAC, 320 kbps, 48 kHz, Stereo |
| **Loudness** | Normalize to **-14 LUFS** (Effects → Loudness Radar, or Essential Sound Auto-Match). This matches what TikTok/Instagram/YouTube target — prevents the platform crushing your audio. |
| **Render at Maximum Depth** | On |
| **Use Maximum Render Quality** | On (only matters if scaling) |

Save as: `VSM – Vertical Shorts 1080x1920`.

---

## Why these numbers

- **16–24 Mbps** is plenty for 1080p vertical. Going higher just makes a bigger file the
  platform re-compresses anyway — wasted upload time, no visible gain.
- **2-pass VBR** spends bits where motion is complex → cleaner result at the same size.
- **-14 LUFS** is the sweet spot: louder gets turned down by the platform (and can distort),
  quieter sounds weak next to other creators.
- **Match-source frame rate** avoids stutter/judder from rate conversion.

---

## Horizontal (16:9) variant — if you repurpose to YouTube landscape

Same as above but:
- Resolution **1920 × 1080**
- Target bitrate **20 Mbps**, Max **30 Mbps**

Save as: `VSM – 1080p Landscape`.

---

## Quick checklist before every export

- [ ] Captions inside title-safe (not under the platform UI)
- [ ] Audio peaks not clipping; loudness ~ -14 LUFS
- [ ] Frame rate matches source
- [ ] Correct preset selected
- [ ] Filename includes platform/version so you don't re-upload the wrong cut
