import { describe, expect, it } from 'vitest';
import { parseFountain, scriptFromParsed, scriptToFountain } from '../src/script/fountain.js';
import { parseFdx } from '../src/script/fdx.js';
import { detectFormat, importScript, parseScript } from '../src/script/index.js';

const SCREENPLAY = `Title: The Long Way Down
Credit: Written by
Author: A. Creator

INT. KITCHEN - DAY #1#

Jane burns the toast. Again.

JANE
This is fine.

EXT. DRIVEWAY - CONTINUOUS #2#

She reverses over the bins.

.A FORCED HEADING

Something stylised happens.
`;

const YOUTUBE_SCRIPT = `# Hook

You will not believe what happened when I tried this.

## The setup

Here is the background you need.

## The payoff

And here is why it mattered.
`;

describe('fountain', () => {
  it('reads the title page and keeps it out of the body', () => {
    const parsed = parseFountain(SCREENPLAY);
    expect(parsed.title).toBe('The Long Way Down');
    expect(parsed.scenes[0]!.body).not.toContain('Credit:');
  });

  it('splits on sluglines and captures scene numbers', () => {
    const parsed = parseFountain(SCREENPLAY);
    expect(parsed.strategy).toBe('sluglines');
    expect(parsed.scenes).toHaveLength(3);
    expect(parsed.scenes[0]!.heading).toBe('INT. KITCHEN - DAY');
    expect(parsed.scenes[0]!.number).toBe('1');
    expect(parsed.scenes[1]!.heading).toBe('EXT. DRIVEWAY - CONTINUOUS');
  });

  it('honours a forced heading', () => {
    const parsed = parseFountain(SCREENPLAY);
    expect(parsed.scenes[2]!.heading).toBe('A FORCED HEADING');
  });

  it('keeps dialogue with its scene', () => {
    const parsed = parseFountain(SCREENPLAY);
    expect(parsed.scenes[0]!.body).toContain('JANE');
    expect(parsed.scenes[0]!.body).toContain('This is fine.');
  });

  it('falls back to markdown sections for a script with no sluglines', () => {
    const parsed = parseFountain(YOUTUBE_SCRIPT);
    expect(parsed.strategy).toBe('sections');
    expect(parsed.scenes.map((scene) => scene.heading)).toEqual([
      'Hook',
      'The setup',
      'The payoff',
    ]);
  });

  it('falls back to a single scene rather than returning nothing', () => {
    const parsed = parseFountain('Just some words with no structure at all.');
    expect(parsed.strategy).toBe('whole-document');
    expect(parsed.scenes).toHaveLength(1);
    expect(parsed.scenes[0]!.body).toBe('Just some words with no structure at all.');
  });

  it('does not mistake a lone colon line for a title page', () => {
    const parsed = parseFountain('INT. ROOM - DAY\n\nHe says: nothing.\n\nEXT. ROOM - DAY\n\nMore.');
    expect(parsed.title).toBe('Untitled script');
    expect(parsed.scenes).toHaveLength(2);
  });

  it('round-trips through fountain export', () => {
    const script = scriptFromParsed(parseFountain(SCREENPLAY));
    const reparsed = parseFountain(scriptToFountain(script));
    expect(reparsed.title).toBe('The Long Way Down');
    expect(reparsed.scenes.map((scene) => scene.heading)).toEqual([
      'INT. KITCHEN - DAY',
      'EXT. DRIVEWAY - CONTINUOUS',
      'A FORCED HEADING',
    ]);
    expect(reparsed.scenes[0]!.number).toBe('1');
  });
});

const FDX = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
    <Paragraph Type="Scene Heading" Number="1"><Text>INT. STUDIO - NIGHT</Text></Paragraph>
    <Paragraph Type="Action"><Text>The camera is still rolling. </Text><Text>Nobody noticed.</Text></Paragraph>
    <Paragraph Type="Character"><Text>producer</Text></Paragraph>
    <Paragraph Type="Parenthetical"><Text>whispering</Text></Paragraph>
    <Paragraph Type="Dialogue"><Text>Are we live?</Text></Paragraph>
    <Paragraph/>
    <Paragraph Type="Scene Heading" Number="2"><Text>EXT. CAR PARK - LATER</Text></Paragraph>
    <Paragraph Type="Action"><Text>Rain &amp; regret.</Text></Paragraph>
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="General"><Text>Are We Live</Text></Paragraph>
    </Content>
  </TitlePage>
</FinalDraft>`;

describe('fdx', () => {
  it('splits on scene headings and keeps scene numbers', () => {
    const parsed = parseFdx(FDX);
    expect(parsed.scenes).toHaveLength(2);
    expect(parsed.scenes[0]!.heading).toBe('INT. STUDIO - NIGHT');
    expect(parsed.scenes[0]!.number).toBe('1');
    expect(parsed.scenes[1]!.number).toBe('2');
  });

  it('joins split text runs back into one line', () => {
    const parsed = parseFdx(FDX);
    expect(parsed.scenes[0]!.body).toContain('The camera is still rolling. Nobody noticed.');
  });

  it('preserves the shape of dialogue', () => {
    const body = parseFdx(FDX).scenes[0]!.body;
    expect(body).toContain('PRODUCER');
    expect(body).toContain('(whispering)');
    expect(body).toContain('Are we live?');
  });

  it('decodes entities', () => {
    expect(parseFdx(FDX).scenes[1]!.body).toBe('Rain & regret.');
  });

  it('reads the title from the title page', () => {
    // The title page uses General paragraphs, which are ignored in the body but
    // are the only place the title lives.
    expect(parseFdx(FDX).title).toBe('Are We Live');
  });

  it('degrades to one scene on markup it cannot follow', () => {
    const parsed = parseFdx('<FinalDraft><Content></Content></FinalDraft>');
    expect(parsed.scenes).toHaveLength(1);
    expect(parsed.strategy).toBe('whole-document');
  });
});

describe('format detection', () => {
  it('sniffs fdx from content, not just the extension', () => {
    expect(detectFormat('script.txt', FDX)).toBe('fdx');
    expect(detectFormat('script.fdx', FDX)).toBe('fdx');
  });

  it('treats a .txt file with real sluglines as fountain so it exports cleanly', () => {
    expect(parseScript('notes.txt', SCREENPLAY).format).toBe('fountain');
  });

  it('leaves a structureless .txt as plain', () => {
    expect(parseScript('notes.txt', YOUTUBE_SCRIPT).format).toBe('plain');
  });

  it('imports into a persistable script with contiguous scene indices', () => {
    const script = importScript('the-long-way-down.fountain', SCREENPLAY, '/tmp/x.fountain');
    expect(script.scenes.map((scene) => scene.index)).toEqual([0, 1, 2]);
    expect(script.sourcePath).toBe('/tmp/x.fountain');
    expect(new Set(script.scenes.map((scene) => scene.id)).size).toBe(3);
  });
});
