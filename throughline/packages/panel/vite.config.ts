import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * UXP runs a bundled, file-served page — there is no dev server and no module
 * graph to fetch from. So we build to a single self-contained IIFE with inlined
 * assets and no code splitting, then copy the manifest alongside it.
 *
 * `vite dev` still works and is the fast path for UI work: the panel detects
 * that Premiere is absent and falls back to a mock host (see src/premiere).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@throughline/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 1024 * 1024,
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'panel.js',
        assetFileNames: 'panel[extname]',
        inlineDynamicImports: true,
      },
      // UXP provides these as CommonJS built-ins at runtime; they must not be
      // bundled or Rollup will fail trying to resolve them from node_modules.
      external: ['uxp', 'premierepro'],
    },
  },
});
