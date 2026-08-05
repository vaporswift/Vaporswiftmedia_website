/**
 * Final Draft (.fdx) parsing.
 *
 * FDX is the format Final Draft, Celtx, WriterDuet and Fade In all export, so
 * supporting it is what lets a creator bring in a script they already wrote
 * somewhere else.
 *
 * We scan the markup directly instead of using DOMParser. That is a deliberate
 * trade: DOMParser is present in UXP and in browsers but not in Node, and the
 * subset of FDX we care about — `<Paragraph Type="...">` wrapping `<Text>` runs
 * — is regular enough that a scanner is both simpler and testable everywhere.
 * A malformed or wildly nested file degrades to fewer scenes, never a throw.
 */

import type { ParsedScript } from './fountain.js';

const PARAGRAPH = /<Paragraph\b([^>]*)>([\s\S]*?)<\/Paragraph>/g;
const SELF_CLOSING_PARAGRAPH = /<Paragraph\b[^>]*\/>/g;
const TEXT_RUN = /<Text\b[^>]*>([\s\S]*?)<\/Text>/g;
const ATTRIBUTE = /(\w+)\s*=\s*"([^"]*)"/g;
const TITLE_PAGE_BLOCK = /<TitlePage\b[^>]*>([\s\S]*?)<\/TitlePage>/;

/** Paragraph types that begin a new scene. */
const HEADING_TYPES = new Set(['scene heading']);
/** Paragraph types we drop entirely — they are production metadata, not script. */
const IGNORED_TYPES = new Set(['general', 'new act', 'end of act']);

export function parseFdx(source: string): ParsedScript {
  const paragraphs = readParagraphs(source);
  const scenes: Array<{ number?: string; heading: string; body: string[] }> = [];

  for (const paragraph of paragraphs) {
    const type = paragraph.type.toLowerCase();
    if (IGNORED_TYPES.has(type)) continue;
    if (paragraph.text.length === 0 && !HEADING_TYPES.has(type)) continue;

    if (HEADING_TYPES.has(type)) {
      scenes.push({ heading: paragraph.text, number: paragraph.number, body: [] });
      continue;
    }
    if (scenes.length === 0) continue;

    // Character names and parentheticals carry meaning that plain concatenation
    // would lose, so keep the shape of dialogue rather than flattening it.
    const line =
      type === 'character' || type === 'transition'
        ? paragraph.text.toUpperCase()
        : type === 'parenthetical'
          ? paragraph.text.startsWith('(')
            ? paragraph.text
            : `(${paragraph.text})`
          : paragraph.text;
    scenes[scenes.length - 1]!.body.push(line);
  }

  const title = readTitle(source);
  if (scenes.length === 0) {
    const everything = paragraphs.map((paragraph) => paragraph.text).filter(Boolean).join('\n');
    return {
      title,
      scenes: [{ heading: title, body: everything }],
      strategy: 'whole-document',
    };
  }

  return {
    title,
    strategy: 'sluglines',
    scenes: scenes.map((scene) => ({
      heading: scene.heading,
      number: scene.number,
      body: scene.body.join('\n').trim(),
    })),
  };
}

interface FdxParagraph {
  type: string;
  number?: string;
  text: string;
}

function readParagraphs(source: string): FdxParagraph[] {
  // Empty paragraphs are line breaks in Final Draft; dropping them here keeps
  // them from producing runs of blank lines in the body text.
  const body = source.replace(SELF_CLOSING_PARAGRAPH, '');
  const paragraphs: FdxParagraph[] = [];

  for (const match of body.matchAll(PARAGRAPH)) {
    const attributes = readAttributes(match[1] ?? '');
    const runs: string[] = [];
    for (const run of (match[2] ?? '').matchAll(TEXT_RUN)) {
      runs.push(decodeEntities(run[1] ?? ''));
    }
    paragraphs.push({
      type: attributes.get('Type') ?? 'Action',
      number: attributes.get('Number') || undefined,
      text: runs.join('').replace(/\s+/g, ' ').trim(),
    });
  }
  return paragraphs;
}

function readAttributes(raw: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of raw.matchAll(ATTRIBUTE)) {
    attributes.set(match[1]!, decodeEntities(match[2] ?? ''));
  }
  return attributes;
}

/**
 * Final Draft writes the title into the title page as ordinary paragraphs, so
 * there is no reliable "title" field — the first non-empty line is the best
 * available guess.
 */
function readTitle(source: string): string {
  const block = TITLE_PAGE_BLOCK.exec(source);
  if (block?.[1]) {
    for (const paragraph of readParagraphs(block[1])) {
      if (paragraph.text.length > 0) return paragraph.text;
    }
  }
  return 'Untitled script';
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity] ?? entity);
}
