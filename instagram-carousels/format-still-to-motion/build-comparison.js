#!/usr/bin/env node
/**
 * Builds a still → motion comparison from one animated clip.
 *
 *   node build-comparison.js [assets/motion.mp4]
 *
 * Freezes the clip's own first frame, holds it under a "the photo you already
 * have" label, then plays the clip under "one prompt later". Using frame 1 of
 * the clip itself — rather than the source still — guarantees the two halves
 * are the same picture, which is the entire claim the format makes.
 */
const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  try { return require('playwright'); } catch (_) {}
  const g = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  return require(path.join(g, 'playwright'));
}
const { chromium } = loadPlaywright();

const HERE  = __dirname;
const OUT   = path.join(HERE, 'out');
const SRC   = path.resolve(HERE, process.argv[2] || 'assets/motion.mp4');
const FINAL = path.join(OUT, 'still-to-motion.mp4');
const W = 1080, H = 1440;
const HOLD = 1.6;          // seconds the still is held before it comes alive

function ffmpegPath() {
  try {
    const reg = require(path.join(path.dirname(require.resolve('playwright')), '..',
      'playwright-core', 'lib', 'utils', 'registry', 'index.js'));
    const exe = reg.registry?.findExecutable?.('ffmpeg')?.executablePath?.();
    if (exe && fs.existsSync(exe)) return exe;
  } catch (_) {}
  return 'ffmpeg';
}

const run = (ff, args) => execFileSync(ff, args, { stdio: ['ignore', 'ignore', 'pipe'] });

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`\nMissing ${path.relative(HERE, SRC)} — run ./fetch-assets.sh first.\n`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const ff = ffmpegPath();

  // --- label plates -------------------------------------------------------
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(HERE, 'labels.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const plates = {};
  for (const id of ['a', 'b']) {
    const el = await page.$('#' + id);
    const { width, height } = await el.boundingBox();
    if (width !== W || height !== H) {
      console.error(`✗ plate ${id} is ${width}x${height}, expected ${W}x${H}`);
      process.exitCode = 1;
    }
    plates[id] = path.join(OUT, `label-${id}.png`);
    await el.screenshot({ path: plates[id], omitBackground: true });
    console.log(`✓ label-${id}.png  ${width}x${height} (transparent)`);
  }
  await browser.close();

  // --- freeze frame -------------------------------------------------------
  const frame1 = path.join(OUT, 'frame-001.png');
  run(ff, ['-y', '-i', SRC, '-vframes', '1', '-vf', `scale=${W}:${H}`, frame1]);
  console.log('✓ frame-001.png extracted from the clip itself');

  // --- assemble -----------------------------------------------------------
  // Silent bed under the held still so the concat has a matching audio stream.
  const build = (withAudio) => {
    const args = [
      '-y',
      '-loop', '1', '-t', String(HOLD), '-i', frame1,
      '-i', SRC,
      '-i', plates.a,
      '-i', plates.b,
    ];
    let fc =
      `[0:v]scale=${W}:${H},setsar=1,fps=30[a0];[a0][2:v]overlay=0:0[va];` +
      `[1:v]scale=${W}:${H},setsar=1,fps=30[b0];[b0][3:v]overlay=0:0[vb];`;

    if (withAudio) {
      args.push('-f', 'lavfi', '-t', String(HOLD), '-i', 'anullsrc=r=48000:cl=stereo');
      fc += `[va][4:a][vb][1:a]concat=n=2:v=1:a=1[v][aout]`;
      args.push('-filter_complex', fc, '-map', '[v]', '-map', '[aout]',
                '-c:a', 'aac', '-b:a', '192k');
    } else {
      fc += `[va][vb]concat=n=2:v=1:a=0[v]`;
      args.push('-filter_complex', fc, '-map', '[v]', '-an');
    }
    args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
              '-pix_fmt', 'yuv420p', '-movflags', '+faststart', FINAL);
    run(ff, args);
  };

  try {
    build(true);
    console.log('✓ audio carried through from the clip');
  } catch (_) {
    // Source had no audio track — concat with an audio stream would fail.
    build(false);
    console.log('! source had no audio — built silent');
  }

  const mb = (fs.statSync(FINAL).size / 1e6).toFixed(1);
  console.log(`\n✓ ${path.basename(FINAL)}  ${W}x${H}  ${mb} MB  (${HOLD}s still, then motion)`);
  console.log(`→ ${FINAL}`);
})();
