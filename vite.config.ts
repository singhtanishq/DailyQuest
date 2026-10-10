/// <reference types="vitest/config" />
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * Base path for GitHub Pages project sites (github.com/<owner>/<repo> is served
 * under /<repo>/). Override with DAILYQUEST_BASE_PATH when deploying elsewhere
 * (user site, custom domain): set it to '/' in that case.
 */
const basePath = process.env.DAILYQUEST_BASE_PATH ?? '/DailyQuest/';

/**
 * Serves the canonical data/ directory from the repository root:
 *  - dev: middleware so the app can fetch /data/*.json without a copy step
 *  - build: copies data/ into dist/data/ as a final step
 * The committed data/ directory stays the single source of truth.
 */
function dailyQuestData(): Plugin {
  const dataDir = resolve(rootDir, 'data');
  return {
    name: 'dailyquest-data',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url ?? '';
        const url = raw.split('?')[0] ?? '';
        if (url.startsWith('/data/')) {
          const file = resolve(dataDir, url.slice('/data/'.length));
          if (existsSync(file) && file.startsWith(dataDir)) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(readFileSync(file, 'utf8'));
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      const outDir = resolve(rootDir, 'dist', 'data');
      mkdirSync(outDir, { recursive: true });
      cpSync(dataDir, outDir, { recursive: true });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [react(), dailyQuestData()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('/node_modules/')) {
            return undefined;
          }
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router') ||
            id.includes('/node_modules/scheduler/') ||
            id.includes('/node_modules/lucide-react/')
          ) {
            return 'vendor-react';
          }
          if (
            id.includes('/node_modules/highlight.js/') ||
            id.includes('/node_modules/@highlight-js/')
          ) {
            return 'vendor-highlight';
          }
          if (id.includes('/node_modules/fuse.js/')) {
            return 'vendor-search';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
