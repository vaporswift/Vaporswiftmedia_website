# Throughline

Notes, scripts and storyboards for video projects — anchored to the Premiere Pro
timeline, and open to collaborators who don't have Premiere.

> **Working name.** `throughline` refers to the idea the product is built on: a
> video has a lifecycle (idea → script → board → shoot → edit → feedback →
> publish) and today no tool owns the thread through it. Rename freely; the
> package names are the only place it is load-bearing.

## Why

The tools in this space split three ways and none of them cross the line:

| Cluster | Examples | Where it stops |
| --- | --- | --- |
| Pre-production | Celtx, StudioBinder, Boords, Milanote | Ends when editing starts. Celtx's Premiere panel is read-only and one-way. |
| Review & approval | Frame.io, Wipster, Filestage, Dropbox Replay | Begins at "here's a cut". Comment pipes, not project brains. |
| Creator ideation | Spotter Studio, vidIQ, Notion | Never connected to the edit at all. |

The edit is where the creator actually lives, and it is the one place none of
them reach. Throughline puts the whole lifecycle in a panel inside Premiere, and
opens the feedback half of it to people who will never install an NLE.

Deliberately **not** competing with Frame.io on media: no camera-to-cloud, no
being the system of record for footage. The expensive thing stays optional, which
is what makes a creator-priced tier possible.

## Repository layout

```
packages/
  core/     Domain model, timecode, script parsing, marker sync planning.
            Host-agnostic and fully unit-tested — no Premiere, no React.
  panel/    The Premiere Pro UXP panel. React, built with Vite.
docs/
  architecture.md   Surfaces, boundaries, and why the store is shaped this way.
  roadmap.md        What is built, what is next, what is deliberately excluded.
```

The split is the point: everything with interesting logic lives in `core` and is
tested in CI, so `panel` stays a thin UI over a boundary that can be mocked.

## Getting started

```bash
npm install
npm test          # 73 unit tests, all in core
npm run typecheck
```

### Developing the UI

```bash
npm run dev:panel
```

Opens the panel in a browser at `localhost:5173`. Premiere is absent, so the
panel detects that and falls back to a mock host — a fake sequence, a movable
playhead, in-memory markers. Everything except the real marker writes works.
This is the fast loop; reloading a UXP plugin to check a padding change is not.

### Loading it into Premiere

Requires **Premiere Pro 25.6 or later** (the first release with UXP as an
official, non-beta extensibility platform).

```bash
npm run build --workspace @throughline/panel
```

Then in the [UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/):
*Add Plugin* → select `packages/panel/dist/manifest.json` → *Load*. The panel
appears under **Window → UXP Plugins → Throughline**.

## How it works

Every note, script scene and board frame is an **item**. Every item can be
anchored to a frame range in one or more sequences. That anchor is the
throughline — it is what lets a written scene, the board frame illustrating it,
and the client comment about it all resolve to the same spot on the timeline.

**Premiere markers are a projection, never the source of truth.** Markers cannot
express threads, status, authorship or multi-sequence anchoring, so keeping the
truth there would cost most of the product. Instead the panel computes what the
markers should be and reconciles:

- unchanged items produce no write at all, so a repeat sync is a genuine no-op
- a moved note moves its own marker instead of leaving a duplicate
- a resolved or deleted note removes its marker
- markers are matched on position **and** name, so a marker the editor placed by
  hand is never touched

Data lives in a `<project>.throughline.json` sidecar next to the `.prproj` —
diffable, backup-able, and readable by the web surface later. Embedding it in the
project file was the other option and was rejected: it would be invisible to
every other surface, and a corrupt project would take the notes with it.

## Status

Panel-first, v1 in progress. See [docs/roadmap.md](docs/roadmap.md).

The one part that cannot be verified in CI is the Premiere API itself. Every
host call is isolated in `packages/panel/src/premiere/uxpHost.ts`, written
defensively, and fails soft. Calls whose exact signature needs checking against
a running Premiere are marked `VERIFY` in that file — that is the first job when
this is loaded into a real install.
