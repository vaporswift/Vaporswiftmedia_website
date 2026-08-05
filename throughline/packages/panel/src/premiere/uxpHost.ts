/**
 * The real Premiere host, via the UXP `premierepro` module.
 *
 * IMPORTANT — read before changing anything here.
 *
 * The Premiere UXP API surface is young and still moving; these calls are
 * written against the shapes in Adobe's `premiere-api` sample plugin for
 * 25.6/26.x. Every call is therefore made defensively and every failure is
 * caught and reported rather than thrown, so that an API that has drifted
 * degrades the panel to "markers unavailable" instead of white-screening it.
 *
 * Anything genuinely uncertain is marked VERIFY and must be checked against a
 * running Premiere before this ships. Keeping all of that in one file is the
 * whole point: the rest of the panel is exercised by tests against the mock.
 */

import {
  framesToTicks,
  ticksToFrames,
  type FrameRate,
  type MarkerProjection,
} from '@throughline/core';
import type { HostMarkerRef, HostSequence, MarkerWriteResult, PremiereHost } from './types.js';

/** Minimal structural typing over the host module; the real one is untyped. */
type Unknown = Record<string, any>;

function loadModule(name: string): Unknown | null {
  try {
    // UXP exposes its built-ins through CommonJS require, which Vite leaves
    // alone because both modules are marked external.
    const requireFn = (globalThis as Unknown).require as ((id: string) => Unknown) | undefined;
    return requireFn ? requireFn(name) ?? null : null;
  } catch {
    return null;
  }
}

/** True when we are running inside Premiere with the scripting API present. */
export function hasPremiereHost(): boolean {
  return loadModule('premierepro') !== null;
}

export class UxpPremiereHost implements PremiereHost {
  readonly available = true;
  private readonly ppro: Unknown;

  constructor(ppro: Unknown) {
    this.ppro = ppro;
  }

  static create(): UxpPremiereHost | null {
    const ppro = loadModule('premierepro');
    return ppro ? new UxpPremiereHost(ppro) : null;
  }

  describe(): string {
    const uxp = loadModule('uxp');
    const version = uxp?.host?.version;
    return version ? `Premiere Pro ${version}` : 'Premiere Pro';
  }

  // -- reads ----------------------------------------------------------------

  async getActiveSequence(): Promise<HostSequence | null> {
    return this.guard(async () => {
      const project = await this.ppro.Project.getActiveProject();
      if (!project) return null;
      const sequence = await project.getActiveSequence();
      if (!sequence) return null;

      const settings = await sequence.getSettings();
      const frameRate = readFrameRate(settings);

      return {
        // VERIFY: `guid` is exposed as a plain string on Sequence in 25.6; older
        // betas returned a Guid object with a `toString()`.
        guid: String(sequence.guid ?? sequence.id ?? sequence.name),
        name: String(sequence.name ?? 'Sequence'),
        frameRate,
        durationFrames: await this.readDuration(sequence, frameRate),
      };
    }, null);
  }

  async getProjectPath(): Promise<string | null> {
    return this.guard(async () => {
      const project = await this.ppro.Project.getActiveProject();
      const path = project?.path ?? (await project?.getPath?.());
      return path ? String(path) : null;
    }, null);
  }

  async getPlayheadFrames(): Promise<number | null> {
    return this.guard(async () => {
      const project = await this.ppro.Project.getActiveProject();
      const sequence = await project?.getActiveSequence();
      if (!sequence) return null;
      const position = await sequence.getPlayerPosition();
      const frameRate = readFrameRate(await sequence.getSettings());
      return ticksToFrames(readTicks(position), frameRate);
    }, null);
  }

  async setPlayheadFrames(frames: number): Promise<void> {
    await this.guard(async () => {
      const project = await this.ppro.Project.getActiveProject();
      const sequence = await project?.getActiveSequence();
      if (!sequence) return null;
      const frameRate = readFrameRate(await sequence.getSettings());
      const ticks = framesToTicks(frames, frameRate);
      await sequence.setPlayerPosition(this.tickTime(ticks));
      return null;
    }, null);
  }

  async getSelectionRange(): Promise<{ startFrames: number; endFrames: number } | null> {
    return this.guard(async () => {
      const project = await this.ppro.Project.getActiveProject();
      const sequence = await project?.getActiveSequence();
      if (!sequence) return null;
      // VERIFY: in/out point accessors. Absent in some builds, hence the guard —
      // a missing selection simply means "anchor at the playhead" upstream.
      const inPoint = await sequence.getInPoint?.();
      const outPoint = await sequence.getOutPoint?.();
      if (!inPoint || !outPoint) return null;

      const frameRate = readFrameRate(await sequence.getSettings());
      const startFrames = ticksToFrames(readTicks(inPoint), frameRate);
      const endFrames = ticksToFrames(readTicks(outPoint), frameRate);
      return endFrames > startFrames ? { startFrames, endFrames } : null;
    }, null);
  }

  // -- marker writes --------------------------------------------------------

  async createMarker(marker: MarkerProjection, frameRate: FrameRate): Promise<MarkerWriteResult> {
    return this.write(async (markers, project) => {
      const start = this.tickTime(framesToTicks(marker.startFrames, frameRate));
      await this.inTransaction(project, async () => {
        const created = await markers.createMarker(start);
        await applyMarkerFields(created, marker, frameRate, this);
      });
    });
  }

  async updateMarker(
    previous: HostMarkerRef,
    marker: MarkerProjection,
    frameRate: FrameRate,
  ): Promise<MarkerWriteResult> {
    return this.write(async (markers, project) => {
      const existing = await this.findMarker(markers, previous, frameRate);
      if (!existing) {
        // The editor deleted our marker by hand. Recreating it is the least
        // surprising behaviour: the item still exists in the panel, so the
        // marker should exist on the timeline.
        const start = this.tickTime(framesToTicks(marker.startFrames, frameRate));
        await this.inTransaction(project, async () => {
          const created = await markers.createMarker(start);
          await applyMarkerFields(created, marker, frameRate, this);
        });
        return;
      }
      await this.inTransaction(project, async () => {
        if (previous.startFrames !== marker.startFrames) {
          await existing.setStart?.(this.tickTime(framesToTicks(marker.startFrames, frameRate)));
        }
        await applyMarkerFields(existing, marker, frameRate, this);
      });
    });
  }

  async deleteMarker(previous: HostMarkerRef, frameRate: FrameRate): Promise<MarkerWriteResult> {
    return this.write(async (markers, project) => {
      const existing = await this.findMarker(markers, previous, frameRate);
      // Already gone is a success: the desired end state is "no such marker".
      if (!existing) return;
      await this.inTransaction(project, async () => {
        await markers.deleteMarker(existing);
      });
    });
  }

  // -- internals ------------------------------------------------------------

  /**
   * Locate a marker we previously wrote.
   *
   * Matched on position *and* our name prefix, so that a marker the editor
   * placed by hand at the same frame is never modified or deleted by a sync.
   */
  private async findMarker(
    markers: Unknown,
    previous: HostMarkerRef,
    frameRate: FrameRate,
  ): Promise<Unknown | null> {
    const all: Unknown[] = (await markers.getMarkers()) ?? [];
    for (const candidate of all) {
      const startFrames = ticksToFrames(readTicks(candidate.start ?? candidate.getStart?.()), frameRate);
      if (startFrames === previous.startFrames && String(candidate.name ?? '') === previous.name) {
        return candidate;
      }
    }
    return null;
  }

  /** Marker writes must happen inside a transaction to be undoable as one step. */
  private async inTransaction(project: Unknown, body: () => Promise<void>): Promise<void> {
    if (typeof project.executeTransaction === 'function') {
      await project.executeTransaction(body, 'Throughline: sync markers');
      return;
    }
    if (typeof project.lockedAccess === 'function') {
      await project.lockedAccess(body);
      return;
    }
    await body();
  }

  tickTime(ticks: bigint): Unknown {
    const TickTime = this.ppro.TickTime;
    // VERIFY: TickTime construction. The sample uses createWithTicks(string).
    if (typeof TickTime?.createWithTicks === 'function') {
      return TickTime.createWithTicks(ticks.toString());
    }
    return { ticks: ticks.toString() };
  }

  private async readDuration(sequence: Unknown, frameRate: FrameRate): Promise<number | undefined> {
    try {
      const end = await sequence.getEndTime?.();
      return end ? ticksToFrames(readTicks(end), frameRate) : undefined;
    } catch {
      return undefined;
    }
  }

  /** Resolve the markers collection for the active sequence, then run `body`. */
  private async write(
    body: (markers: Unknown, project: Unknown) => Promise<void>,
  ): Promise<MarkerWriteResult> {
    try {
      const project = await this.ppro.Project.getActiveProject();
      const sequence = await project?.getActiveSequence();
      if (!sequence) return { ok: false, error: 'No active sequence' };
      const markers = await this.ppro.Markers.getMarkers(sequence);
      if (!markers) return { ok: false, error: 'Markers unavailable for this sequence' };
      await body(markers, project);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /** Run a read that must never take the panel down with it. */
  private async guard<T>(body: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await body();
    } catch (error) {
      console.warn('[throughline] host call failed', error);
      return fallback;
    }
  }
}

async function applyMarkerFields(
  target: Unknown,
  marker: MarkerProjection,
  frameRate: FrameRate,
  host: UxpPremiereHost,
): Promise<void> {
  await target.setName?.(marker.name);
  await target.setComment?.(marker.comment);
  await target.setColor?.(marker.color);
  if (marker.endFrames !== undefined) {
    const duration = marker.endFrames - marker.startFrames;
    await target.setDuration?.(host.tickTime(framesToTicks(duration, frameRate)));
  }
}

/**
 * Read a frame rate out of Premiere's sequence settings.
 *
 * Premiere reports the frame duration in ticks rather than an fps number, so
 * fps is derived. Falls back to 30/non-drop rather than throwing, because a
 * wrong rate produces visibly wrong timecode the user can report, whereas a
 * throw here would take out the whole panel.
 */
function readFrameRate(settings: Unknown | null | undefined): FrameRate {
  const TICKS_PER_SECOND = 254016000000;
  try {
    const frameRate = settings?.videoFrameRate;
    const ticks = Number(readTicks(frameRate));
    if (Number.isFinite(ticks) && ticks > 0) {
      const fps = TICKS_PER_SECOND / ticks;
      return {
        fps: Math.round(fps * 1000) / 1000,
        // VERIFY: drop-frame flag name. `videoDisplayFormat` encodes it in some
        // builds; a boolean `dropFrame` in others.
        dropFrame: Boolean(settings?.dropFrame ?? isDropFrameFormat(settings?.videoDisplayFormat)),
      };
    }
  } catch {
    // fall through
  }
  return { fps: 30, dropFrame: false };
}

function isDropFrameFormat(format: unknown): boolean {
  return typeof format === 'string' && /drop/i.test(format);
}

/** Normalise the several shapes a TickTime can arrive in. */
function readTicks(value: unknown): bigint {
  if (value === null || value === undefined) return 0n;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.round(value));
  if (typeof value === 'string') return safeBigInt(value);
  const record = value as Unknown;
  return safeBigInt(String(record.ticks ?? record.ticksNumber ?? record.seconds ?? 0));
}

function safeBigInt(input: string): bigint {
  try {
    return BigInt(input.split('.')[0] ?? '0');
  } catch {
    return 0n;
  }
}
