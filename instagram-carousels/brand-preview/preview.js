#!/usr/bin/env node
/**
 * Renders the same two slides across several candidate palettes so they can be
 * compared side by side. Slides 3 and 5 are used because between them they
 * exercise every accent role in the system.
 *
 *   node preview.js
 */
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  try { return require('playwright'); } catch (_) {}
  const { execSync } = require('child_process');
  const g = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  return require(path.join(g, 'playwright'));
}
const { chromium } = loadPlaywright();

// Source deck — reused verbatim; only tokens are overridden.
const SRC = path.join(__dirname, '..', 'episode-02-empty-to-staged', 'slides.html');
const OUT = path.join(__dirname, 'out');
const W = 1080, H = 1440;

const PALETTES = {
  // A — Anthropic dark ground, orange leads, forest green carries emphasis.
  'a-anthropic': {
    ink: '#141413', card: '#1B1B19', paper: '#faf9f5',
    accent: '#d97757', accent2: '#98AE7C', muted: '#b0aea5',
    hair: 'rgba(250,249,245,.14)', neg: '#A8756A',
  },
  // B — the ground itself carries a forest cast; orange still leads.
  'b-forest-ground': {
    ink: '#0E1311', card: '#141B17', paper: '#faf9f5',
    accent: '#d97757', accent2: '#8FA97A', muted: '#9AA394',
    hair: 'rgba(250,249,245,.13)', neg: '#A8756A',
  },
  // C — forest green leads, orange becomes the spark.
  'c-forest-led': {
    ink: '#111512', card: '#181E19', paper: '#faf9f5',
    accent: '#8FA97A', accent2: '#d97757', muted: '#a3a89c',
    hair: 'rgba(250,249,245,.13)', neg: '#A8756A',
  },
};

// Token overrides + the two-accent role split. Orange (--accent) keeps labels,
// kickers and rules; green (--accent2) takes the emphasis lines so the payoff
// reads in a different colour from the scaffolding.
const override = p => `
<style>
  :root{
    --ink:${p.ink}; --paper:${p.paper}; --accent:${p.accent};
    --accent2:${p.accent2}; --muted:${p.muted}; --hair:${p.hair};
  }
  .slide{ background:${p.ink}; }
  .promptbox{ background:${p.card}; }
  h1 em, .card h2 em{ color:var(--accent2); }
  .promptbox .key{ color:var(--accent2); font-weight:700; }
  .promptbox .neg{ color:${p.neg}; }
  .lev .txt .n{ color:var(--accent2); }
  .lev .txt .p b{ background:rgba(143,169,122,.18); }
</style>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const src = fs.readFileSync(SRC, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  for (const [name, p] of Object.entries(PALETTES)) {
    // Write the variant next to the source so relative font/asset paths resolve.
    const tmp = path.join(path.dirname(SRC), `.preview-${name}.html`);
    fs.writeFileSync(tmp, src.replace('</head>', override(p) + '\n</head>'));

    await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);

    for (const id of ['s3', 's5']) {
      const el = await page.$('#' + id);
      const file = path.join(OUT, `${name}-${id}.png`);
      await el.screenshot({ path: file });
      console.log(`✓ ${path.basename(file)}`);
    }
    fs.unlinkSync(tmp);
  }

  await browser.close();
  console.log(`\n→ ${OUT}`);
})();
