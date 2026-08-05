/**
 * A fake Premiere, so the panel is fully usable in a browser.
 *
 * This is not a testing afterthought — it is how the UI gets built. Reloading a
 * UXP plugin to check a padding change is a miserable loop, and a mock host
 * that behaves plausibly means everything except the marker writes themselves
 * can be developed at `vite dev` speed.
 */

import type { FrameRate, MarkerProjection } from '@throughline/core';
import type { HostMarkerRef, HostSequence, MarkerWriteResult, PremiereHost } from './types.js';

interface MockMarker {
  startFrames: number;
  name: string;
  comment: string;
  color: number;
  endFrames?: number;
}

export class MockPremiereHost implements PremiereHost {
  readonly available = false;
  private playheadFrames = 0;
  private readonly markers: MockMarker[] = [];
  private listeners = new Set<() => void>();

  constructor(
    private readonly sequence: HostSequence = {
      guid: 'mock-sequence-0001',
      name: 'Demo cut',
      frameRate: { fps: 23.976, dropFrame: false },
      durationFrames: 24 * 60 * 8,
    },
  ) {}

  describe(): string {
    return 'demo mode — Premiere is not connected';
  }

  async getActiveSequence(): Promise<HostSequence | null> {
    return this.sequence;
  }

  async getProjectPath(): Promise<string | null> {
    return null;
  }

  async getPlayheadFrames(): Promise<number | null> {
    return this.playheadFrames;
  }

  async setPlayheadFrames(frames: number): Promise<void> {
    this.playheadFrames = Math.max(0, Math.round(frames));
    for (const listener of this.listeners) listener();
  }

  async getSelectionRange(): Promise<{ startFrames: number; endFrames: number } | null> {
    return null;
  }

  async createMarker(marker: MarkerProjection): Promise<MarkerWriteResult> {
    this.markers.push(toMockMarker(marker));
    return { ok: true };
  }

  async updateMarker(previous: HostMarkerRef, marker: MarkerProjection): Promise<MarkerWriteResult> {
    const index = this.indexOf(previous);
    if (index === -1) {
      this.markers.push(toMockMarker(marker));
    } else {
      this.markers[index] = toMockMarker(marker);
    }
    return { ok: true };
  }

  async deleteMarker(previous: HostMarkerRef): Promise<MarkerWriteResult> {
    const index = this.indexOf(previous);
    if (index !== -1) this.markers.splice(index, 1);
    return { ok: true };
  }

  onSequenceChanged(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Inspectable state, for tests and for the demo-mode debug view. */
  getMarkers(): readonly MockMarker[] {
    return this.markers;
  }

  get frameRate(): FrameRate {
    return this.sequence.frameRate;
  }

  private indexOf(previous: HostMarkerRef): number {
    return this.markers.findIndex(
      (marker) => marker.startFrames === previous.startFrames && marker.name === previous.name,
    );
  }
}

function toMockMarker(marker: MarkerProjection): MockMarker {
  return {
    startFrames: marker.startFrames,
    name: marker.name,
    comment: marker.comment,
    color: marker.color,
    endFrames: marker.endFrames,
  };
}
