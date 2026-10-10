#!/usr/bin/env node
/**
 * Post-build verification: the dist output must be a real production build,
 * or deployment must not proceed.
 *
 * Assertions:
 *  - index.html exists and was transformed by Vite (no development entry point)
 *  - no script/href references into /src/ (the dev-only source tree)
 *  - asset URLs use the configured base path (e.g. /DailyQuest/assets/…)
 *  - SPA fallback (404.html), data layer, sitemap and robots.txt are present
 *
 * Run directly (npm run build does this) or import verifyDist() from tests.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface DistVerifyResult {
  errors: string[];
  notes: string[];
}

export function verifyDist(
  distDir: string,
  opts: { basePath?: string } = {}
): DistVerifyResult {
  const rawBase = opts.basePath ?? process.env.DAILYQUEST_BASE_PATH ?? '/DailyQuest/';
  const basePath = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const errors: string[] = [];
  const notes: string[] = [];
  const fail = (message: string): void => {
    errors.push(message);
  };

  if (!existsSync(distDir)) {
    fail('dist/ does not exist — the build did not run');
    return { errors, notes };
  }

  // ---- index.html: must be the transformed production shell ----
  const indexPath = join(distDir, 'index.html');
  if (!existsSync(indexPath)) {
    fail('dist/index.html missing');
  } else {
    const html = readFileSync(indexPath, 'utf8');

    if (!html.includes('<div id="root">')) {
      fail('dist/index.html does not contain the app mount point (#root) — wrong file deployed?');
    }

    if (html.includes('/src/main.tsx') || /src\s*=\s*"[^"]*main\.tsx"/.test(html)) {
      fail(
        'dist/index.html references the development-only entry point /src/main.tsx — the Vite production build was not applied'
      );
    }

    // Any reference into the dev source tree is a deployment bug.
    const references = [...html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)].map(
      (m) => m[1] ?? ''
    );
    for (const ref of references) {
      if (ref.startsWith('/src/')) {
        fail(`dist/index.html references development source path: ${ref}`);
      }
    }

    if (basePath === '/') {
      if (!references.some((ref) => ref.includes('/assets/'))) {
        fail('dist/index.html has no bundled asset references under /assets/');
      }
    } else {
      if (!html.includes(`${basePath}assets/`)) {
        fail(
          `dist/index.html does not reference assets under the configured base path ${basePath} — check vite.config.ts "base"`
        );
      }
      for (const ref of references) {
        if (/^\/(assets|data)\//.test(ref)) {
          fail(
            `dist/index.html uses root-relative "${ref}" instead of "${basePath}…" — deployed project sites would 404`
          );
        }
      }
    }
  }

  // ---- SPA fallback for GitHub Pages deep links ----
  if (!existsSync(join(distDir, '404.html'))) {
    fail('dist/404.html missing — GitHub Pages SPA fallback would break on deep links');
  }

  // ---- data layer + SEO files ----
  for (const file of ['data/index.json', 'data/latest.json', 'sitemap.xml', 'robots.txt']) {
    if (!existsSync(join(distDir, file))) {
      fail(`dist/${file} missing`);
    }
  }

  const assetsDir = join(distDir, 'assets');
  if (existsSync(assetsDir)) {
    const files = readdirSync(assetsDir);
    const totalBytes = files.reduce((sum, file) => {
      const stats = statSync(join(assetsDir, file));
      return stats.isFile() ? sum + stats.size : sum;
    }, 0);
    notes.push(`assets: ${files.length} files, ${(totalBytes / 1024).toFixed(0)} KB total`);
  } else {
    fail('dist/assets/ missing — no JavaScript was bundled');
  }

  return { errors, notes };
}

function main(): void {
  const dist = resolve(process.cwd(), 'dist');
  const { errors, notes } = verifyDist(dist);
  for (const note of notes) {
    console.log(`• ${note}`);
  }
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`✗ ${error}`);
    }
    process.exit(1);
  }
  console.log(`✓ dist output verified (base path ${process.env.DAILYQUEST_BASE_PATH ?? '/DailyQuest/'})`);
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main();
}
