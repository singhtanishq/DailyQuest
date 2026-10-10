import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyDist } from '../scripts/build/verify-dist.js';

const GOOD_INDEX = `<!doctype html>
<html lang="en">
  <head>
    <script type="module" crossorigin src="/DailyQuest/assets/index-abc123.js"></script>
    <link rel="stylesheet" crossorigin href="/DailyQuest/assets/index-abc123.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

function makeDist(files: Record<string, string>): string {
  const dir = mkdtempSync(join(process.env.TMPDIR ?? '/tmp', 'dailyquest-dist-'));
  for (const [path, content] of Object.entries(files)) {
    const target = join(dir, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content);
  }
  return dir;
}

function goodFiles(indexHtml = GOOD_INDEX): Record<string, string> {
  return {
    'index.html': indexHtml,
    '404.html': '<html></html>',
    'data/index.json': '{}',
    'data/latest.json': '{}',
    'sitemap.xml': '<urlset></urlset>',
    'robots.txt': 'User-agent: *',
    'assets/index-abc123.js': '// bundle',
  };
}

describe('verifyDist', () => {
  it('accepts a correct production build', () => {
    const dir = makeDist(goodFiles());
    try {
      const result = verifyDist(dir, { basePath: '/DailyQuest/' });
      expect(result.errors).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when the development entry point /src/main.tsx survives', () => {
    const dir = makeDist(
      goodFiles(
        GOOD_INDEX.replace('/DailyQuest/assets/index-abc123.js', '/src/main.tsx')
      )
    );
    try {
      const result = verifyDist(dir, { basePath: '/DailyQuest/' });
      expect(result.errors.some((e) => e.includes('/src/main.tsx'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails on any reference into the development /src/ tree', () => {
    const dir = makeDist(
      goodFiles(GOOD_INDEX.replace('/DailyQuest/assets/index-abc123.css', '/src/styles.css'))
    );
    try {
      const result = verifyDist(dir, { basePath: '/DailyQuest/' });
      expect(result.errors.some((e) => e.includes('/src/styles.css'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when assets ignore the configured base path', () => {
    const dir = makeDist(
      goodFiles(GOOD_INDEX.replace('/DailyQuest/assets', '/assets'))
    );
    try {
      const result = verifyDist(dir, { basePath: '/DailyQuest/' });
      expect(
        result.errors.some((e) => e.includes('base path /DailyQuest/') || e.includes('root-relative'))
      ).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when required deployment files are missing', () => {
    const files = goodFiles();
    delete files['404.html'];
    delete files['data/latest.json'];
    const dir = makeDist(files);
    try {
      const result = verifyDist(dir, { basePath: '/DailyQuest/' });
      expect(result.errors.some((e) => e.includes('404.html'))).toBe(true);
      expect(result.errors.some((e) => e.includes('data/latest.json'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when the build never ran', () => {
    const dir = mkdtempSync(join(process.env.TMPDIR ?? '/tmp', 'dailyquest-empty-'));
    try {
      const result = verifyDist(dir, { basePath: '/DailyQuest/' });
      expect(result.errors[0]).toContain('dist/index.html missing');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts root-relative assets when the base path is "/"', () => {
    const dir = makeDist(
      goodFiles(GOOD_INDEX.replaceAll('/DailyQuest/assets', '/assets'))
    );
    try {
      const result = verifyDist(dir, { basePath: '/' });
      expect(result.errors).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
