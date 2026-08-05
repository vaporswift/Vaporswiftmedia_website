/**
 * Assemble the built panel into a loadable UXP plugin folder.
 *
 * Vite emits the page; UXP additionally needs the manifest and icons sitting
 * beside it. Point the UXP Developer Tool at `dist/` after running this.
 */

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const dist = resolve(packageRoot, 'dist');

const manifest = JSON.parse(await readFile(resolve(packageRoot, 'manifest.json'), 'utf8'));

// Keep the plugin version in step with the package version, so a published
// build can never claim a version the repo does not have.
const pkg = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
manifest.version = pkg.version;

await mkdir(dist, { recursive: true });
await writeFile(resolve(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const icons = resolve(packageRoot, 'icons');
if (existsSync(icons)) {
  await cp(icons, resolve(dist, 'icons'), { recursive: true });
} else {
  console.warn('[throughline] no icons/ directory — the panel will load with a default icon');
}

console.log(`[throughline] plugin ready at ${dist}`);
