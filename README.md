# Vaporswift Media

Content system and site for [VaporSwift Media](https://www.instagram.com/vaporswiftmedia/) —
a multimedia studio in Scottsdale, Arizona.

**If you are a Claude session working in this repo, read [`HANDOFF.md`](HANDOFF.md) first.**
It sets out which directory you own, the branch model, and the contract between
the workstreams. More than one session works here; that file is how they stay
out of each other's way.

## What's here

| Directory | What it is |
|---|---|
| [`instagram-carousels/`](instagram-carousels/) | The Instagram content system — episodes, captions, and the renderer that turns HTML into exact 1080×1440 slides. Its [`PLAYBOOK.md`](instagram-carousels/PLAYBOOK.md) is the accumulated craft |
| [`premiere-caption-kit/`](premiere-caption-kit/) | A free, do-it-yourself replacement for paid Premiere Pro caption packs |
| [`throughline/`](throughline/) | Premiere project-management panel |
| [`brand/`](brand/) | House colours and type. One definition, consumed everywhere |

## Building the carousels

```bash
cd instagram-carousels/<episode>
npm install            # playwright + chromium, first time only
./fetch-assets.sh      # pulls source images and video
node render.js         # → out/slide-*.png, asserted at 1080x1440
node check-caption.js  # measures the caption hook against Instagram's cut
```

Then regenerate the content manifest the site builds against:

```bash
node instagram-carousels/content/build-content.js
```

Everything asserts its own output. If a check fails, fix the cause rather than
routing around it — most of these checks exist because something shipped wrong
once.

## A note on this being public

This repository is public on purpose: the content is meant to be given away,
and it's convenient to point a tool or a session straight at a file. Two
consequences worth remembering.

- **No secrets, ever.** No API keys, tokens, `.env` files or client contracts.
  There are none today and it should stay that way.
- **Unpublished work is visible.** Drafts sitting here can be read before they
  are posted. That's an accepted trade, not an oversight.
