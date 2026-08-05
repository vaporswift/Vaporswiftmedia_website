import { useRef, useState } from 'react';
import {
  framesToTimecode,
  importScript,
  scriptToFountain,
  type FrameRate,
  type ProjectStore,
  type Scene,
} from '@throughline/core';
import type { PremiereHost } from '../premiere/index.js';

interface Props {
  store: ProjectStore;
  sequenceId: string | null;
  frameRate: FrameRate;
  host: PremiereHost;
}

/**
 * The script, cut into scenes, each of which can be bound to a span of the cut.
 *
 * Binding is the whole feature. Once a scene knows where it lives, jumping to it
 * is one click, and every note or board frame attached to that scene inherits a
 * position on the timeline for free.
 */
export function ScriptTab({ store, sequenceId, frameRate, host }: Props) {
  const script = store.primaryScript;
  const fileInput = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const onFile = async (file: File) => {
    const text = await file.text();
    const imported = importScript(file.name, text);
    store.setScript(imported);
    setStatus(`Imported ${imported.scenes.length} scenes from ${file.name}`);
  };

  const exportScript = async () => {
    if (!script) return;
    const text = scriptToFountain(script);
    // Clipboard is the honest v1 export: it works identically in UXP and the
    // browser, and needs no filesystem permission dialog. A real save-as lands
    // with the sync backend, when there is somewhere to save to.
    await navigator.clipboard?.writeText(text);
    setStatus('Script copied to the clipboard as Fountain');
  };

  if (!script) {
    return (
      <div className="empty">
        <div className="empty__title">No script imported</div>
        <div className="empty__hint">
          Bring in a .fdx, .fountain or plain text file.
          <br />
          Scenes become clickable, and you can bind each one to the cut.
        </div>
        <p>
          <button className="button button--primary" onClick={() => fileInput.current?.click()}>
            Import script
          </button>
        </p>
        <FilePicker inputRef={fileInput} onFile={onFile} />
      </div>
    );
  }

  const anchoredCount = script.scenes.filter((scene) =>
    scene.anchors.some((anchor) => anchor.sequenceId === sequenceId),
  ).length;

  return (
    <>
      <div className="composer__row" style={{ marginBottom: 10 }}>
        <span className="composer__at">
          {anchoredCount} of {script.scenes.length} scenes placed
        </span>
        <span>
          <button className="button button--quiet" onClick={exportScript}>
            Export
          </button>
          <button className="button button--quiet" onClick={() => fileInput.current?.click()}>
            Replace
          </button>
        </span>
      </div>
      <FilePicker inputRef={fileInput} onFile={onFile} />
      {status && <div className="banner">{status}</div>}

      {script.scenes.map((scene) => (
        <SceneRow
          key={scene.id}
          scene={scene}
          store={store}
          sequenceId={sequenceId}
          frameRate={frameRate}
          host={host}
          expanded={expanded === scene.id}
          onToggle={() => setExpanded(expanded === scene.id ? null : scene.id)}
        />
      ))}
    </>
  );
}

function SceneRow({
  scene,
  store,
  sequenceId,
  frameRate,
  host,
  expanded,
  onToggle,
}: {
  scene: Scene;
  store: ProjectStore;
  sequenceId: string | null;
  frameRate: FrameRate;
  host: PremiereHost;
  expanded: boolean;
  onToggle: () => void;
}) {
  const anchor = scene.anchors.find((candidate) => candidate.sequenceId === sequenceId);

  const bind = async () => {
    if (!sequenceId) return;
    // Prefer the in/out selection: an editor who has marked a range is telling
    // us exactly how long the scene runs. Otherwise it is a point anchor.
    const selection = await host.getSelectionRange();
    const playhead = (await host.getPlayheadFrames()) ?? 0;
    store.anchorScene(scene.id, {
      sequenceId,
      startFrames: selection?.startFrames ?? playhead,
      endFrames: selection?.endFrames,
    });
  };

  return (
    <div className={`scene${anchor ? ' scene--anchored' : ''}`}>
      <button className="scene__header" onClick={onToggle} aria-expanded={expanded}>
        <span className="scene__number">{scene.number ?? scene.index + 1}</span>
        <span className="scene__heading">{scene.heading}</span>
        {anchor ? (
          <span
            className="timecode"
            onClick={(event) => {
              event.stopPropagation();
              void host.setPlayheadFrames(anchor.startFrames);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.stopPropagation();
                void host.setPlayheadFrames(anchor.startFrames);
              }
            }}
          >
            {framesToTimecode(anchor.startFrames, frameRate)}
          </span>
        ) : (
          <span
            className="button button--quiet"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              void bind();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.stopPropagation();
                void bind();
              }
            }}
          >
            Bind here
          </span>
        )}
      </button>
      {expanded && <div className="scene__body">{scene.body || '(no content)'}</div>}
    </div>
  );
}

/**
 * A hidden file input.
 *
 * UXP supports `<input type="file">` and the File API, so the same component
 * works in Premiere and in the browser. The alternative — UXP's native file
 * picker — would need a separate code path for development.
 */
function FilePicker({
  inputRef,
  onFile,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  onFile: (file: File) => void | Promise<void>;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      className="visually-hidden"
      accept=".fdx,.fountain,.txt,.md"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void onFile(file);
        // Reset so re-picking the same file fires change again.
        event.target.value = '';
      }}
    />
  );
}
