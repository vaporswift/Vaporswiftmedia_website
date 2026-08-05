# Roadmap

## Built

**Core** — domain model; timecode including SMPTE drop-frame at 29.97/59.94 and
exact-rational Premiere tick conversion; Fountain and Final Draft import with a
section-heading fallback for scripts with no sluglines; Fountain export;
idempotent marker sync planning; project store with tombstones and debounced
persistence. 73 unit tests.

**Panel** — three tabs (Notes, Script, Board) over one store; notes and todos
anchored at the playhead with click-to-seek; script import with per-scene
timeline binding; storyboard with image frames and reordering; sync-to-timeline;
sidecar persistence; a mock Premiere host so the UI runs in a browser.

## Next, in order

1. **Verify against a running Premiere.** Every `VERIFY` comment in
   `packages/panel/src/premiere/uxpHost.ts` — sequence guid shape, TickTime
   construction, in/out point accessors, the drop-frame flag, marker field
   setters. This is the only thing standing between the panel and being usable,
   and it cannot be done in CI.
2. **Persist board images.** Currently object URLs that die with the session.
   They need to land in a `<project>.throughline/` asset folder beside the
   sidecar, with thumbnails generated at import.
3. **Pull a still from the playhead** into the board — `exportFrame` is already
   on the host interface. This is the feature that makes the board useful *during*
   the edit rather than only before it.
4. **Scene ↔ transcript diff.** Premiere exposes sequence transcripts through
   UXP. Comparing them to the bound script scene gives "you drifted from the
   script here", which no pre-production tool can build because none of them can
   see the cut.
5. **The web collaborator surface.** Hosted core, share links, guest comments
   landing as `feedback` notes. This is what makes the product more than a nicer
   Post Notes, and the reason `SyncAdapter` already exists.
6. **End-to-end test harness.** A Playwright smoke run against the built panel
   in demo mode. It was used to verify this build by hand and should be wired
   into CI rather than run ad hoc.

## Deliberately excluded

Stated explicitly, because staying out of these is what keeps the product cheap
to run and coherent:

| Not building | Why |
| --- | --- |
| Camera-to-cloud, media ingest, being the store of record for footage | Frame.io's moat and its cost centre. Link out instead. |
| Scheduling, call sheets, budgeting | StudioBinder's turf, and the wrong audience. |
| Enterprise approval chains, audit trails, SSO | Ziflow and Filestage own this, and it is the exact bloat this product is a reaction to. |
| Native mobile apps at launch | A PWA covers review, comment and capture. |
| AI script generation as a headline feature | Commodity. Fine later as a feature, wrong as a pillar. |

## Open questions

- **Product name.** `throughline` is a working title.
- **Multi-project.** One sidecar per `.prproj` is right for a solo creator. A
  creator running a content calendar across twelve videos will want a project
  list, which probably arrives with the hosted backend rather than before it.
- **Premiere Productions.** Shared bins across multiple `.prproj` files break the
  one-sidecar-per-project assumption. Worth deciding before that assumption is
  spread further through the code.
