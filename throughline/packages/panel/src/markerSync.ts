/**
 * Executing a marker sync plan against the host.
 *
 * `planMarkerSync` in core decides *what* should happen; this decides *how* and
 * records the result. Splitting it this way means all the interesting logic —
 * what counts as a change, what gets deleted — is unit-tested, and this file
 * stays a loop with error handling.
 */

import {
  planMarkerSync,
  type FrameRate,
  type Id,
  type ProjectionOptions,
  type ProjectStore,
} from '@throughline/core';
import type { PremiereHost } from './premiere/index.js';

export interface SyncReport {
  created: number;
  updated: number;
  deleted: number;
  /** Operations that failed, with the reason. Reported, never thrown. */
  failures: Array<{ operation: string; error: string }>;
  /** True when nothing needed doing — the common case on a repeat sync. */
  noop: boolean;
}

export async function syncMarkers(
  store: ProjectStore,
  host: PremiereHost,
  sequenceId: Id,
  frameRate: FrameRate,
  options: ProjectionOptions = {},
): Promise<SyncReport> {
  const operations = planMarkerSync(store.getProject(), sequenceId, options);
  const report: SyncReport = {
    created: 0,
    updated: 0,
    deleted: 0,
    failures: [],
    noop: operations.length === 0,
  };

  for (const operation of operations) {
    if (operation.kind === 'delete') {
      const result = await host.deleteMarker(
        { startFrames: operation.previous.startFrames, name: operation.previous.markerName },
        frameRate,
      );
      if (result.ok) {
        report.deleted += 1;
        // Drop the link, or every future sync would keep trying to delete a
        // marker that is already gone.
        store.removeMarkerLink(operation.previous.itemId, sequenceId);
      } else {
        report.failures.push({ operation: 'delete', error: result.error ?? 'unknown' });
      }
      continue;
    }

    const { marker, contentHash } = operation;
    const result =
      operation.kind === 'create'
        ? await host.createMarker(marker, frameRate)
        : await host.updateMarker(
            // Find it by where and what it was, then move it to where it should be.
            { startFrames: operation.previous.startFrames, name: operation.previous.markerName },
            marker,
            frameRate,
          );

    if (result.ok) {
      if (operation.kind === 'create') report.created += 1;
      else report.updated += 1;
      store.recordMarkerLink({
        itemId: marker.itemId,
        sequenceId,
        startFrames: marker.startFrames,
        markerName: marker.name,
        contentHash,
        syncedAt: Date.now(),
      });
    } else {
      report.failures.push({ operation: operation.kind, error: result.error ?? 'unknown' });
    }
  }

  await store.flush();
  return report;
}

/** One-line summary for the panel's status bar. */
export function describeReport(report: SyncReport): string {
  if (report.noop) return 'Timeline already up to date';
  const parts = [
    report.created ? `${report.created} added` : '',
    report.updated ? `${report.updated} updated` : '',
    report.deleted ? `${report.deleted} removed` : '',
  ].filter(Boolean);
  const summary = parts.length ? parts.join(', ') : 'nothing to do';
  return report.failures.length ? `${summary} · ${report.failures.length} failed` : summary;
}
