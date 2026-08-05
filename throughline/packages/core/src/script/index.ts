import type { ScriptFormat } from '../types.js';
import { parseFdx } from './fdx.js';
import { parseFountain, scriptFromParsed, type ParsedScript } from './fountain.js';

export { parseFountain, scriptFromParsed, scriptToFountain } from './fountain.js';
export { parseFdx } from './fdx.js';
export type { ParsedScript } from './fountain.js';

/**
 * Pick a parser from the filename and the content itself.
 *
 * Extension alone is not enough — plenty of scripts arrive as `.txt` from a
 * Google Doc export — so the FDX sniff looks at the payload.
 */
export function detectFormat(filename: string, source: string): ScriptFormat {
  if (/\.fdx$/i.test(filename) || /<FinalDraft\b/i.test(source.slice(0, 2048))) {
    return 'fdx';
  }
  if (/\.fountain$/i.test(filename)) return 'fountain';
  return 'plain';
}

/** Parse a script file of any supported format. */
export function parseScript(filename: string, source: string): ParsedScript & { format: ScriptFormat } {
  const format = detectFormat(filename, source);
  const parsed = format === 'fdx' ? parseFdx(source) : parseFountain(source);
  // A plain-text file with real sluglines is Fountain in all but name, and
  // treating it as such means the export round-trips properly.
  const resolved: ScriptFormat =
    format === 'plain' && parsed.strategy === 'sluglines' ? 'fountain' : format;
  return { ...parsed, format: resolved };
}

/** Convenience: parse straight into a persistable `Script`. */
export function importScript(filename: string, source: string, sourcePath?: string) {
  const parsed = parseScript(filename, source);
  return scriptFromParsed(parsed, { format: parsed.format, sourcePath });
}
