# Architecture

## Three surfaces, one core

```
                 ┌──────────────────────────────┐
                 │        @throughline/core      │
                 │  items · anchors · timecode   │
                 │  script parsing · sync plans  │
                 └───────────────┬───────────────┘
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   Premiere panel            Web app                Mobile (PWA)
   (UXP, the creator)        (collaborator,         (approve, comment,
   reads + writes the        no install, no          photograph a board,
   timeline                  account)                voice notes)
```

Only the panel exists today. The other two are why the boundaries are drawn
where they are, and the shape of the core is chosen so that adding them is
additive rather than a rewrite.

## Why the store looks like this

**Items, not documents.** A note, a script scene and a board frame share a base
type (`ItemBase`) with `id`, `revision`, `updatedAt` and a `deletedAt` tombstone.
That uniformity is what lets one sync algorithm handle all three, and what will
let the remote adapter merge per item rather than per document.

**Tombstones from day one.** A delete on a phone that was offline has to beat a
stale copy on the desktop. Hard deletes make that unresolvable, and retrofitting
tombstones onto data users already have is worse than paying for them early.

**Anchors are a list, not a field.** A creator making a long cut and a Shorts
cut-down genuinely has one note that applies to both. One anchor per sequence,
replaced rather than accumulated.

**Frames, not seconds or timecode strings.** One representation of time in the
model. Timecode is a display format, ticks are a wire format, both derived. This
removes an entire category of rounding bug.

## Boundaries

Two interfaces separate everything testable from everything that isn't:

| Interface | Implementations | Purpose |
| --- | --- | --- |
| `StorageAdapter` | `UxpFileStorageAdapter`, `LocalStorageAdapter`, `MemoryStorageAdapter` | Where the document lives |
| `PremiereHost` | `UxpPremiereHost`, `MockPremiereHost` | Everything the panel needs from the NLE |

`SyncAdapter` is defined but unimplemented — it is the seam the hosted backend
arrives through.

The consequence worth stating: **`core` has no idea Premiere exists.** All 73
tests run in plain Node. The single file that talks to the host API is ~250
lines and every call in it is guarded.

## Marker sync

Split into a planner (in `core`, tested) and an executor (in `panel`, a loop):

```
planMarkerSync(project, sequenceId) → MarkerOperation[]
                                        ├── create
                                        ├── update  (carries the previous link)
                                        └── delete  (carries the previous link)
```

Idempotence comes from `MarkerLink`: per item and sequence we remember the frame
the marker sits on, the name we gave it, and a hash of its projected content.
A plan for an untouched project is empty.

Two properties worth preserving:

1. **We only ever touch our own markers.** Every marker we write is prefixed
   `⟡`, and lookup matches position *and* name. An editor's own marker at the
   same frame is invisible to us.
2. **A failed operation does not abandon the sync.** Failures are collected into
   a report, not thrown, so one bad marker cannot leave the timeline half-written.

## What the web surface will need

Recorded here so that the panel does not paint it into a corner:

- The sidecar becomes an offline cache; the hosted core becomes the shared truth.
- Guest reviewers get a share link and no account, ever. Requiring a client to
  sign up is the fastest way to kill a review workflow, and every credible
  competitor already gives reviewers away free.
- Video is referenced, not hosted, on the free tier — a YouTube unlisted link, a
  Drive file — with a panel-generated review proxy only on paid tiers. Storage is
  the cost centre that makes Frame.io expensive, and avoiding it is what makes a
  creator price point possible.
- `Note.kind === 'feedback'` and `Author.guest` already exist for exactly this.
