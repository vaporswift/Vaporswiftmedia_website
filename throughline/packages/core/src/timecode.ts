/**
 * Timecode conversion.
 *
 * Everything in Throughline is stored as whole frames. Timecode strings are a
 * display format and Premiere ticks are a wire format; both are derived here
 * and neither is ever persisted, so there is exactly one representation of time
 * in the data model.
 */

import type { FrameRate } from './types.js';

/** Premiere represents time in ticks. There are this many per second. */
export const TICKS_PER_SECOND = 254016000000n;

export class TimecodeError extends Error {}

/**
 * The integer frame count used for timecode arithmetic.
 *
 * Timecode counts in whole labelled frames, so 29.97 counts 30 per second and
 * compensates by dropping labels. Rounding is the correct operation here, not
 * truncation: 23.976 must yield 24, not 23.
 */
export function nominalRate(frameRate: FrameRate): number {
  return Math.round(frameRate.fps);
}

/**
 * Drop-frame numbering only exists for rates that are a multiple of 29.97, and
 * drops two labels per counted minute for each 30fps in the nominal rate.
 */
function dropsPerMinute(frameRate: FrameRate): number {
  if (!frameRate.dropFrame) return 0;
  const nominal = nominalRate(frameRate);
  if (nominal % 30 !== 0) {
    throw new TimecodeError(`Drop-frame is not defined for ${frameRate.fps} fps`);
  }
  return (nominal / 30) * 2;
}

export interface TimecodeParts {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
  negative: boolean;
}

/** Split a frame count into the hours/minutes/seconds/frames a timecode displays. */
export function framesToParts(frames: number, frameRate: FrameRate): TimecodeParts {
  if (!Number.isFinite(frames)) {
    throw new TimecodeError(`Frame count must be finite, got ${frames}`);
  }
  const negative = frames < 0;
  let counted = Math.abs(Math.round(frames));
  const nominal = nominalRate(frameRate);
  const drops = dropsPerMinute(frameRate);

  if (drops > 0) {
    // Walk the count forward by the labels that were skipped. Nine minutes in
    // every ten drop `drops` labels; the tenth drops none, which is what keeps
    // drop-frame timecode within a frame or two of wall-clock over an hour.
    const framesPerMinute = nominal * 60 - drops;
    const framesPerTenMinutes = framesPerMinute * 10 + drops;
    const tenMinuteBlocks = Math.floor(counted / framesPerTenMinutes);
    const remainder = counted % framesPerTenMinutes;
    counted += drops * 9 * tenMinuteBlocks;
    if (remainder > drops) {
      counted += drops * Math.floor((remainder - drops) / framesPerMinute);
    }
  }

  const framesPerHour = nominal * 3600;
  const framesPerMinuteLabelled = nominal * 60;
  const hours = Math.floor(counted / framesPerHour);
  const minutes = Math.floor((counted % framesPerHour) / framesPerMinuteLabelled);
  const seconds = Math.floor((counted % framesPerMinuteLabelled) / nominal);
  const remainingFrames = counted % nominal;

  return { hours, minutes, seconds, frames: remainingFrames, negative };
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/**
 * Format a frame count as SMPTE timecode. Drop-frame uses a semicolon before
 * the frames field, which is the convention Premiere, Resolve and FCP all show.
 */
export function framesToTimecode(frames: number, frameRate: FrameRate): string {
  const { hours, minutes, seconds, frames: ff, negative } = framesToParts(frames, frameRate);
  const separator = frameRate.dropFrame ? ';' : ':';
  const sign = negative ? '-' : '';
  return `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(ff)}`;
}

const TIMECODE_PATTERN = /^(-)?(\d{1,3}):([0-5]?\d):([0-5]?\d)[:;.](\d{1,3})$/;

/**
 * Parse a timecode string back to a frame count.
 *
 * Accepts `:` or `;` as the frames separator regardless of the rate's drop-frame
 * setting — users paste timecode from everywhere and correcting them for using
 * the wrong punctuation would be obnoxious. The rate decides the arithmetic.
 */
export function timecodeToFrames(timecode: string, frameRate: FrameRate): number {
  const match = TIMECODE_PATTERN.exec(timecode.trim());
  if (!match) {
    throw new TimecodeError(`Unrecognised timecode: "${timecode}"`);
  }
  const [, sign, hh, mm, ss, ff] = match;
  const hours = Number(hh);
  const minutes = Number(mm);
  const seconds = Number(ss);
  const frames = Number(ff);
  const nominal = nominalRate(frameRate);

  if (frames >= nominal) {
    throw new TimecodeError(
      `Frame field ${frames} is out of range for ${frameRate.fps} fps (max ${nominal - 1})`,
    );
  }

  const drops = dropsPerMinute(frameRate);
  if (drops > 0 && minutes % 10 !== 0 && seconds === 0 && frames < drops) {
    throw new TimecodeError(`Timecode "${timecode}" names a dropped frame label`);
  }

  const totalMinutes = hours * 60 + minutes;
  let count =
    hours * 3600 * nominal + minutes * 60 * nominal + seconds * nominal + frames;
  if (drops > 0) {
    // Subtract the labels that were never used: `drops` for every minute except
    // every tenth.
    count -= drops * (totalMinutes - Math.floor(totalMinutes / 10));
  }
  return sign === '-' ? -count : count;
}

/** Seconds of wall-clock time a frame count represents, at the true rate. */
export function framesToSeconds(frames: number, frameRate: FrameRate): number {
  return frames / frameRate.fps;
}

export function secondsToFrames(seconds: number, frameRate: FrameRate): number {
  return Math.round(seconds * frameRate.fps);
}

/**
 * Convert frames to Premiere's tick representation.
 *
 * BigInt throughout: a tick count for an hour of video exceeds 2^53, so doing
 * this in doubles silently loses frames on long-form timelines.
 */
export function framesToTicks(frames: number, frameRate: FrameRate): bigint {
  const { numerator, denominator } = rateAsFraction(frameRate);
  return (BigInt(Math.round(frames)) * TICKS_PER_SECOND * BigInt(denominator)) / BigInt(numerator);
}

export function ticksToFrames(ticks: bigint | string, frameRate: FrameRate): number {
  const value = typeof ticks === 'string' ? BigInt(ticks) : ticks;
  const { numerator, denominator } = rateAsFraction(frameRate);
  const scaled = (value * BigInt(numerator)) / (TICKS_PER_SECOND * BigInt(denominator));
  return Number(scaled);
}

/**
 * Exact rational form of a frame rate. The NTSC rates are 1000/1001 of their
 * nominal value and must not be approximated, or ticks drift.
 */
export function rateAsFraction(frameRate: FrameRate): { numerator: number; denominator: number } {
  const nominal = nominalRate(frameRate);
  const isNtsc = Math.abs(frameRate.fps - (nominal * 1000) / 1001) < 0.001;
  return isNtsc
    ? { numerator: nominal * 1000, denominator: 1001 }
    : { numerator: Math.round(frameRate.fps * 1000), denominator: 1000 };
}

/** Human-readable duration ("1:23", "12:04:31") for UI that isn't frame-accurate. */
export function formatDuration(frames: number, frameRate: FrameRate): string {
  const total = Math.max(0, Math.round(framesToSeconds(frames, frameRate)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}
