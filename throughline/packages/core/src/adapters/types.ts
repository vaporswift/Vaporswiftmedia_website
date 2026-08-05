/**
 * Storage and sync boundaries.
 *
 * The panel talks to a `StorageAdapter` and never to a filesystem directly, so
 * the same store code runs in Premiere (UXP filesystem), in a browser during
 * development (memory or IndexedDB), and in tests (memory). When the hosted
 * backend lands it arrives as a `SyncAdapter` implementation and nothing above
 * this line has to change.
 */

import type { Project } from '../types.js';

/** Persists the whole project document. Small enough that whole-file writes are fine. */
export interface StorageAdapter {
  /** Returns null when nothing has been saved yet. */
  load(): Promise<Project | null>;
  save(project: Project): Promise<void>;
  /** Human-readable location, shown in the panel so users know where their data is. */
  describe(): string;
}

/**
 * How a local document reconciles with a remote one.
 *
 * Deliberately coarse for v1: the panel pushes and pulls whole documents and
 * merges per item by revision. Operational transforms and CRDTs are the right
 * answer eventually, but not before there is a second surface to sync with.
 */
export interface SyncAdapter {
  /** Send local state upstream, returning whatever the server considers current. */
  push(project: Project): Promise<Project>;
  /** Fetch upstream state without sending anything. */
  pull(projectId: string): Promise<Project | null>;
  /** True when the adapter has credentials and a reachable server. */
  isAvailable(): Promise<boolean>;
}

export class StorageError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}
