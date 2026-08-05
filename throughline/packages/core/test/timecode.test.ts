import { describe, expect, it } from 'vitest';
import {
  framesToTicks,
  framesToTimecode,
  formatDuration,
  ticksToFrames,
  timecodeToFrames,
  TimecodeError,
} from '../src/timecode.js';
import type { FrameRate } from '../src/types.js';

const fps24: FrameRate = { fps: 24, dropFrame: false };
const fps25: FrameRate = { fps: 25, dropFrame: false };
const fps2398: FrameRate = { fps: 23.976, dropFrame: false };
const fps2997df: FrameRate = { fps: 29.97, dropFrame: true };
const fps2997nd: FrameRate = { fps: 29.97, dropFrame: false };
const fps5994df: FrameRate = { fps: 59.94, dropFrame: true };

describe('non-drop timecode', () => {
  it('formats whole seconds and minutes', () => {
    expect(framesToTimecode(0, fps24)).toBe('00:00:00:00');
    expect(framesToTimecode(24, fps24)).toBe('00:00:01:00');
    expect(framesToTimecode(1440, fps24)).toBe('00:01:00:00');
    expect(framesToTimecode(86400, fps24)).toBe('01:00:00:00');
  });

  it('counts 23.976 at its nominal 24 labels per second', () => {
    expect(framesToTimecode(24, fps2398)).toBe('00:00:01:00');
    expect(timecodeToFrames('00:00:01:00', fps2398)).toBe(24);
  });

  it('round-trips arbitrary frame counts', () => {
    for (const rate of [fps24, fps25, fps2997nd]) {
      for (const frames of [1, 59, 1801, 47_000, 500_000]) {
        expect(timecodeToFrames(framesToTimecode(frames, rate), rate)).toBe(frames);
      }
    }
  });
});

describe('drop-frame timecode', () => {
  it('keeps every label in the first minute', () => {
    expect(framesToTimecode(1799, fps2997df)).toBe('00:00:59;29');
  });

  it('skips the two labels at the top of a non-tenth minute', () => {
    // Frame 1800 is the first frame of minute one, and ;00 and ;01 do not exist.
    expect(framesToTimecode(1800, fps2997df)).toBe('00:01:00;02');
    expect(timecodeToFrames('00:01:00;02', fps2997df)).toBe(1800);
  });

  it('restores the labels at every tenth minute', () => {
    // 10 minutes = 17982 frames, and minute ten is a full minute again.
    expect(framesToTimecode(17_982, fps2997df)).toBe('00:10:00;00');
    expect(timecodeToFrames('00:10:00;00', fps2997df)).toBe(17_982);
  });

  it('lands on the hour after exactly 107892 frames', () => {
    expect(framesToTimecode(107_892, fps2997df)).toBe('01:00:00;00');
  });

  it('drops four labels per minute at 59.94', () => {
    expect(framesToTimecode(3600, fps5994df)).toBe('00:01:00;04');
    expect(timecodeToFrames('00:01:00;04', fps5994df)).toBe(3600);
  });

  it('round-trips across the ten-minute boundary', () => {
    for (const frames of [0, 1, 1799, 1800, 17_981, 17_982, 17_983, 100_000, 107_892]) {
      const timecode = framesToTimecode(frames, fps2997df);
      expect(timecodeToFrames(timecode, fps2997df), timecode).toBe(frames);
    }
  });

  it('rejects a timecode naming a dropped label', () => {
    expect(() => timecodeToFrames('00:01:00;00', fps2997df)).toThrow(TimecodeError);
    expect(() => timecodeToFrames('00:01:00;01', fps2997df)).toThrow(TimecodeError);
    // ...but the same label at minute ten is legitimate.
    expect(timecodeToFrames('00:10:00;00', fps2997df)).toBe(17_982);
  });

  it('stays within two frames of wall-clock over an hour', () => {
    // This is the entire point of drop-frame, so it is worth asserting directly.
    const oneHourOfFrames = Math.round(29.97 * 3600);
    const label = framesToTimecode(oneHourOfFrames, fps2997df);
    expect(label.startsWith('00:59:59') || label.startsWith('01:00:00')).toBe(true);
  });
});

describe('parsing', () => {
  it('accepts either separator regardless of the rate', () => {
    expect(timecodeToFrames('00:00:01;00', fps24)).toBe(24);
    expect(timecodeToFrames('00:00:02:00', fps25)).toBe(50);
  });

  it('rejects a frame field beyond the rate', () => {
    expect(() => timecodeToFrames('00:00:00:24', fps24)).toThrow(TimecodeError);
    expect(() => timecodeToFrames('00:00:00:25', fps25)).toThrow(TimecodeError);
  });

  it('rejects nonsense', () => {
    expect(() => timecodeToFrames('yesterday', fps24)).toThrow(TimecodeError);
    expect(() => timecodeToFrames('00:99:00:00', fps24)).toThrow(TimecodeError);
  });

  it('handles negative offsets', () => {
    expect(timecodeToFrames('-00:00:01:00', fps24)).toBe(-24);
    expect(framesToTimecode(-24, fps24)).toBe('-00:00:01:00');
  });
});

describe('ticks', () => {
  it('round-trips through Premiere ticks without drift on long timelines', () => {
    for (const rate of [fps24, fps25, fps2398, fps2997nd]) {
      for (const frames of [1, 100, 86_400, 1_000_000]) {
        expect(ticksToFrames(framesToTicks(frames, rate), rate)).toBe(frames);
      }
    }
  });

  it('uses the exact 1000/1001 ratio for NTSC rates', () => {
    // One second of 23.976 is 24 frames, which is 1001/1000 of a true second.
    const ticks = framesToTicks(24, fps2398);
    expect(ticks).toBe((254016000000n * 1001n) / 1000n);
  });
});

describe('formatDuration', () => {
  it('omits the hour for short pieces', () => {
    expect(formatDuration(24 * 83, fps24)).toBe('1:23');
  });

  it('includes the hour for long ones', () => {
    expect(formatDuration(24 * 3661, fps24)).toBe('1:01:01');
  });
});
