#!/usr/bin/env node
/**
 * Renders each .slide in slides.html to a 1080x1440 PNG in ./out
 *
 *   npm install && node render.js
 *
 * Resolves playwright from local node_modules first, falling back to a global
 * install so it works both here and on a machine that has it installed
 * system-wide.
 *
 * Why one slide at a time instead of elementHandle.screenshot():
 * element screenshots have to scroll a tall page to reach the target, and that
 * scroll intermittently lands wrong — it silently writes a PNG that is the
 * correct size, passes every geometry assertion, and contains the slide
 * offset by a couple of hundred pixels with the neighbouring slide bleeding
 * in. It happened twice while building this episode. Isolating each slide and
 * shooting the viewport removes the scroll entirely, so the capture is
 * deterministic.
 */
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (_) { /* fall through to the global install */ }
  try {
    const { execSync } = require('child_process');
    const globalRoot = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
    return require(path.join(globalRoot, 'playwright'));
  } catch (_) {
    console.error(
      '\nPlaywright is not installed.\n\n' +
      '  cd ' + __dirname + '\n' +
      '  npm install\n' +
      '  node render.js\n'
    );
    process.exit(1);
  }
}

const { chromium } = loadPlaywright();

const HERE = __dirname;
const OUT = path.join(HERE, 'out');
const W = 1080, H = 1440;
// Carousel position 1 is the video built by build-video-slide.js, so the
// stills start at 02 and the filenames match the upload order exactly.
const START = 2;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });

  await page.goto('file://' + path.join(HERE, 'slides.html'), { waitUntil: 'networkidle' });
  // Fonts are bundled in ./fonts and loaded via @font-face — wait for them to be
  // parsed before snapshotting, or the first slides render in a fallback face.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const ids = await page.$$eval('.slide', els => els.map(e => e.id));

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const file = path.join(OUT, `slide-${String(i + START).padStart(2, '0')}.png`);

    // Isolate: exactly one slide on the page, no body padding or gap, scrolled
    // to origin. The viewport is 1080x1440, so the viewport IS the slide.
    const geom = await page.evaluate((sid) => {
      document.body.style.padding = '0';
      document.body.style.gap = '0';
      document.querySelectorAll('.slide').forEach((s) => {
        s.style.display = s.id === sid ? '' : 'none';
      });
      window.scrollTo(0, 0);
      const el = document.getElementById(sid);
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, id);
    await page.waitForTimeout(60);

    await page.screenshot({ path: file });

    // Instagram re-crops anything that is not exactly 3:4, and a slide that
    // isn't flush at the origin means the viewport caught something else.
    const placed = geom.x === 0 && geom.y === 0;
    const sizeOk = geom.w === W && geom.h === H;

    // Overflow assertion. The slide and its inner boxes clip with
    // overflow:hidden, so text that no longer fits is silently cut rather than
    // erroring. Font metrics differ between machines (SF Pro vs the bundled
    // Inter fallback), so this is the check that catches a clipped slide.
    const over = await page.$eval('#' + id, (slide) => {
      const bad = [];
      const check = (node, label) => {
        if (!node) return;
        const slack = node.scrollHeight - node.clientHeight;
        if (slack > 1) bad.push(`${label} +${slack}px`);
      };
      check(slide, 'slide');
      check(slide.querySelector('.promptbox'), 'promptbox');
      check(slide.querySelector('.rows'), 'rows');
      check(slide.querySelector('.three'), 'three-up');
      check(slide.querySelector('.diagram'), 'diagram');
      check(slide.querySelector('.win'), 'window');
      check(slide.querySelector('.legend'), 'legend');
      check(slide.querySelector('.score'), 'scorecard');
      return bad;
    });

    // Diagram guard: a numbered pin that has drifted outside the drawn window
    // still renders — it just points at nothing. Cheap to measure, invisible
    // to proofread.
    const stray = await page.$eval('#' + id, (slide) => {
      const win = slide.querySelector('.win');
      if (!win) return [];
      const w = win.getBoundingClientRect();
      const bad = [];
      slide.querySelectorAll('.pin').forEach((p) => {
        const r = p.getBoundingClientRect();
        if (r.left < w.left - 1 || r.right > w.right + 1 ||
            r.top < w.top - 1 || r.bottom > w.bottom + 1) {
          bad.push(`pin ${p.textContent.trim()} outside window`);
        }
      });
      return bad;
    });

    const problems = [
      ...(placed ? [] : [`slide at ${geom.x},${geom.y} not 0,0`]),
      ...over,
      ...stray,
    ];
    const ok = sizeOk && problems.length === 0;
    const note = problems.length ? `  PROBLEM: ${problems.join(', ')}` : '';
    console.log(`${ok ? '✓' : '✗'} ${path.basename(file)}  ${geom.w}x${geom.h}${note}`);
    if (!ok) process.exitCode = 1;
  }

  await browser.close();
  console.log(`\n${ids.length} slides → ${OUT}`);
})();
