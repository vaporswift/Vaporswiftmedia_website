#!/usr/bin/env node
/**
 * Measures the caption's first line and checks it against the number claimed
 * in caption.md.
 *
 *   node check-caption.js
 *
 * This exists because Track C 01 shipped a draft claiming 121/146 characters
 * when the real counts were 123/147 — on a post about character counts. Any
 * edit to the caption changes the number, and nobody re-counts by hand.
 *
 * The caption body is everything after the first `---` separator; its first
 * non-empty line is the hook. The claim is read from a line matching
 * "N characters" in the header above that separator.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'caption.md');
const LIMIT = 125; // Instagram's approximate truncation point

const raw = fs.readFileSync(FILE, 'utf8');
const parts = raw.split(/\n---\n/);
if (parts.length < 2) {
  console.error('✗ caption.md has no `---` separator — cannot find the body.');
  process.exit(1);
}

const header = parts[0];
const body = parts[1];
const hook = body.split('\n').map(s => s.trim()).find(Boolean) || '';

const actual = hook.length;
const claimMatch = header.match(/(\d+)\s+characters/i);
const claimed = claimMatch ? Number(claimMatch[1]) : null;

console.log(`hook: "${hook}"`);
console.log(`      ${actual} characters (limit ~${LIMIT})`);

let bad = false;

if (actual > LIMIT) {
  console.log(`✗ over the truncation point by ${actual - LIMIT} — it will cut mid-sentence.`);
  bad = true;
} else {
  console.log(`✓ lands whole, ${LIMIT - actual} to spare.`);
}

if (claimed === null) {
  console.log('✗ no "N characters" claim found in the header — add one.');
  bad = true;
} else if (claimed !== actual) {
  console.log(`✗ header claims ${claimed}, actual is ${actual}. Fix the header.`);
  bad = true;
} else {
  console.log(`✓ header's claim of ${claimed} matches.`);
}

if (bad) process.exitCode = 1;
