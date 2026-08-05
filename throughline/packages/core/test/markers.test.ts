import { describe, expect, it } from 'vitest';
import { MemoryStorageAdapter } from '../src/adapters/memory.js';
import { hashMarker, MARKER_PREFIX, MarkerColor, planMarkerSync, projectSequence } from '../src/markers.js';
import { ProjectStore } from '../src/store.js';
import { importScript } from '../src/script/index.js';
import type { MarkerOperation, SequenceRef } from '../src/index.js';

async function fixture() {
  const store = await ProjectStore.open(new MemoryStorageAdapter(), 'Test project', {
    autosaveDelayMs: 5,
  });
  const sequence = store.upsertSequence({
    premiereGuid: 'guid-main',
    name: 'Main cut',
    frameRate: { fps: 23.976, dropFrame: false },
  });
  return { store, sequence };
}

/** Apply a plan the way the panel does, so links stay in step with the timeline. */
function commit(store: ProjectStore, operations: MarkerOperation[], sequenceId: string) {
  for (const operation of operations) {
    if (operation.kind === 'delete') {
      store.removeMarkerLink(operation.previous.itemId, sequenceId);
      continue;
    }
    store.recordMarkerLink({
      itemId: operation.marker.itemId,
      sequenceId,
      startFrames: operation.marker.startFrames,
      markerName: operation.marker.name,
      contentHash: operation.contentHash,
      syncedAt: 1,
    });
  }
}

describe('projection', () => {
  it('only projects items anchored to the sequence being synced', async () => {
    const { store, sequence } = await fixture();
    const other: SequenceRef = store.upsertSequence({
      premiereGuid: 'guid-shorts',
      name: 'Shorts cut',
      frameRate: { fps: 30, dropFrame: false },
    });

    store.addNote({ body: 'On the main cut', anchors: [{ sequenceId: sequence.id, startFrames: 100 }] });
    store.addNote({ body: 'On the shorts cut', anchors: [{ sequenceId: other.id, startFrames: 5 }] });
    store.addNote({ body: 'Not placed anywhere yet' });

    const markers = projectSequence(store.getProject(), sequence.id);
    expect(markers).toHaveLength(1);
    expect(markers[0]!.name).toContain('On the main cut');
  });

  it('projects a note anchored to two cuts onto both', async () => {
    const { store, sequence } = await fixture();
    const other = store.upsertSequence({
      premiereGuid: 'guid-shorts',
      name: 'Shorts cut',
      frameRate: { fps: 30, dropFrame: false },
    });
    store.addNote({
      body: 'Fix the audio pop',
      anchors: [
        { sequenceId: sequence.id, startFrames: 900 },
        { sequenceId: other.id, startFrames: 12 },
      ],
    });

    expect(projectSequence(store.getProject(), sequence.id)).toHaveLength(1);
    expect(projectSequence(store.getProject(), other.id)).toHaveLength(1);
  });

  it('hides completed notes unless asked for them', async () => {
    const { store, sequence } = await fixture();
    const note = store.addNote({
      body: 'Colour pass',
      kind: 'todo',
      anchors: [{ sequenceId: sequence.id, startFrames: 10 }],
    });
    store.toggleNoteDone(note.id);

    expect(projectSequence(store.getProject(), sequence.id)).toHaveLength(0);
    expect(
      projectSequence(store.getProject(), sequence.id, { includeCompleted: true }),
    ).toHaveLength(1);
  });

  it('colours feedback differently from the creator own notes', async () => {
    const { store, sequence } = await fixture();
    store.addNote({ body: 'Mine', anchors: [{ sequenceId: sequence.id, startFrames: 1 }] });
    store.addNote({
      body: 'Theirs',
      kind: 'feedback',
      anchors: [{ sequenceId: sequence.id, startFrames: 2 }],
    });

    const [mine, theirs] = projectSequence(store.getProject(), sequence.id);
    expect(mine!.color).toBe(MarkerColor.blue);
    expect(theirs!.color).toBe(MarkerColor.red);
  });

  it('prefixes every marker so a later sync can tell ours from the editor own', async () => {
    const { store, sequence } = await fixture();
    store.addNote({ body: 'Anything', anchors: [{ sequenceId: sequence.id, startFrames: 1 }] });
    expect(projectSequence(store.getProject(), sequence.id)[0]!.name.startsWith(MARKER_PREFIX)).toBe(
      true,
    );
  });

  it('sorts by position so markers are written in timeline order', async () => {
    const { store, sequence } = await fixture();
    for (const frame of [500, 20, 900, 100]) {
      store.addNote({ body: `At ${frame}`, anchors: [{ sequenceId: sequence.id, startFrames: frame }] });
    }
    const positions = projectSequence(store.getProject(), sequence.id).map((m) => m.startFrames);
    expect(positions).toEqual([20, 100, 500, 900]);
  });

  it('carries a span through to the marker so it is not flattened to a point', async () => {
    const { store, sequence } = await fixture();
    store.addNote({
      body: 'This whole section drags',
      anchors: [{ sequenceId: sequence.id, startFrames: 100, endFrames: 400 }],
    });
    expect(projectSequence(store.getProject(), sequence.id)[0]!.endFrames).toBe(400);
  });

  it('projects anchored script scenes', async () => {
    const { store, sequence } = await fixture();
    const script = importScript('a.fountain', 'INT. A - DAY\n\nOne.\n\nINT. B - DAY\n\nTwo.');
    store.setScript(script);
    store.anchorScene(script.scenes[1]!.id, {
      sequenceId: sequence.id,
      startFrames: 240,
      endFrames: 480,
    });

    const markers = projectSequence(store.getProject(), sequence.id);
    expect(markers).toHaveLength(1);
    expect(markers[0]!.name).toContain('INT. B - DAY');
    expect(markers[0]!.color).toBe(MarkerColor.purple);
  });
});

describe('sync planning', () => {
  it('creates a marker the first time and nothing the second', async () => {
    const { store, sequence } = await fixture();
    store.addNote({ body: 'Trim the intro', anchors: [{ sequenceId: sequence.id, startFrames: 48 }] });

    const first = planMarkerSync(store.getProject(), sequence.id);
    expect(first).toHaveLength(1);
    expect(first[0]!.kind).toBe('create');

    commit(store, first, sequence.id);
    expect(planMarkerSync(store.getProject(), sequence.id)).toHaveLength(0);
  });

  it('updates rather than duplicating when the text changes', async () => {
    const { store, sequence } = await fixture();
    const note = store.addNote({
      body: 'Trim the intro',
      anchors: [{ sequenceId: sequence.id, startFrames: 48 }],
    });
    commit(store, planMarkerSync(store.getProject(), sequence.id), sequence.id);

    store.updateNote(note.id, { body: 'Trim the intro harder' });
    const plan = planMarkerSync(store.getProject(), sequence.id);
    expect(plan).toHaveLength(1);
    expect(plan[0]!.kind).toBe('update');
  });

  it('updates when only the position changes', async () => {
    const { store, sequence } = await fixture();
    const note = store.addNote({
      body: 'Same words',
      anchors: [{ sequenceId: sequence.id, startFrames: 48 }],
    });
    commit(store, planMarkerSync(store.getProject(), sequence.id), sequence.id);

    store.updateNote(note.id, { anchors: [{ sequenceId: sequence.id, startFrames: 96 }] });
    const plan = planMarkerSync(store.getProject(), sequence.id);
    expect(plan).toHaveLength(1);
    expect(plan[0]!.kind).toBe('update');
    if (plan[0]!.kind === 'update') {
      expect(plan[0]!.previous.startFrames).toBe(48);
      expect(plan[0]!.marker.startFrames).toBe(96);
    }
  });

  it('deletes the marker when the note is deleted', async () => {
    const { store, sequence } = await fixture();
    const note = store.addNote({ body: 'Temporary', anchors: [{ sequenceId: sequence.id, startFrames: 1 }] });
    commit(store, planMarkerSync(store.getProject(), sequence.id), sequence.id);

    store.deleteNote(note.id);
    const plan = planMarkerSync(store.getProject(), sequence.id);
    expect(plan).toHaveLength(1);
    expect(plan[0]!.kind).toBe('delete');
  });

  it('deletes the marker when a todo is completed', async () => {
    const { store, sequence } = await fixture();
    const note = store.addNote({
      body: 'Add lower third',
      kind: 'todo',
      anchors: [{ sequenceId: sequence.id, startFrames: 300 }],
    });
    commit(store, planMarkerSync(store.getProject(), sequence.id), sequence.id);

    store.toggleNoteDone(note.id);
    expect(planMarkerSync(store.getProject(), sequence.id)[0]!.kind).toBe('delete');
  });

  it('deletes the marker when a note is unanchored from this sequence only', async () => {
    const { store, sequence } = await fixture();
    const other = store.upsertSequence({
      premiereGuid: 'guid-2',
      name: 'Second',
      frameRate: { fps: 25, dropFrame: false },
    });
    const note = store.addNote({
      body: 'Moved',
      anchors: [{ sequenceId: sequence.id, startFrames: 10 }],
    });
    commit(store, planMarkerSync(store.getProject(), sequence.id), sequence.id);

    store.updateNote(note.id, { anchors: [{ sequenceId: other.id, startFrames: 10 }] });
    expect(planMarkerSync(store.getProject(), sequence.id)[0]!.kind).toBe('delete');
    expect(planMarkerSync(store.getProject(), other.id)[0]!.kind).toBe('create');
  });

  it('stops asking for a delete once the marker is gone', async () => {
    const { store, sequence } = await fixture();
    const note = store.addNote({ body: 'Temporary', anchors: [{ sequenceId: sequence.id, startFrames: 1 }] });
    commit(store, planMarkerSync(store.getProject(), sequence.id), sequence.id);
    store.deleteNote(note.id);

    // First sync removes the marker; a second must not try to remove it again.
    commit(store, planMarkerSync(store.getProject(), sequence.id), sequence.id);
    expect(planMarkerSync(store.getProject(), sequence.id)).toHaveLength(0);
  });

  it('remembers the marker name so a hand-placed marker at the same frame is safe', async () => {
    const { store, sequence } = await fixture();
    store.addNote({ body: 'Ours', anchors: [{ sequenceId: sequence.id, startFrames: 42 }] });
    const [operation] = planMarkerSync(store.getProject(), sequence.id);

    expect(operation!.kind).toBe('create');
    if (operation!.kind === 'create') {
      expect(operation!.marker.name).toContain('Ours');
    }
    commit(store, [operation!], sequence.id);
    expect(store.getMarkerLink(store.liveNotes()[0]!.id, sequence.id)!.markerName).toContain('Ours');
  });

  it('is stable across repeated planning with no commits in between', async () => {
    const { store, sequence } = await fixture();
    store.addNote({ body: 'Once', anchors: [{ sequenceId: sequence.id, startFrames: 7 }] });
    const a = planMarkerSync(store.getProject(), sequence.id);
    const b = planMarkerSync(store.getProject(), sequence.id);
    expect(a).toEqual(b);
  });
});

describe('content hashing', () => {
  it('changes when any visible field changes', async () => {
    const { store, sequence } = await fixture();
    store.addNote({ body: 'Base', anchors: [{ sequenceId: sequence.id, startFrames: 5 }] });
    const [marker] = projectSequence(store.getProject(), sequence.id);
    const base = hashMarker(marker!);

    expect(hashMarker({ ...marker!, name: 'other' })).not.toBe(base);
    expect(hashMarker({ ...marker!, comment: 'other' })).not.toBe(base);
    expect(hashMarker({ ...marker!, color: MarkerColor.red })).not.toBe(base);
    expect(hashMarker({ ...marker!, endFrames: 90 })).not.toBe(base);
    expect(hashMarker({ ...marker! })).toBe(base);
  });
});
