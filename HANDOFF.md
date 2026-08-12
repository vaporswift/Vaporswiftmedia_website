# Handoff — two Claude sessions, one repo

Read this first if you are a Claude session working in this repository.

There are two active workstreams and they must not edit each other's files.
This document is the contract between them. It is the only file both sessions
own; change it by agreement, not unilaterally.

---

## Who owns what

| Directory | Owner | Contains |
|---|---|---|
| `instagram-carousels/` | **content session** | Episodes, captions, slide rendering, the content manifest |
| `premiere-caption-kit/` | content session | The free caption kit and its landing page |
| `throughline/` | plugin session | Premiere project-management panel |
| `brand/` | **site session** | House colours and type. See the exception below |
| site tree (TBD) | **site session** | Design, layout, routing, build, deploy |

**Rule:** if a change touches a directory you don't own, don't make it — say
what you need and let the owner make it. The only shared files are this one
and `brand/`.

## Branches

`main` is the trunk. It was created by merging the three orphaned `claude/*`
branches that existed before it; all of their history is contained in it.

- Branch from `main`. Merge back to `main` via PR.
- Never commit directly to another session's branch.
- Before starting work: `git fetch origin && git rebase origin/main`.

Prior to `main`, every session forked and never merged. Don't restart that.

---

## The content interface

The site never reads an episode folder. It reads exactly one file:

```
instagram-carousels/content/manifest.json
```

Regenerate it with `node instagram-carousels/content/build-content.js`.
**Never hand-edit it** — it is derived, and an edit will be overwritten.

### Shape

```jsonc
{
  "version": 1,
  "count": 9,
  "tracks": { "A": "AI prompting for real estate", "B": "…", "C": "…", "T": "Films" },
  "episodes": [{
    "slug":        "track-c-02-what-is-claude",
    "code":        "C02",
    "track":       "C",
    "trackName":   "Working with Claude",
    "title":       "What is Claude, and what are Projects and Artifacts?",
    "shortTitle":  "What is Claude",
    "description": "…",          // meta description, one sentence
    "format":      "video-carousel",  // carousel | video-carousel | reel
    "published":   null,          // ISO date once posted, else null
    "instagramUrl":null,
    "hook":        "…",           // first line of the caption
    "hookChars":   94,            // asserted <= 125 at build time
    "body":        "…",           // the article. Markdown-ish plain text
    "hashtags":    ["#claudeai"],
    "faq":         [{ "q": "…", "a": "…" }],   // for FAQPage schema
    "media": {
      "video":  "slug/out/slide-01-video.mp4",  // or null
      "stills": ["slug/out/slide-02.png", "…"],
      "alt":    ["Vaporswift slide — …"]        // derived from each slide
    },
    "sourceDir": "track-c-02-what-is-claude",
    "extras":    ["trailer-01-camelback/PROMPT.md"]   // deeper artifacts
  }]
}
```

Media paths are **relative to `instagram-carousels/`**. Rendered output is
gitignored, so the site build must either run the renderers or receive the
PNGs another way — decide this and record it here.

### Field notes for the site

- `title` is deliberately question-shaped. These pages are aimed at search
  and at AI answer engines, both of which match on questions.
- `faq` is the answer-engine payload. Render it as visible Q&A **and** as
  `FAQPage` JSON-LD. Two pairs per episode today.
- `body` is the real article, 290–670 words per episode. It already contains
  the full prompt as plain text — keep prompts in a `<pre>` and copyable.
  Selectable prompt text is the whole point; do not render them as images.
- `hook` doubles as a usable `og:description`.
- `alt` is derived from each slide's own headline, so it cannot drift. If a
  slide's wording changes, regenerate rather than editing alt by hand.

---

## Brand

`brand/tokens.css` is the single definition of VaporSwift's colours and type.
The site session owns its values. The carousels consume it.

**Its current values are provisional** — they are what the carousels shipped
with, kept only so nothing breaks mid-revamp. Several are deliberately close
to Anthropic's palette, which is what the house look should move *away* from.
Overwrite the values; leave the token names alone and everything downstream
re-renders.

`brand/skins/anthropic-topic.css` is a deliberate exception: an opt-in skin
for posts whose *subject* is Claude, so those posts can speak that visual
language without the whole account wearing it. It is applied per post, never
globally, and never to Track A, Track B, or films.

**Not yet wired.** The nine existing decks still hardcode their palette in
each `slides.html`. Migrating them to import `brand/tokens.css` is content-
session work and is the next step there. Until it lands, a change to
`tokens.css` will not move the carousels.

---

## This repo is public

Deliberately — the content is meant to be given away, and it's useful to point
a tool or another session straight at a raw file URL.

- **Never commit a secret.** No API keys, tokens, `.env` files, client
  contracts or private client assets. There are none in the history today.
  If you need a credential, it goes in the environment, not the repo.
- **Unpublished drafts are readable by anyone.** Accepted trade, not an
  oversight. Don't park anything here that would hurt if read early.
- Media in `assets/` is gitignored, which is also where licensed or
  client-supplied source material stays. Keep it that way.

## Rules of engagement

1. Own your directory. Request changes elsewhere; don't make them.
2. Branch from `main`, merge back by PR.
3. `manifest.json` is generated. Regenerate, never edit.
4. Token names are a contract. Values are free; names are not.
5. Public repo — no secrets, no client-confidential material.
6. Renderers assert their own output — `render.js` checks geometry and
   overflow, `check-caption.js` checks the hook length, `build-content.js`
   refuses to emit a manifest with a missing field or an over-length hook.
   If one fails, fix the cause; don't route around the check.
