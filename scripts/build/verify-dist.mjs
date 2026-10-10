#!/usr/bin/env node
/**
 * Post-build verification: the dist output must contain the app shell and
 * the data layer, or deployment must not proceed.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const errors = [];

function fail(message) {
  errors.push(message);
}

if (!existsSync(dist)) {
  fail('dist/ does not exist — the build did not run');
} else {
  if (!existsSync(join(dist, 'index.html'))) {
    fail('dist/index.html missing');
  }
  if (!existsSync(join(dist, '404.html'))) {
    fail('dist/404.html missing — GitHub Pages SPA fallback would break on deep links');
  }
  if (!existsSync(join(dist, 'data', 'index.json'))) {
    fail('dist/data/index.json missing — the app would have no archive');
  }
  if (!existsSync(join(dist, 'data', 'latest.json'))) {
    fail('dist/data/latest.json missing — the homepage would have no today quest');
  }
  const assets = join(dist, 'assets');
  if (existsSync(assets)) {
    const files = readdirSync(assets);
    const totalBytes = files.reduce((sum, f) => {
      const s = statSync(join(assets, f));
      return s.isFile() ? sum + s.size : sum;
    }, 0);
    console.log(`assets: ${files.length} files, ${(totalBytes / 1024).toFixed(0)} KB total`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`✗ ${error}`);
  }
  process.exit(1);
}
console.log('✓ dist output verified');
