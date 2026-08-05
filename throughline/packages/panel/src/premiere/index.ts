import { MockPremiereHost } from './mockHost.js';
import { UxpPremiereHost } from './uxpHost.js';
import type { PremiereHost } from './types.js';

export type { PremiereHost, HostSequence, HostMarkerRef, MarkerWriteResult } from './types.js';
export { MockPremiereHost } from './mockHost.js';
export { UxpPremiereHost, hasPremiereHost } from './uxpHost.js';

let cached: PremiereHost | null = null;

/**
 * The host for this runtime: real Premiere when the scripting module is there,
 * a mock otherwise. Resolved once, because the answer cannot change while the
 * panel is loaded.
 */
export function getHost(): PremiereHost {
  if (!cached) {
    cached = UxpPremiereHost.create() ?? new MockPremiereHost();
  }
  return cached;
}
