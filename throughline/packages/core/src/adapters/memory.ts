import type { Project } from '../types.js';
import type { StorageAdapter } from './types.js';

/** In-memory storage, for tests and for running the panel UI in a plain browser. */
export class MemoryStorageAdapter implements StorageAdapter {
  private document: Project | null;

  constructor(initial: Project | null = null) {
    this.document = initial ? structuredClone(initial) : null;
  }

  async load(): Promise<Project | null> {
    return this.document ? structuredClone(this.document) : null;
  }

  async save(project: Project): Promise<void> {
    this.document = structuredClone(project);
  }

  describe(): string {
    return 'in memory (nothing is being written to disk)';
  }
}
