#!/usr/bin/env node
/**
 * Builds slide 1 of the carousel: the reframed 3:4 clip with the brand text
 * overlay burned in.
 *
 *   node build-video-slide.js
 *
 * Renders overlay.html to a transparent PNG, then composites it onto
 * assets/reel-3x4.mp4 with ffmpeg. Playwright ships its own ffmpeg build, so
 * there is nothing extra to install.
 */
const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  try { return require('playwright'); } catch (_) {}
  const g = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  return require(path.join(g, 'playwright'));
}
const pw = loadPlaywright();
const { chromium } = pw;

const HERE  = __dirname;
const OUT   = path.join(HERE, 'out');
const SRC   = path.join(HERE, 'assets', 'vapor-bed.mp4');
const PNG   = path.join(OUT, 'slide-01-overlay.png');
const FINAL = path.join(OUT, 'slide-01-video.mp4');
const W = 1080, H = 1440;

// Playwright bundles ffmpeg; fall back to a system one if the layout changes.
function ffmpegPath() {
  try {
    const p = require(path.join(path.dirname(require.resolve('playwright')), '..',
      'playwright-core', 'lib', 'utils', 'registry', 'index.js'));
    const exe = p.registry?.findExecutable?.('ffmpeg')?.executablePath?.();
    if (exe && fs.existsSync(exe)) return exe;
  } catch (_) {}
  return 'ffmpeg';
}

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`\nMissing ${path.relative(HERE, SRC)} — run ./fetch-assets.sh first.\n`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(HERE, 'overlay.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const el = await page.$('#overlay');
  const { width, height } = await el.boundingBox();
  if (width !== W || height !== H) {
    console.error(`✗ overlay is ${width}x${height}, expected ${W}x${H}`);
    process.exitCode = 1;
  }
  // omitBackground keeps the alpha channel so the footage shows through.
  await el.screenshot({ path: PNG, omitBackground: true });
  await browser.close();
  console.log(`✓ ${path.basename(PNG)}  ${width}x${height} (transparent)`);

  const ff = ffmpegPath();
  execFileSync(ff, [
    '-y',
    '-i', SRC,
    '-i', PNG,
    // Scale the clip to the exact canvas in case the reframe came back a few
    // pixels off, then lay the overlay on top for the full duration.
    '-filter_complex', `[0:v]scale=${W}:${H}[v];[v][1:v]overlay=0:0:format=auto[out]`,
    '-map', '[out]', '-map', '0:a?',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    FINAL,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const mb = (fs.statSync(FINAL).size / 1e6).toFixed(1);
  console.log(`✓ ${path.basename(FINAL)}  ${W}x${H}  ${mb} MB`);
  console.log(`\nSlide 1 → ${FINAL}`);
  console.log('Slides 2-8 are the PNGs from `node render.js`.');
})();
