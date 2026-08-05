import { useRef } from 'react';
import type { BoardFrame, ProjectStore } from '@throughline/core';

interface Props {
  store: ProjectStore;
  sequenceId: string | null;
}

/**
 * The storyboard.
 *
 * Frames are stored as references, not blobs — a board of thirty 4K stills
 * embedded as base64 would make the project document unopenable. In v1 that
 * means images arrive as object URLs that live for the session; persisting them
 * into a `<project>.throughline/` asset folder is the next step and is why
 * `imageRef` is a string rather than a data URI.
 */
export function BoardTab({ store, sequenceId }: Props) {
  const board = store.ensureBoard();
  const fileInput = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList) => {
    for (const file of Array.from(files)) {
      store.addFrame({ imageRef: URL.createObjectURL(file), caption: '' });
    }
  };

  return (
    <>
      <div className="composer__row" style={{ marginBottom: 10 }}>
        <span className="composer__at">{board.frames.length} frames</span>
        <span>
          <button className="button button--quiet" onClick={() => fileInput.current?.click()}>
            Add images
          </button>
          <button className="button button--quiet" onClick={() => store.addFrame({ caption: '' })}>
            Add blank
          </button>
        </span>
      </div>

      <input
        ref={fileInput}
        type="file"
        className="visually-hidden"
        accept="image/*"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) addImages(event.target.files);
          event.target.value = '';
        }}
      />

      {board.frames.length === 0 ? (
        <div className="empty">
          <div className="empty__title">No frames yet</div>
          <div className="empty__hint">
            Drop in sketches, references or stills.
            <br />
            Each frame can point at a script scene and a spot in the cut.
          </div>
        </div>
      ) : (
        <div className="frames">
          {board.frames.map((frame) => (
            <FrameCard
              key={frame.id}
              frame={frame}
              store={store}
              boardId={board.id}
              lastIndex={board.frames.length - 1}
              sequenceId={sequenceId}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FrameCard({
  frame,
  store,
  boardId,
  lastIndex,
}: {
  frame: BoardFrame;
  store: ProjectStore;
  boardId: string;
  lastIndex: number;
  sequenceId: string | null;
}) {
  return (
    <div className="frame">
      <div className="frame__thumb">
        {frame.imageRef ? <img src={frame.imageRef} alt={frame.caption || 'Board frame'} /> : '—'}
      </div>
      <div className="frame__index">
        {frame.index + 1}
        <button
          className="button button--quiet"
          disabled={frame.index === 0}
          onClick={() => store.reorderFrames(boardId, frame.index, frame.index - 1)}
          aria-label="Move frame earlier"
        >
          ←
        </button>
        <button
          className="button button--quiet"
          disabled={frame.index === lastIndex}
          onClick={() => store.reorderFrames(boardId, frame.index, frame.index + 1)}
          aria-label="Move frame later"
        >
          →
        </button>
      </div>
      <input
        className="frame__caption"
        value={frame.caption}
        placeholder="Caption"
        onChange={(event) => store.updateFrame(frame.id, { caption: event.target.value })}
      />
    </div>
  );
}
