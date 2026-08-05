import { describe, expect, it, vi } from 'vitest';
import { MemoryStorageAdapter } from '../src/adapters/memory.js';
import { createEmptyProject, migrate, ProjectStore } from '../src/store.js';
import { SCHEMA_VERSION } from '../src/types.js';

const RATE = { fps: 25, dropFrame: false };

async function openStore(storage = new MemoryStorageAdapter()) {
  return ProjectStore.open(storage, 'Untitled', { autosaveDelayMs: 1 });
}

describe('sequences', () => {
  it('matches on Premiere guid so renaming a sequence keeps its notes', async () => {
    const store = await openStore();
    const first = store.upsertSequence({ premiereGuid: 'g1', name: 'Rough cut', frameRate: RATE });
    store.addNote({ body: 'Attached', anchors: [{ sequenceId: first.id, startFrames: 10 }] });

    const renamed = store.upsertSequence({ premiereGuid: 'g1', name: 'Final cut v3', frameRate: RATE });

    expect(renamed.id).toBe(first.id);
    expect(store.getProject().sequences).toHaveLength(1);
    expect(store.notesForSequence(first.id)).toHaveLength(1);
  });

  it('treats a sequence with no guid as new every time', async () => {
    const store = await openStore();
    store.upsertSequence({ name: 'Nameless', frameRate: RATE });
    store.upsertSequence({ name: 'Nameless', frameRate: RATE });
    expect(store.getProject().sequences).toHaveLength(2);
  });
});

describe('notes', () => {
  it('sorts a sequence notes by position, not creation order', async () => {
    const store = await openStore();
    const sequence = store.upsertSequence({ premiereGuid: 'g', name: 'S', frameRate: RATE });
    store.addNote({ body: 'late', anchors: [{ sequenceId: sequence.id, startFrames: 900 }] });
    store.addNote({ body: 'early', anchors: [{ sequenceId: sequence.id, startFrames: 25 }] });

    expect(store.notesForSequence(sequence.id).map((note) => note.body)).toEqual(['early', 'late']);
  });

  it('keeps unanchored notes out of the sequence list but in the inbox', async () => {
    const store = await openStore();
    const sequence = store.upsertSequence({ premiereGuid: 'g', name: 'S', frameRate: RATE });
    store.addNote({ body: 'floating' });

    expect(store.notesForSequence(sequence.id)).toHaveLength(0);
    expect(store.unanchoredNotes()).toHaveLength(1);
  });

  it('bumps revision and updatedAt on every write', async () => {
    let clock = 1000;
    const store = await ProjectStore.open(new MemoryStorageAdapter(), 'x', {
      autosaveDelayMs: 1,
      now: () => (clock += 10),
    });
    const note = store.addNote({ body: 'first' });
    const updated = store.updateNote(note.id, { body: 'second' })!;

    expect(updated.revision).toBe(note.revision + 1);
    expect(updated.updatedAt).toBeGreaterThan(note.updatedAt);
  });

  it('soft-deletes so the tombstone can beat a stale copy on another surface', async () => {
    const store = await openStore();
    const note = store.addNote({ body: 'gone' });
    store.deleteNote(note.id);

    expect(store.liveNotes()).toHaveLength(0);
    expect(store.getProject().notes).toHaveLength(1);
    expect(store.getProject().notes[0]!.deletedAt).toBeDefined();
  });

  it('will not resurrect a deleted note through update', async () => {
    const store = await openStore();
    const note = store.addNote({ body: 'gone' });
    store.deleteNote(note.id);
    expect(store.updateNote(note.id, { body: 'back?' })).toBeUndefined();
    expect(store.liveNotes()).toHaveLength(0);
  });

  it('toggles a todo both ways', async () => {
    const store = await openStore();
    const note = store.addNote({ body: 'task', kind: 'todo' });
    expect(store.toggleNoteDone(note.id)!.status).toBe('done');
    expect(store.toggleNoteDone(note.id)!.status).toBe('open');
  });
});

describe('scenes', () => {
  it('replaces rather than accumulates anchors for the same sequence', async () => {
    const store = await openStore();
    const sequence = store.upsertSequence({ premiereGuid: 'g', name: 'S', frameRate: RATE });
    const script = {
      id: 's1',
      title: 'T',
      format: 'fountain' as const,
      scenes: [
        {
          id: 'scene1',
          createdAt: 0,
          updatedAt: 0,
          revision: 1,
          origin: 'import' as const,
          index: 0,
          heading: 'INT. A - DAY',
          body: '',
          anchors: [],
        },
      ],
    };
    store.setScript(script);

    store.anchorScene('scene1', { sequenceId: sequence.id, startFrames: 100 });
    store.anchorScene('scene1', { sequenceId: sequence.id, startFrames: 250 });

    const scene = store.getProject().scripts[0]!.scenes[0]!;
    expect(scene.anchors).toHaveLength(1);
    expect(scene.anchors[0]!.startFrames).toBe(250);
  });
});

describe('boards', () => {
  it('renumbers frames after a reorder so indices stay contiguous', async () => {
    const store = await openStore();
    const board = store.ensureBoard();
    for (const caption of ['a', 'b', 'c']) store.addFrame({ caption });

    store.reorderFrames(board.id, 2, 0);

    const frames = store.getProject().boards[0]!.frames;
    expect(frames.map((frame) => frame.caption)).toEqual(['c', 'a', 'b']);
    expect(frames.map((frame) => frame.index)).toEqual([0, 1, 2]);
  });

  it('only ever creates one board', async () => {
    const store = await openStore();
    expect(store.ensureBoard().id).toBe(store.ensureBoard().id);
    expect(store.getProject().boards).toHaveLength(1);
  });
});

describe('persistence', () => {
  it('notifies subscribers on every mutation', async () => {
    const store = await openStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.addNote({ body: 'x' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops notifying after unsubscribe', async () => {
    const store = await openStore();
    const listener = vi.fn();
    store.subscribe(listener)();
    store.addNote({ body: 'x' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('replaces the project object so identity checks see the change', async () => {
    const store = await openStore();
    const before = store.getProject();
    store.addNote({ body: 'x' });
    expect(store.getProject()).not.toBe(before);
  });

  it('round-trips through storage', async () => {
    const storage = new MemoryStorageAdapter();
    const store = await openStore(storage);
    store.addNote({ body: 'survives' });
    await store.flush();

    const reopened = await openStore(storage);
    expect(reopened.liveNotes().map((note) => note.body)).toEqual(['survives']);
  });

  it('debounces writes instead of saving on every keystroke', async () => {
    const storage = new MemoryStorageAdapter();
    const save = vi.spyOn(storage, 'save');
    const store = await ProjectStore.open(storage, 'x', { autosaveDelayMs: 50 });

    store.addNote({ body: 'a' });
    store.addNote({ body: 'b' });
    store.addNote({ body: 'c' });
    expect(save).not.toHaveBeenCalled();

    await store.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('migration', () => {
  it('passes through a current document untouched', () => {
    const project = createEmptyProject('x', 1);
    expect(migrate(project)).toEqual(project);
  });

  it('refuses a document from a newer build rather than mangling it', () => {
    const project = { ...createEmptyProject('x', 1), schemaVersion: SCHEMA_VERSION + 1 };
    expect(() => migrate(project)).toThrow(/newer version/i);
  });
});
