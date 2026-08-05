import { useState } from 'react';
import { usePanel, usePlayhead, useProject } from './hooks/useProject.js';
import { describeReport, syncMarkers } from './markerSync.js';
import { BoardTab } from './ui/BoardTab.js';
import { NotesTab } from './ui/NotesTab.js';
import { ScriptTab } from './ui/ScriptTab.js';
import './ui/styles.css';

type Tab = 'notes' | 'script' | 'board';

export function App() {
  const { store, host, sequence, sequenceId, frameRate, loading, error } = usePanel();
  const project = useProject(store);
  const playheadFrames = usePlayhead(host);
  const [tab, setTab] = useState<Tab>('notes');
  const [status, setStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  if (loading) {
    return <div className="panel"><div className="empty">Opening project…</div></div>;
  }
  if (error || !store || !project) {
    return (
      <div className="panel">
        <div className="empty">
          <div className="empty__title">Throughline could not start</div>
          <div className="empty__hint">{error ?? 'The project document could not be opened.'}</div>
        </div>
      </div>
    );
  }

  const noteCount = sequenceId ? store.notesForSequence(sequenceId).length : 0;
  const sceneCount = store.primaryScript?.scenes.length ?? 0;
  const frameCount = project.boards[0]?.frames.length ?? 0;

  const sync = async () => {
    if (!sequenceId) return;
    setSyncing(true);
    try {
      const report = await syncMarkers(store, host, sequenceId, frameRate);
      setStatus(describeReport(report));
    } catch (syncError) {
      setStatus(syncError instanceof Error ? syncError.message : String(syncError));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="panel">
      <header className="header">
        <div className="header__project" title={project.name}>
          {project.name}
        </div>
        <div className="header__sequence">
          {sequence ? (
            <>
              <span>{sequence.name}</span>
              <span className="badge">
                {frameRate.fps}
                {frameRate.dropFrame ? ' DF' : ''}
              </span>
            </>
          ) : (
            <span>No sequence open</span>
          )}
        </div>
        <nav className="tabs" role="tablist">
          <TabButton id="notes" active={tab} onSelect={setTab} count={noteCount}>
            Notes
          </TabButton>
          <TabButton id="script" active={tab} onSelect={setTab} count={sceneCount}>
            Script
          </TabButton>
          <TabButton id="board" active={tab} onSelect={setTab} count={frameCount}>
            Board
          </TabButton>
        </nav>
      </header>

      <main className="body">
        {!host.available && (
          <div className="banner">
            Demo mode — Premiere is not connected, so timecodes and markers are simulated.
          </div>
        )}
        {tab === 'notes' && (
          <NotesTab
            store={store}
            sequenceId={sequenceId}
            frameRate={frameRate}
            playheadFrames={playheadFrames}
            host={host}
          />
        )}
        {tab === 'script' && (
          <ScriptTab store={store} sequenceId={sequenceId} frameRate={frameRate} host={host} />
        )}
        {tab === 'board' && <BoardTab store={store} sequenceId={sequenceId} />}
      </main>

      <footer className="footer">
        <span className="footer__status" title={store.storageDescription}>
          {status ?? host.describe()}
        </span>
        <button
          className="button button--primary"
          onClick={sync}
          disabled={syncing || !sequenceId}
          title="Write notes and placed scenes to the timeline as markers"
        >
          {syncing ? 'Syncing…' : 'Sync to timeline'}
        </button>
      </footer>
    </div>
  );
}

function TabButton({
  id,
  active,
  onSelect,
  count,
  children,
}: {
  id: Tab;
  active: Tab;
  onSelect: (tab: Tab) => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      className="tab"
      role="tab"
      aria-selected={active === id}
      onClick={() => onSelect(id)}
    >
      {children}
      {count > 0 && <span className="tab__count">{count}</span>}
    </button>
  );
}
