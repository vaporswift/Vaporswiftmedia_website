/**
 * Where a project's Throughline document lives.
 *
 * Preference order:
 *   1. A sidecar `<project>.throughline.json` beside the .prproj, when we can
 *      see the project path. Sidecars travel with the project, survive a
 *      Premiere reinstall, and can be committed or backed up like any file.
 *   2. The plugin's own data folder, keyed by project id, when the project is
 *      unsaved or its path is unreadable.
 *
 * Embedding the document inside the .prproj was the other option and was
 * rejected: it makes the data invisible to every other surface, and a corrupt
 * project would take the notes with it.
 */

import { migrate, type Project } from '@throughline/core';
import type { StorageAdapter } from '@throughline/core';

type Unknown = Record<string, any>;

function uxpFileSystem(): Unknown | null {
  try {
    const requireFn = (globalThis as Unknown).require as ((id: string) => Unknown) | undefined;
    return requireFn?.('uxp')?.storage?.localFileSystem ?? null;
  } catch {
    return null;
  }
}

/** Sidecar path for a given .prproj path. */
export function sidecarPathFor(projectPath: string): string {
  return projectPath.replace(/\.prproj$/i, '') + '.throughline.json';
}

export class UxpFileStorageAdapter implements StorageAdapter {
  constructor(
    private readonly fileSystem: Unknown,
    private readonly path: string,
  ) {}

  /**
   * Build an adapter for the open project, or return null if the UXP
   * filesystem is not available (a plain browser during development).
   */
  static create(projectPath: string | null, projectId: string): UxpFileStorageAdapter | null {
    const fileSystem = uxpFileSystem();
    if (!fileSystem) return null;
    const path = projectPath
      ? sidecarPathFor(projectPath)
      : `plugin-data:${projectId}.throughline.json`;
    return new UxpFileStorageAdapter(fileSystem, path);
  }

  async load(): Promise<Project | null> {
    try {
      const entry = await this.entry(false);
      if (!entry) return null;
      const contents = await entry.read();
      if (!contents) return null;
      return migrate(JSON.parse(contents) as Project);
    } catch (error) {
      // A malformed or half-written document must not brick the panel. The file
      // is left untouched so the user can recover it by hand.
      console.error('[throughline] could not read the project document', error);
      return null;
    }
  }

  async save(project: Project): Promise<void> {
    const entry = await this.entry(true);
    if (!entry) throw new Error(`Cannot write to ${this.path}`);
    await entry.write(JSON.stringify(project, null, 2));
  }

  describe(): string {
    return this.path.startsWith('plugin-data:')
      ? 'the plugin data folder (this project has not been saved yet)'
      : this.path;
  }

  private async entry(create: boolean): Promise<Unknown | null> {
    if (this.path.startsWith('plugin-data:')) {
      const folder = await this.fileSystem.getDataFolder();
      const name = this.path.slice('plugin-data:'.length);
      try {
        return await folder.getEntry(name);
      } catch {
        return create ? await folder.createFile(name, { overwrite: true }) : null;
      }
    }

    const url = `file:${this.path}`;
    try {
      return await this.fileSystem.getEntryWithUrl(url);
    } catch {
      if (!create) return null;
      return this.fileSystem.createEntryWithUrl(url, { overwrite: true });
    }
  }
}

/**
 * Browser fallback, so `vite dev` keeps its data across reloads. Never used
 * inside Premiere.
 */
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly key = 'throughline:demo-project') {}

  async load(): Promise<Project | null> {
    const raw = globalThis.localStorage?.getItem(this.key);
    if (!raw) return null;
    try {
      return migrate(JSON.parse(raw) as Project);
    } catch {
      return null;
    }
  }

  async save(project: Project): Promise<void> {
    globalThis.localStorage?.setItem(this.key, JSON.stringify(project));
  }

  describe(): string {
    return 'browser local storage (demo mode)';
  }
}
