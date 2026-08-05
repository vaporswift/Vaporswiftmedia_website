/**
 * Fountain parsing, scoped to what Throughline actually needs.
 *
 * This is not a full Fountain implementation and does not try to be: we are not
 * rendering a screenplay, we are cutting a document into scenes that can be
 * anchored to a timeline. So we recognise title pages, scene headings, sections
 * and scene numbers, and pass everything else through as body text.
 *
 * The fallback path matters as much as the spec path. Most creators in our
 * audience write a YouTube script in a doc with markdown-ish headings and no
 * sluglines anywhere, so a parser that returns zero scenes for that input is
 * useless to them.
 */

import { newId } from '../ids.js';
import type { Scene, Script } from '../types.js';

/** Scene headings per the Fountain spec, plus a leading `.` as the forced form. */
const SCENE_HEADING = /^(INT\.?\/EXT\.?|INT\.?|EXT\.?|EST\.?|I\/E\.?)[\s.]/i;
const FORCED_HEADING = /^\.(?!\.)(.+)$/;
/** Trailing scene number, e.g. "INT. KITCHEN - DAY #12A#". */
const SCENE_NUMBER = /\s*#([\w.\-]+)#\s*$/;
/** Markdown or Fountain section heading, used by the no-slugline fallback. */
const SECTION_HEADING = /^(#{1,6})\s+(.*)$/;
const TITLE_PAGE_KEY = /^([A-Za-z][\w\s]*):\s*(.*)$/;

export interface ParsedScript {
  title: string;
  scenes: Array<{ number?: string; heading: string; body: string }>;
  /** How the document was cut up, so the UI can explain itself to the user. */
  strategy: 'sluglines' | 'sections' | 'whole-document';
}

/**
 * Split Fountain (or plain) text into scenes.
 *
 * Tries three strategies in order of fidelity and stops at the first that finds
 * more than one scene.
 */
export function parseFountain(source: string): ParsedScript {
  const normalised = source.replace(/\r\n?/g, '\n');
  const { title, body } = extractTitlePage(normalised);
  const lines = body.split('\n');

  const bySluglines = splitBy(lines, readSlugline);
  if (bySluglines.length > 0) {
    return { title, scenes: bySluglines, strategy: 'sluglines' };
  }

  const bySections = splitBy(lines, readSection);
  if (bySections.length > 0) {
    return { title, scenes: bySections, strategy: 'sections' };
  }

  return {
    title,
    scenes: [{ heading: title, body: body.trim() }],
    strategy: 'whole-document',
  };
}

/** Build a persistable `Script` from parsed text. */
export function scriptFromParsed(
  parsed: ParsedScript,
  options: { format?: Script['format']; sourcePath?: string; now?: number } = {},
): Script {
  const now = options.now ?? Date.now();
  const scenes: Scene[] = parsed.scenes.map((scene, index) => ({
    id: newId('scn'),
    createdAt: now,
    updatedAt: now,
    revision: 1,
    origin: 'import',
    index,
    number: scene.number,
    heading: scene.heading,
    body: scene.body,
    anchors: [],
  }));

  return {
    id: newId('scr'),
    title: parsed.title,
    format: options.format ?? 'fountain',
    sourcePath: options.sourcePath,
    importedAt: now,
    scenes,
  };
}

type HeadingReader = (line: string) => { heading: string; number?: string } | null;

/**
 * Walk the lines, starting a new scene whenever `readHeading` matches. Returns
 * an empty array when fewer than two headings were found, which is the signal
 * for the caller to try a coarser strategy.
 */
function splitBy(
  lines: string[],
  readHeading: HeadingReader,
): Array<{ number?: string; heading: string; body: string }> {
  const scenes: Array<{ number?: string; heading: string; body: string[] }> = [];

  for (const line of lines) {
    const heading = readHeading(line);
    if (heading) {
      scenes.push({ heading: heading.heading, number: heading.number, body: [] });
    } else if (scenes.length > 0) {
      scenes[scenes.length - 1]!.body.push(line);
    }
    // Text before the first heading is dropped deliberately: in a screenplay it
    // is front matter, and in a sectioned doc it is a preamble that belongs to
    // no scene. Keeping it would produce a phantom untitled scene every time.
  }

  if (scenes.length < 2) return [];
  return scenes.map((scene) => ({
    heading: scene.heading,
    number: scene.number,
    body: scene.body.join('\n').trim(),
  }));
}

function readSlugline(line: string): { heading: string; number?: string } | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;

  const forced = FORCED_HEADING.exec(trimmed);
  const candidate = forced ? forced[1]!.trim() : SCENE_HEADING.test(trimmed) ? trimmed : null;
  if (!candidate) return null;

  const numbered = SCENE_NUMBER.exec(candidate);
  return numbered
    ? { heading: candidate.replace(SCENE_NUMBER, '').trim(), number: numbered[1] }
    : { heading: candidate };
}

function readSection(line: string): { heading: string } | null {
  const match = SECTION_HEADING.exec(line.trim());
  return match ? { heading: match[2]!.trim() } : null;
}

/**
 * Pull the Fountain title page off the top of the document.
 *
 * A title page is a run of `Key: value` lines terminated by a blank line, and
 * only counts if it starts at the very top — otherwise every line of dialogue
 * beginning with a character name would look like one.
 */
function extractTitlePage(source: string): { title: string; body: string } {
  const lines = source.split('\n');
  const fields = new Map<string, string>();
  let cursor = 0;
  let lastKey: string | null = null;

  while (cursor < lines.length) {
    const line = lines[cursor]!;
    if (line.trim().length === 0) {
      if (fields.size === 0) {
        // Leading blank lines before any key: not a title page, just whitespace.
        cursor += 1;
        continue;
      }
      cursor += 1;
      break;
    }
    const match = TITLE_PAGE_KEY.exec(line);
    if (match) {
      lastKey = match[1]!.trim().toLowerCase();
      fields.set(lastKey, match[2]!.trim());
    } else if (lastKey && /^\s+\S/.test(line)) {
      // Indented continuation of the previous field.
      fields.set(lastKey, `${fields.get(lastKey) ?? ''} ${line.trim()}`.trim());
    } else {
      break;
    }
    cursor += 1;
  }

  if (fields.size === 0) {
    return { title: 'Untitled script', body: source };
  }
  return {
    title: fields.get('title') || 'Untitled script',
    body: lines.slice(cursor).join('\n'),
  };
}

/**
 * Render scenes back to Fountain.
 *
 * Round-tripping matters: a creator who imports a script, marks it up against
 * the cut, and then wants it back in their writing app should not lose the
 * document. What they lose is formatting we never modelled, which is why the
 * heading and body are emitted verbatim.
 */
export function scriptToFountain(script: Script): string {
  const header = `Title: ${script.title}\n\n`;
  const body = script.scenes
    .map((scene) => {
      const number = scene.number ? ` #${scene.number}#` : '';
      const heading = looksLikeSlugline(scene.heading)
        ? `${scene.heading}${number}`
        : `.${scene.heading}${number}`;
      return `${heading}\n\n${scene.body}`.trimEnd();
    })
    .join('\n\n');
  return `${header}${body}\n`;
}

function looksLikeSlugline(heading: string): boolean {
  return SCENE_HEADING.test(heading.trim());
}
