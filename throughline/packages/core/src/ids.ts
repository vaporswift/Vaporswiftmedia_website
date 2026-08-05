/**
 * Identifier generation.
 *
 * Ids are minted on whichever surface created the item — panel, web, or a phone
 * that was offline at the time — so they have to be collision-free without a
 * server round trip. That rules out sequence numbers and makes randomness the
 * only workable answer.
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const webCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
    return bytes;
  }
  // UXP exposes WebCrypto, and so do browsers and Node 20+. This branch exists
  // only so that a stripped-down host cannot make the whole store unusable.
  for (let i = 0; i < length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * A short, URL-safe, lowercase id.
 *
 * 20 characters of base-36 is ~103 bits, comfortably beyond any collision risk
 * at the scale of one creator's projects, and short enough to read aloud when
 * debugging a sync problem.
 */
export function newId(prefix?: string): string {
  const bytes = randomBytes(20);
  let out = '';
  for (const byte of bytes) {
    out += ALPHABET[byte % ALPHABET.length];
  }
  return prefix ? `${prefix}_${out}` : out;
}

/**
 * Stable, order-independent hash of a string, used to tell whether a marker's
 * projected content actually changed before writing it back to Premiere.
 *
 * FNV-1a: not cryptographic, but we only need change detection, and it is small
 * enough to keep in this file rather than take a dependency.
 */
export function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
