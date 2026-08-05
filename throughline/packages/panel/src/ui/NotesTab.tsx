import { useState } from 'react';
import { framesToTimecode, type FrameRate, type Note, type ProjectStore } from '@throughline/core';
import type { PremiereHost } from '../premiere/index.js';

interface Props {
  store: ProjectStore;
  sequenceId: string | null;
  frameRate: FrameRate;
  playheadFrames: number | null;
  host: PremiereHost;
}

/**
 * Notes, todos and incoming feedback for the active sequence, in timeline order.
 *
 * The composer defaults to anchoring at the playhead, because the overwhelmingly
 * common action is "something is wrong *here*". Writing a note without placing
 * it is possible but takes an extra click, not the other way round.
 */
export function NotesTab({ store, sequenceId, frameRate, playheadFrames, host }: Props) {
  const [draft, setDraft] = useState('');
  const [asTodo, setAsTodo] = useState(false);
  const [anchorAtPlayhead, setAnchorAtPlayhead] = useState(true);

  const anchored = sequenceId ? store.notesForSequence(sequenceId) : [];
  const loose = store.unanchoredNotes();

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;

    // Read the playhead again at submit time. The polled value can be up to
    // half a second stale, and a note landing half a second off is exactly the
    // kind of small wrongness that makes a tool feel untrustworthy.
    const live = anchorAtPlayhead ? ((await host.getPlayheadFrames()) ?? playheadFrames) : null;
    const selection = anchorAtPlayhead ? await host.getSelectionRange() : null;

    store.addNote({
      body,
      kind: asTodo ? 'todo' : 'note',
      anchors:
        sequenceId && live !== null
          ? [
              {
                sequenceId,
                startFrames: selection?.startFrames ?? live,
                endFrames: selection?.endFrames,
              },
            ]
          : [],
    });
    setDraft('');
  };

  return (
    <>
      <div className="composer">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter alone inserts a newline; notes are often two lines.
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="What needs to change here?"
          aria-label="New note"
        />
        <div className="composer__row">
          <label className="composer__at">
            <input
              type="checkbox"
              className="checkbox"
              checked={anchorAtPlayhead}
              onChange={(event) => setAnchorAtPlayhead(event.target.checked)}
            />{' '}
            {anchorAtPlayhead && playheadFrames !== null
              ? `at ${framesToTimecode(playheadFrames, frameRate)}`
              : 'unplaced'}
          </label>
          <div className="composer__row">
            <label className="composer__at">
              <input
                type="checkbox"
                className="checkbox"
                checked={asTodo}
                onChange={(event) => setAsTodo(event.target.checked)}
              />{' '}
              to-do
            </label>
            <button className="button button--primary" onClick={submit} disabled={!draft.trim()}>
              Add
            </button>
          </div>
        </div>
      </div>

      {anchored.length === 0 && loose.length === 0 ? (
        <div className="empty">
          <div className="empty__title">No notes yet</div>
          <div className="empty__hint">
            Park the playhead on the problem and write it down.
            <br />
            Notes become timeline markers when you sync.
          </div>
        </div>
      ) : null}

      {anchored.length > 0 && (
        <div className="list">
          {anchored.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              store={store}
              sequenceId={sequenceId!}
              frameRate={frameRate}
              host={host}
            />
          ))}
        </div>
      )}

      {loose.length > 0 && (
        <>
          <div className="list__heading">Not placed in the timeline</div>
          <div className="list">
            {loose.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                store={store}
                sequenceId={sequenceId}
                frameRate={frameRate}
                host={host}
                playheadFrames={playheadFrames}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function NoteRow({
  note,
  store,
  sequenceId,
  frameRate,
  host,
  playheadFrames,
}: {
  note: Note;
  store: ProjectStore;
  sequenceId: string | null;
  frameRate: FrameRate;
  host: PremiereHost;
  playheadFrames?: number | null;
}) {
  const anchor = note.anchors.find((candidate) => candidate.sequenceId === sequenceId);
  const done = note.status === 'done';
  const modifier = done ? 'done' : note.kind;

  return (
    <div className={`row row--${modifier}`}>
      {note.kind === 'todo' && (
        <input
          type="checkbox"
          className="checkbox"
          checked={done}
          onChange={() => store.toggleNoteDone(note.id)}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
        />
      )}
      <div className="row__main">
        <div className="row__body">{note.body}</div>
        <div className="row__meta">
          {anchor ? (
            <button
              className="timecode"
              onClick={() => void host.setPlayheadFrames(anchor.startFrames)}
              title="Move the playhead here"
            >
              {framesToTimecode(anchor.startFrames, frameRate)}
              {anchor.endFrames !== undefined
                ? `–${framesToTimecode(anchor.endFrames, frameRate)}`
                : ''}
            </button>
          ) : (
            sequenceId && (
              <button
                className="button button--quiet"
                onClick={async () => {
                  const frames = (await host.getPlayheadFrames()) ?? playheadFrames ?? 0;
                  store.updateNote(note.id, {
                    anchors: [...note.anchors, { sequenceId, startFrames: frames }],
                  });
                }}
              >
                Place at playhead
              </button>
            )
          )}
          {note.kind === 'feedback' && note.author && (
            <span className="badge">{note.author.name}</span>
          )}
        </div>
      </div>
      <div className="row__actions">
        <button
          className="button button--quiet"
          onClick={() => store.deleteNote(note.id)}
          aria-label="Delete note"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}
