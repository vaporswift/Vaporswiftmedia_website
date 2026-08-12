#!/usr/bin/env node
/**
 * Renders each .slide in slides.html to a 1080x1440 PNG in ./out
 *
 *   npm install && node render.js
 *
 * Resolves playwright from local node_modules first, falling back to a global
 * install so it works both here and on a machine that has it installed system-wide.
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
    const el = await page.$('#' + id);
    const file = path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await el.screenshot({ path: file });

    // Hard assertion: Instagram will re-crop anything that is not exactly 3:4.
    const { width, height } = await el.boundingBox();
    const sizeOk = width === W && height === H;

    // Overflow assertion. The slide and the prompt box both clip with
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
      return bad;
    });

    const ok = sizeOk && over.length === 0;
    const note = over.length ? `  OVERFLOW: ${over.join(', ')}` : '';
    console.log(`${ok ? '✓' : '✗'} ${path.basename(file)}  ${width}x${height}${note}`);
    if (!ok) process.exitCode = 1;
  }

  await browser.close();
  console.log(`\n${ids.length} slides → ${OUT}`);
})();
