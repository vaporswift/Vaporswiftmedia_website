/**
 * The project store.
 *
 * One mutable document, a subscribe/notify loop for the UI, and debounced
 * persistence. Mutations are small, explicit methods rather than a generic
 * `update(fn)` so that every write goes through `touch()` and gets its
 * `updatedAt`/`revision` bookkeeping — which is what the future sync layer will
 * rely on to resolve conflicts.
 */

import { newId } from './ids.js';
import type { StorageAdapter } from './adapters/types.js';
import {
  SCHEMA_VERSION,
  type Author,
  type Board,
  type BoardFrame,
  type FrameRate,
  type Id,
  type ItemBase,
  type MarkerLink,
  type Note,
  type NoteKind,
  type NoteStatus,
  type Origin,
  type Project,
  type Scene,
  type Script,
  type SequenceRef,
  type TimeAnchor,
} from './types.js';

export interface StoreOptions {
  /** Milliseconds to wait after the last change before writing. */
  autosaveDelayMs?: number;
  /** Which surface this store is running on; stamped onto every item created. */
  origin?: Origin;
  /** Who is creating items here. Absent on a solo creator's panel. */
  author?: Author;
  /** Injectable clock, so tests do not have to sleep. */
  now?: () => number;
}

export type Unsubscribe = () => void;

export function createEmptyProject(name: string, now = Date.now()): Project {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId('prj'),
    name,
    createdAt: now,
    updatedAt: now,
    sequences: [],
    notes: [],
    scripts: [],
    boards: [],
    markerLinks: [],
  };
}

export class ProjectStore {
  private project: Project;
  private listeners = new Set<() => void>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSave: Promise<void> | null = null;
  private readonly autosaveDelayMs: number;
  private readonly origin: Origin;
  private readonly author: Author | undefined;
  private readonly now: () => number;

  private constructor(
    project: Project,
    private readonly storage: StorageAdapter,
    options: StoreOptions,
  ) {
    this.project = project;
    this.autosaveDelayMs = options.autosaveDelayMs ?? 400;
    this.origin = options.origin ?? 'panel';
    this.author = options.author;
    this.now = options.now ?? Date.now;
  }

  /**
   * Load from storage, creating a fresh project if there is nothing saved yet.
   * Async construction is unavoidable — the alternative is a store that lies
   * about being empty for the first few frames after mount.
   */
  static async open(
    storage: StorageAdapter,
    fallbackName: string,
    options: StoreOptions = {},
  ): Promise<ProjectStore> {
    const now = options.now ?? Date.now;
    const loaded = await storage.load();
    const project = loaded ? migrate(loaded) : createEmptyProject(fallbackName, now());
    return new ProjectStore(project, storage, options);
  }

  // -- reads ----------------------------------------------------------------

  /**
   * The current document. Callers must treat it as immutable; every mutation
   * below replaces the top-level object, so React's identity check works.
   */
  getProject(): Project {
    return this.project;
  }

  get storageDescription(): string {
    return this.storage.describe();
  }

  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Live notes for a sequence, newest anchor first, tombstones excluded. */
  notesForSequence(sequenceId: Id): Note[] {
    return this.liveNotes()
      .filter((note) => note.anchors.some((anchor) => anchor.sequenceId === sequenceId))
      .sort((a, b) => anchorStart(a, sequenceId) - anchorStart(b, sequenceId));
  }

  liveNotes(): Note[] {
    return this.project.notes.filter((note) => !note.deletedAt);
  }

  /** Notes with no anchor at all — the inbox of thoughts not yet placed in time. */
  unanchoredNotes(): Note[] {
    return this.liveNotes().filter((note) => note.anchors.length === 0);
  }

  getSequence(sequenceId: Id): SequenceRef | undefined {
    return this.project.sequences.find((sequence) => sequence.id === sequenceId);
  }

  findSequenceByGuid(guid: string): SequenceRef | undefined {
    return this.project.sequences.find((sequence) => sequence.premiereGuid === guid);
  }

  // -- sequences ------------------------------------------------------------

  /**
   * Record a sequence we have seen in Premiere, matching on Premiere's own guid
   * so that renaming a sequence updates the existing record instead of orphaning
   * every note attached to it.
   */
  upsertSequence(input: {
    premiereGuid?: string;
    name: string;
    frameRate: FrameRate;
    durationFrames?: number;
    startFrames?: number;
  }): SequenceRef {
    const existing = input.premiereGuid ? this.findSequenceByGuid(input.premiereGuid) : undefined;
    const stamped: SequenceRef = {
      id: existing?.id ?? newId('seq'),
      premiereGuid: input.premiereGuid,
      name: input.name,
      frameRate: input.frameRate,
      durationFrames: input.durationFrames,
      startFrames: input.startFrames ?? existing?.startFrames ?? 0,
      lastSeenAt: this.now(),
    };
    this.project = {
      ...this.project,
      sequences: existing
        ? this.project.sequences.map((sequence) =>
            sequence.id === existing.id ? stamped : sequence,
          )
        : [...this.project.sequences, stamped],
    };
    this.touch();
    return stamped;
  }

  // -- notes ----------------------------------------------------------------

  addNote(input: {
    body: string;
    kind?: NoteKind;
    anchors?: TimeAnchor[];
    tags?: string[];
    sceneId?: Id;
    frameId?: Id;
  }): Note {
    const note: Note = {
      ...this.newItemBase(),
      kind: input.kind ?? 'note',
      body: input.body,
      status: 'open',
      anchors: input.anchors ?? [],
      tags: input.tags ?? [],
      sceneId: input.sceneId,
      frameId: input.frameId,
    };
    this.project = { ...this.project, notes: [...this.project.notes, note] };
    this.touch();
    return note;
  }

  updateNote(id: Id, patch: Partial<Pick<Note, 'body' | 'status' | 'kind' | 'tags' | 'anchors' | 'sceneId' | 'frameId'>>): Note | undefined {
    let updated: Note | undefined;
    this.project = {
      ...this.project,
      notes: this.project.notes.map((note) => {
        if (note.id !== id || note.deletedAt) return note;
        updated = { ...note, ...patch, updatedAt: this.now(), revision: note.revision + 1 };
        return updated;
      }),
    };
    if (updated) this.touch();
    return updated;
  }

  /** Toggle a todo between open and done. No-ops on notes that are not todos. */
  toggleNoteDone(id: Id): Note | undefined {
    const note = this.project.notes.find((candidate) => candidate.id === id);
    if (!note) return undefined;
    const status: NoteStatus = note.status === 'done' ? 'open' : 'done';
    return this.updateNote(id, { status });
  }

  /**
   * Soft delete. Tombstones stay in the document so that a delete made in the
   * panel while offline still wins over a stale copy on the web surface.
   */
  deleteNote(id: Id): void {
    const timestamp = this.now();
    this.project = {
      ...this.project,
      notes: this.project.notes.map((note) =>
        note.id === id
          ? { ...note, deletedAt: timestamp, updatedAt: timestamp, revision: note.revision + 1 }
          : note,
      ),
    };
    this.touch();
  }

  // -- scripts --------------------------------------------------------------

  /** Replace the project's scripts with a freshly imported one. */
  setScript(script: Script): void {
    this.project = {
      ...this.project,
      scripts: [script, ...this.project.scripts.filter((existing) => existing.id !== script.id)],
    };
    this.touch();
  }

  get primaryScript(): Script | undefined {
    return this.project.scripts[0];
  }

  /**
   * Bind a scene to a span of the timeline. This is the single most important
   * write in the product: it is the moment a written scene becomes a located
   * thing that notes and board frames can hang off.
   */
  anchorScene(sceneId: Id, anchor: TimeAnchor): Scene | undefined {
    let updated: Scene | undefined;
    this.project = {
      ...this.project,
      scripts: this.project.scripts.map((script) => ({
        ...script,
        scenes: script.scenes.map((scene) => {
          if (scene.id !== sceneId) return scene;
          updated = {
            ...scene,
            anchors: replaceAnchor(scene.anchors, anchor),
            updatedAt: this.now(),
            revision: scene.revision + 1,
          };
          return updated;
        }),
      })),
    };
    if (updated) this.touch();
    return updated;
  }

  // -- boards ---------------------------------------------------------------

  ensureBoard(title = 'Storyboard'): Board {
    const existing = this.project.boards[0];
    if (existing) return existing;
    const board: Board = { id: newId('brd'), title, frames: [] };
    this.project = { ...this.project, boards: [board] };
    this.touch();
    return board;
  }

  addFrame(input: { caption?: string; imageRef?: string; sceneId?: Id; anchors?: TimeAnchor[] }): BoardFrame {
    const board = this.ensureBoard();
    const frame: BoardFrame = {
      ...this.newItemBase(),
      index: board.frames.length,
      caption: input.caption ?? '',
      imageRef: input.imageRef,
      sceneId: input.sceneId,
      anchors: input.anchors ?? [],
    };
    this.project = {
      ...this.project,
      boards: this.project.boards.map((candidate) =>
        candidate.id === board.id ? { ...candidate, frames: [...candidate.frames, frame] } : candidate,
      ),
    };
    this.touch();
    return frame;
  }

  /** Move a frame to a new position, renumbering the rest to stay contiguous. */
  reorderFrames(boardId: Id, fromIndex: number, toIndex: number): void {
    this.project = {
      ...this.project,
      boards: this.project.boards.map((board) => {
        if (board.id !== boardId) return board;
        const frames = [...board.frames];
        const [moved] = frames.splice(fromIndex, 1);
        if (!moved) return board;
        frames.splice(toIndex, 0, moved);
        return {
          ...board,
          frames: frames.map((frame, index) => ({ ...frame, index })),
        };
      }),
    };
    this.touch();
  }

  updateFrame(frameId: Id, patch: Partial<Pick<BoardFrame, 'caption' | 'imageRef' | 'sceneId' | 'anchors' | 'shot'>>): void {
    this.project = {
      ...this.project,
      boards: this.project.boards.map((board) => ({
        ...board,
        frames: board.frames.map((frame) =>
          frame.id === frameId
            ? { ...frame, ...patch, updatedAt: this.now(), revision: frame.revision + 1 }
            : frame,
        ),
      })),
    };
    this.touch();
  }

  // -- marker links ---------------------------------------------------------

  getMarkerLink(itemId: Id, sequenceId: Id): MarkerLink | undefined {
    return this.project.markerLinks.find(
      (link) => link.itemId === itemId && link.sequenceId === sequenceId,
    );
  }

  recordMarkerLink(link: MarkerLink): void {
    const others = this.project.markerLinks.filter(
      (existing) => !(existing.itemId === link.itemId && existing.sequenceId === link.sequenceId),
    );
    this.project = { ...this.project, markerLinks: [...others, link] };
    this.touch();
  }

  /**
   * Forget a marker link after its marker has been removed from the timeline.
   *
   * Without this a deleted item would keep its link forever and every later
   * sync would try to delete the same already-gone marker.
   */
  removeMarkerLink(itemId: Id, sequenceId: Id): void {
    const remaining = this.project.markerLinks.filter(
      (link) => !(link.itemId === itemId && link.sequenceId === sequenceId),
    );
    if (remaining.length === this.project.markerLinks.length) return;
    this.project = { ...this.project, markerLinks: remaining };
    this.touch();
  }

  // -- persistence ----------------------------------------------------------

  /** Write immediately, cancelling any debounced save. */
  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.pendingSave = this.storage.save(this.project);
    await this.pendingSave;
    this.pendingSave = null;
  }

  private newItemBase(): ItemBase {
    const timestamp = this.now();
    return {
      id: newId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      revision: 1,
      origin: this.origin,
      author: this.author,
    };
  }

  /** Stamp the document, tell the UI, and schedule a write. */
  private touch(): void {
    this.project = { ...this.project, updatedAt: this.now() };
    for (const listener of this.listeners) listener();
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.storage.save(this.project);
    }, this.autosaveDelayMs);
  }
}

/** Start of an item's anchor in a given sequence, or +Infinity if it has none. */
function anchorStart(item: { anchors: TimeAnchor[] }, sequenceId: Id): number {
  const anchor = item.anchors.find((candidate) => candidate.sequenceId === sequenceId);
  return anchor ? anchor.startFrames : Number.POSITIVE_INFINITY;
}

/** One anchor per sequence: adding a second replaces the first. */
function replaceAnchor(anchors: TimeAnchor[], anchor: TimeAnchor): TimeAnchor[] {
  return [...anchors.filter((existing) => existing.sequenceId !== anchor.sequenceId), anchor];
}

/**
 * Bring an older persisted document up to the current schema.
 *
 * There is nothing to migrate yet, but the hook exists from commit one because
 * retrofitting migrations onto a format users already have on disk is the kind
 * of thing that goes badly.
 */
export function migrate(project: Project): Project {
  if (project.schemaVersion === SCHEMA_VERSION) return project;
  if (project.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `This project was written by a newer version of Throughline (schema ${project.schemaVersion}). Update the panel to open it.`,
    );
  }
  return { ...project, schemaVersion: SCHEMA_VERSION };
}
