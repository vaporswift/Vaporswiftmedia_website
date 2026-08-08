# Track B, Episode 01 — Reel caption

Post as a Reel, 9:16, 10s, sound on. The native audio (bar tone + ice clink)
matters — watch time is the top Reels signal and silent video loses it.

---

I never shot this. There was no glass, no whiskey, no bar.

There was a grey clay model — no colour, no texture, no light — and a single reference photo. Seedance 2.5 did the rest in one pass.

This is the technique nobody's using yet, and it's the one that actually matters for commercial work: you stop describing a scene and start handing the model two different jobs.

Reference 1 is the clay render. It carries STRUCTURE only — camera angle, composition, where the glass sits, how big it is, where the camera travels. Geometry, nothing else.

Reference 2 is a photo. It carries LOOK only — cut crystal, amber liquid, condensation, warm key from the left, cool rim from behind. Material, nothing else.

Then you tell the model which reference owns which job. That's the whole trick.

Why this beats prompting from scratch: text can't specify a camera path. You can write "slow push-in" a hundred ways and get a hundred different moves. A clay pass just shows it. You get the shot you designed instead of the shot the model guessed.

Two lines that are doing more work than they look:

→ In the clay prompt: "the glass and ice are solid opaque grey clay, not glass." Leave it out and the model renders real glass — and then you have no clay pass, just a worse photo.

→ In the video prompt: "no clay or grey untextured surfaces in the output." Feed a clay image as a reference and the model wants to keep some of it. You have to say the output contains none.

Full recipe — all three prompts, the exact settings — is in my profile.

Save this before your next product shoot. Send it to whoever's still booking a studio day for a hero shot.

Episode 02 is the same technique on a moving product. Follow so it lands.

Made with Seedance 2.5, omni_reference mode, 10s, upscaled to 1080p.

#aivideo #seedance #productphotography #cgi #commercialdirector

---

## Notes

- **Seedance 2.5 caps at 720p.** Always upscale before posting; feed
  compression is unforgiving of soft source.
- Native audio is on. Do not post silent.
- The clay still makes a strong second-serve cover if you post this as a
  carousel instead — ugly-input → curiosity is the same hook that works on
  the real estate track.
