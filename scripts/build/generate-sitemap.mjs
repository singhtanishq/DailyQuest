#!/usr/bin/env node
/**
 * Generates dist/sitemap.xml from the quest index at build time.
 * The site URL comes from DAILYQUEST_SITE_URL or is derived from the
 * repository field in package.json.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function siteUrl() {
  const env = process.env.DAILYQUEST_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  try {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    const url = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    const match = /github\.com[/:]([^/]+)\/([^/.]+)/.exec(url ?? '');
    if (match) return `https://${match[1]}.github.io/${match[2]}`;
  } catch {
    /* fall through */
  }
  return 'https://singhtanishq.github.io/DailyQuest';
}

const base = siteUrl();
const basePath = new URL(base).pathname.replace(/\/$/, '');

const index = JSON.parse(readFileSync(resolve(root, 'data', 'index.json'), 'utf8'));

const urls = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/archive', priority: '0.9', changefreq: 'daily' },
  { path: '/categories', priority: '0.6', changefreq: 'weekly' },
  { path: '/stats', priority: '0.5', changefreq: 'daily' },
  { path: '/about', priority: '0.4', changefreq: 'monthly' },
  ...index.quests.map((q) => ({
    path: `/quest/${q.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
    date: q.date,
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${base}${basePath === '' ? '' : basePath}${u.path}</loc>${
        u.date ? `<lastmod>${u.date}</lastmod>` : ''
      }<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

const dist = resolve(root, 'dist');
mkdirSync(dist, { recursive: true });
writeFileSync(resolve(dist, 'sitemap.xml'), xml, 'utf8');
console.log(`✓ sitemap.xml: ${urls.length} URLs for ${base}`);
