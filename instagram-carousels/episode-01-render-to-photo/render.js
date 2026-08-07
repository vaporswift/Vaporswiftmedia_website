#!/usr/bin/env node
/**
 * Renders each .slide in slides.html to a 1080x1440 PNG in ./out
 *
 *   node render.js
 *
 * Playwright is installed globally in this environment, so we resolve it from
 * the global root rather than requiring a local node_modules.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const GLOBAL_ROOT = execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(GLOBAL_ROOT, 'playwright'));

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
  await page.waitForTimeout(600); // let webfonts settle before we snapshot

  const ids = await page.$$eval('.slide', els => els.map(e => e.id));

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const el = await page.$('#' + id);
    const file = path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await el.screenshot({ path: file });

    // Hard assertion: Instagram will re-crop anything that is not exactly 3:4.
    const { width, height } = await el.boundingBox();
    const ok = width === W && height === H;
    console.log(`${ok ? '✓' : '✗'} ${path.basename(file)}  ${width}x${height}`);
    if (!ok) process.exitCode = 1;
  }

  await browser.close();
  console.log(`\n${ids.length} slides → ${OUT}`);
})();
