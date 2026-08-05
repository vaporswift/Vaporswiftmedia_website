/**
 * The host boundary.
 *
 * Everything the panel needs from Premiere is expressed here and nowhere else.
 * That is deliberate: it is the one part of the codebase whose correctness
 * depends on an API we cannot exercise in CI, so it is kept small, and the rest
 * of the panel is written against this interface and runs fully against the
 * mock.
 */

import type { FrameRate, MarkerProjection } from '@throughline/core';

export interface HostSequence {
  /** Premiere's own identifier, stable across renames. */
  guid: string;
  name: string;
  frameRate: FrameRate;
  durationFrames?: number;
}

export interface HostMarkerRef {
  /** Frame the marker sits on — how we find it again to update or remove it. */
  startFrames: number;
  name: string;
}

/**
 * Result of applying one marker operation. Failures are reported rather than
 * thrown so that one bad marker cannot abandon a sync half-finished.
 */
export interface MarkerWriteResult {
  ok: boolean;
  error?: string;
}

export interface PremiereHost {
  /** False when running outside Premiere; the UI uses this to explain itself. */
  readonly available: boolean;
  /** Short description shown in the panel footer, e.g. "Premiere Pro 25.6". */
  describe(): string;

  getActiveSequence(): Promise<HostSequence | null>;
  /** Absolute path of the open project file, used to site the sidecar store. */
  getProjectPath(): Promise<string | null>;

  getPlayheadFrames(): Promise<number | null>;
  setPlayheadFrames(frames: number): Promise<void>;
  /** In and out points of the current timeline selection, if there is one. */
  getSelectionRange(): Promise<{ startFrames: number; endFrames: number } | null>;

  createMarker(marker: MarkerProjection, frameRate: FrameRate): Promise<MarkerWriteResult>;
  updateMarker(
    previous: HostMarkerRef,
    marker: MarkerProjection,
    frameRate: FrameRate,
  ): Promise<MarkerWriteResult>;
  deleteMarker(previous: HostMarkerRef, frameRate: FrameRate): Promise<MarkerWriteResult>;

  /** Export the current frame as a still, for grabbing a board frame from the cut. */
  exportFrame?(targetPath: string): Promise<string | null>;

  /** Fires when the user switches sequences or moves the playhead, if supported. */
  onSequenceChanged?(listener: () => void): () => void;
}
