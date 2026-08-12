#!/usr/bin/env node
/**
 * Generates content/manifest.json — the single interface between the carousel
 * content in this folder and whatever renders the website.
 *
 *   node content/build-content.js
 *
 * The site build consumes manifest.json and nothing else. It never reads an
 * episode folder directly, and nothing in an episode folder knows the site
 * exists. That's the whole contract: change a caption here, regenerate, and
 * the site picks it up on its next build.
 *
 * Three sources per episode, in order of authority:
 *   meta.json    — authored. Title, description, FAQ, publish date.
 *   caption.md   — the article body. Hook is the first line after the rule.
 *   slides.html  — alt text, derived from each slide's own headline so it
 *                  cannot drift from what the slide actually says.
 *
 * Fails loudly rather than emitting a half-manifest. A missing description is
 * a page with no meta description; better to break the build than ship it.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'manifest.json');
const HOOK_LIMIT = 125;

const errors = [];
const warnings = [];

/** Strip tags and collapse entities/whitespace to a plain sentence. */
function plain(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—').replace(/&hellip;/g, '…')
    .replace(/&rarr;/g, '→').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&#43;/g, '+')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Alt text, one entry per .slide, read from the slide's own kicker + headline.
 * Deriving it means the alt can never describe a slide that no longer exists.
 */
function altFromSlides(dir) {
  const file = path.join(dir, 'slides.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  const sections = html.split(/<section\b/).slice(1);
  return sections.map((sec) => {
    const kicker = (sec.match(/class="kicker"[^>]*>([\s\S]*?)<\/div>/) || [])[1];
    const head = (sec.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/) || [])[1];
    const parts = [plain(kicker || ''), plain(head || '')].filter(Boolean);
    return parts.length ? `Vaporswift slide — ${parts.join(': ')}` : null;
  }).filter(Boolean);
}

/** Caption body is everything after the first `---` rule; hook is line one. */
function readCaption(dir) {
  const file = path.join(dir, 'caption.md');
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const parts = raw.split(/\n---\n/);
  if (parts.length < 2) return null;
  // The trailing `## Notes` block is production commentary, not article copy.
  const body = parts[1].replace(/\n#+\s*Notes[\s\S]*$/, '').trim();
  const hook = body.split('\n').map((s) => s.trim()).find(Boolean) || '';
  const hashtags = [...new Set(body.match(/#[a-z0-9]+/gi) || [])];
  return { body, hook, hookChars: hook.length, hashtags };
}

function readEpisode(slug) {
  const dir = path.join(ROOT, slug);
  const metaFile = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaFile)) return null; // not a publishable episode

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  } catch (e) {
    errors.push(`${slug}/meta.json is not valid JSON: ${e.message}`);
    return null;
  }

  for (const key of ['code', 'track', 'title', 'description', 'format']) {
    if (!meta[key]) errors.push(`${slug}/meta.json is missing "${key}"`);
  }

  const caption = readCaption(dir);
  if (!caption) {
    errors.push(`${slug}/caption.md missing or has no \`---\` body separator`);
    return null;
  }
  if (caption.hookChars > HOOK_LIMIT) {
    errors.push(`${slug} hook is ${caption.hookChars} chars — over the ${HOOK_LIMIT} cut`);
  }

  // Rendered output is gitignored, so the manifest records the paths the site
  // should expect rather than asserting the files are on disk right now.
  const outDir = path.join(dir, 'out');
  const rendered = fs.existsSync(outDir)
    ? fs.readdirSync(outDir).filter((f) => /\.(png|mp4)$/.test(f)).sort()
    : [];
  const stills = rendered.filter((f) => f.endsWith('.png') && !f.includes('overlay'));
  const video = rendered.find((f) => f.endsWith('.mp4')) || null;

  const alt = meta.alt && meta.alt.length ? meta.alt : altFromSlides(dir);
  if (stills.length && alt.length && alt.length !== stills.length) {
    warnings.push(
      `${slug}: ${stills.length} stills but ${alt.length} alt strings — ` +
      `slide 1 is video on video-led posts, so this is expected there.`
    );
  }
  if (!alt.length) warnings.push(`${slug}: no alt text derived — slides.html has no headings?`);

  return {
    slug,
    code: meta.code,
    track: meta.track,
    trackName: meta.trackName || null,
    title: meta.title,
    shortTitle: meta.shortTitle || meta.title,
    description: meta.description,
    format: meta.format,
    published: meta.published || null,
    instagramUrl: meta.instagramUrl || null,
    hook: caption.hook,
    hookChars: caption.hookChars,
    body: caption.body,
    hashtags: caption.hashtags,
    faq: meta.faq || [],
    media: {
      video: video ? `${slug}/out/${video}` : null,
      stills: stills.map((f) => `${slug}/out/${f}`),
      alt,
    },
    sourceDir: slug,
    // Extra long-form artifacts worth their own page section, if present.
    extras: ['PROMPT.md', 'STORYBOARD.md', 'RECIPE.md']
      .filter((f) => fs.existsSync(path.join(dir, f)))
      .map((f) => `${slug}/${f}`),
  };
}

const slugs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'content')
  .map((d) => d.name)
  .sort();

const episodes = slugs.map(readEpisode).filter(Boolean);

// Stable ordering: track, then episode code.
episodes.sort((a, b) => (a.track + a.code).localeCompare(b.track + b.code));

if (errors.length) {
  console.error('\nRefusing to write manifest.json:\n');
  errors.forEach((e) => console.error('  ✗ ' + e));
  console.error('');
  process.exit(1);
}

const manifest = {
  $schema: './manifest.schema.md',
  version: 1,
  count: episodes.length,
  tracks: {
    A: 'AI prompting for real estate',
    B: 'AI prompting, everything else',
    C: 'Working with Claude',
    T: 'Films',
  },
  episodes,
};

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');

warnings.forEach((w) => console.log('  ! ' + w));
console.log(`\n✓ ${episodes.length} episodes → ${path.relative(ROOT, OUT)}`);
episodes.forEach((e) => {
  console.log(`  ${e.code.padEnd(4)} ${e.slug.padEnd(34)} ${String(e.hookChars).padStart(3)} chars  ` +
    `${e.media.stills.length} stills  ${e.media.alt.length} alt  ${e.faq.length} faq`);
});
