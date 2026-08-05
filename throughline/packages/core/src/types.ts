/**
 * Throughline domain model.
 *
 * Everything a creator writes down — a note, a script scene, a storyboard frame,
 * a piece of client feedback — is an "item". Every item can be *anchored* to a
 * range of time in one or more sequences. That anchor is the throughline: it is
 * what lets a script scene, the board frame that visualises it, and the client
 * comment about it all resolve to the same spot on the timeline.
 *
 * Premiere markers are a *projection* of this model, never the source of truth.
 * See `markers.ts` for the projection, and docs/data-model.md for the rationale.
 */

/** Milliseconds since the Unix epoch. */
export type Timestamp = number;

export type Id = string;

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/**
 * The timing characteristics of a sequence. Frames are only meaningful relative
 * to these, so every anchor carries the sequence id that supplies them.
 */
export interface FrameRate {
  /** Nominal frames per second, e.g. 23.976, 25, 29.97, 30, 59.94, 60. */
  fps: number;
  /** Whether timecode display uses SMPTE drop-frame numbering. */
  dropFrame: boolean;
}

/**
 * A range of time within one sequence, measured in whole frames from the
 * sequence's zero point.
 *
 * `endFrames` is exclusive. A point in time (the common case for a note dropped
 * at the playhead) is represented by omitting it rather than by a zero-length
 * range, so that "a note here" and "a note across this span" stay distinct.
 */
export interface TimeAnchor {
  sequenceId: Id;
  startFrames: number;
  endFrames?: number;
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/**
 * Whoever created an item. Guest reviewers are first-class: a collaborator can
 * leave feedback with nothing but a display name, because requiring an account
 * from the client is the single fastest way to kill a review workflow.
 */
export interface Author {
  id: Id;
  name: string;
  email?: string;
  /** True when this author has no account and arrived through a share link. */
  guest: boolean;
}

/** Which surface an item was created on. Useful for UI affordances and for debugging sync. */
export type Origin = 'panel' | 'web' | 'mobile' | 'import';

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

/**
 * Fields shared by everything that syncs. `revision` increments on every local
 * mutation and is what the (future) remote adapter uses for conflict detection;
 * `deletedAt` gives us tombstones so a delete on one surface propagates instead
 * of being resurrected by a stale peer.
 */
export interface ItemBase {
  id: Id;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  revision: number;
  deletedAt?: Timestamp;
  author?: Author;
  origin: Origin;
}

export type NoteKind =
  /** A thought the creator wrote down. */
  | 'note'
  /** Something to do, with a checkbox. */
  | 'todo'
  /** Feedback from a collaborator — the web/mobile surface produces these. */
  | 'feedback';

export type NoteStatus = 'open' | 'done' | 'wontfix';

export interface Note extends ItemBase {
  kind: NoteKind;
  /** Markdown. Kept short by convention; this is not a document editor. */
  body: string;
  status: NoteStatus;
  /**
   * Where this note points. Usually one anchor, but a note can legitimately
   * apply to the same beat across a long cut and a Shorts cut-down, which is
   * why this is a list.
   */
  anchors: TimeAnchor[];
  /** Optional link to the script scene this note is about. */
  sceneId?: Id;
  /** Optional link to the storyboard frame this note is about. */
  frameId?: Id;
  /** Freeform labels. Deliberately unstructured — creators tag how they like. */
  tags: string[];
}

/**
 * One scene of a script. Modelled on the screenplay convention because that is
 * what .fdx and Fountain give us, but a YouTube script with no sluglines maps
 * cleanly too: `heading` becomes the section title and `body` the spoken words.
 */
export interface Scene extends ItemBase {
  /** Display order within the script. Contiguous, zero-based. */
  index: number;
  /** Scene number as authored ("1", "12A"). Absent for unnumbered scripts. */
  number?: string;
  /** The slugline, e.g. "INT. KITCHEN - DAY", or a plain section heading. */
  heading: string;
  /** Action, dialogue and everything else, as plain text with line breaks. */
  body: string;
  /** Where this scene landed in the cut, once the editor binds it. */
  anchors: TimeAnchor[];
}

export type ScriptFormat = 'fountain' | 'fdx' | 'plain';

export interface Script {
  id: Id;
  title: string;
  /** Format this script was imported from, used to pick a faithful exporter. */
  format: ScriptFormat;
  /** Set when the script came from a file, so we can offer "re-import". */
  sourcePath?: string;
  importedAt?: Timestamp;
  scenes: Scene[];
}

/**
 * A storyboard frame. The image is referenced, never embedded: board art lives
 * beside the project as a file so the store stays small and diffable.
 */
export interface BoardFrame extends ItemBase {
  index: number;
  /** Path relative to the project's asset directory, or an https URL. */
  imageRef?: string;
  caption: string;
  /** Shot metadata creators actually use. All optional; nobody fills these in. */
  shot?: {
    size?: string;
    movement?: string;
    lens?: string;
    durationSeconds?: number;
  };
  /** The scene this frame illustrates. */
  sceneId?: Id;
  anchors: TimeAnchor[];
}

export interface Board {
  id: Id;
  title: string;
  frames: BoardFrame[];
}

// ---------------------------------------------------------------------------
// Sequences and projects
// ---------------------------------------------------------------------------

/**
 * A sequence we know about. `premiereGuid` is Premiere's own identifier and is
 * what survives a project being renamed, moved, or opened on another machine.
 * We keep our own `id` as well so that the web and mobile surfaces — which have
 * never heard of Premiere — can still reference sequences.
 */
export interface SequenceRef {
  id: Id;
  premiereGuid?: string;
  name: string;
  frameRate: FrameRate;
  /** Total length in frames, if known. */
  durationFrames?: number;
  /** Timecode of the sequence's first frame, in frames. Usually 0 or 1 hour. */
  startFrames: number;
  lastSeenAt: Timestamp;
}

/**
 * Record of a Premiere marker we created, so that syncing is idempotent: we
 * update or remove the marker we made last time instead of piling up duplicates
 * on every sync. Keyed by item, because one item projects to at most one marker
 * per sequence.
 */
export interface MarkerLink {
  itemId: Id;
  sequenceId: Id;
  /** Frame the marker currently sits on, used to find it again. */
  startFrames: number;
  /**
   * Name we gave the marker. Position alone is not enough to identify it —
   * matching on the name as well is what guarantees a sync never modifies a
   * marker the editor placed by hand at the same frame.
   */
  markerName: string;
  /** Hash of the projected marker content, so we can skip no-op writes. */
  contentHash: string;
  syncedAt: Timestamp;
}

export interface Project {
  /** Schema version of the persisted document. Bumped by migrations. */
  schemaVersion: number;
  id: Id;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sequences: SequenceRef[];
  notes: Note[];
  scripts: Script[];
  boards: Board[];
  markerLinks: MarkerLink[];
}

/** The persisted-document schema version this build reads and writes. */
export const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Convenience unions
// ---------------------------------------------------------------------------

/** Anything that can be anchored to the timeline and projected to a marker. */
export type AnchorableItem = Note | Scene | BoardFrame;

export type ItemType = 'note' | 'scene' | 'frame';
