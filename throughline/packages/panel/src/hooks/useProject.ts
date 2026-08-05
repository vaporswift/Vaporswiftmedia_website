import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ProjectStore,
  createEmptyProject,
  type FrameRate,
  type Project,
} from '@throughline/core';
import { getHost, type HostSequence, type PremiereHost } from '../premiere/index.js';
import { LocalStorageAdapter, UxpFileStorageAdapter } from '../storage/uxpStorage.js';

export interface PanelState {
  store: ProjectStore | null;
  host: PremiereHost;
  sequence: HostSequence | null;
  /** Our record of the active sequence, created on first sight. */
  sequenceId: string | null;
  frameRate: FrameRate;
  loading: boolean;
  error: string | null;
}

const FALLBACK_RATE: FrameRate = { fps: 30, dropFrame: false };

/**
 * Open the store for whatever project is currently in front of the user.
 *
 * Ordering matters here: we need the project path from the host *before* we can
 * decide where the document lives, so the store cannot be created at module
 * scope and the panel has a genuine loading state.
 */
export function usePanel(): PanelState {
  const host = useRef(getHost()).current;
  const [state, setState] = useState<Omit<PanelState, 'host'>>({
    store: null,
    sequence: null,
    sequenceId: null,
    frameRate: FALLBACK_RATE,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [projectPath, sequence] = await Promise.all([
          host.getProjectPath(),
          host.getActiveSequence(),
        ]);
        const seed = createEmptyProject(deriveName(projectPath));
        const storage =
          UxpFileStorageAdapter.create(projectPath, seed.id) ?? new LocalStorageAdapter();
        const store = await ProjectStore.open(storage, seed.name, { origin: 'panel' });

        const registered = sequence
          ? store.upsertSequence({
              premiereGuid: sequence.guid,
              name: sequence.name,
              frameRate: sequence.frameRate,
              durationFrames: sequence.durationFrames,
            })
          : null;

        if (cancelled) return;
        setState({
          store,
          sequence,
          sequenceId: registered?.id ?? null,
          frameRate: sequence?.frameRate ?? FALLBACK_RATE,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [host]);

  return { ...state, host };
}

/**
 * Subscribe a component to the store.
 *
 * `useSyncExternalStore` rather than a state mirror, because the store is
 * mutated from outside React (marker sync, script import) and a mirror would
 * tear on those paths.
 */
export function useProject(store: ProjectStore | null): Project | null {
  const subscribe = useCallback(
    (listener: () => void) => (store ? store.subscribe(listener) : () => {}),
    [store],
  );
  const snapshot = useCallback(() => store?.getProject() ?? null, [store]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Poll the playhead, so "add a note here" always means where the user is looking. */
export function usePlayhead(host: PremiereHost, intervalMs = 500): number | null {
  const [frames, setFrames] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const read = async () => {
      const value = await host.getPlayheadFrames();
      if (active) setFrames(value);
    };
    void read();
    // Premiere has no playhead event in the UXP API yet, so this polls. Half a
    // second is slow enough to be free and fast enough that the timecode in the
    // "add note" button never looks stale.
    const timer = setInterval(read, intervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [host, intervalMs]);

  return frames;
}

function deriveName(projectPath: string | null): string {
  if (!projectPath) return 'Untitled project';
  const base = projectPath.split(/[\\/]/).pop() ?? projectPath;
  return base.replace(/\.prproj$/i, '');
}
