#!/usr/bin/env node
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = ['dist', 'coverage'];
for (const target of targets) {
  rmSync(resolve(process.cwd(), target), { recursive: true, force: true });
  console.log(`removed ${target}/`);
}
