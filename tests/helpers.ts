import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { config as baseConfig, type DailyQuestConfig } from '../config/dailyquest.config.js';
import type { Quest } from '../shared/types.js';
import { Rng, deriveSeed } from '../scripts/daily/core/rng.js';
import { loadArchive } from '../scripts/daily/pipeline/context.js';
import { generateQuestForDate, type PipelineContext } from '../scripts/daily/pipeline/generate.js';

/**
 * Test helpers: isolated data roots, fixed clocks, and a template-sourced
 * quest factory so validator tests do not depend on the real archive.
 */

export { describe, expect, it, beforeEach, afterEach } from 'vitest';
export const test = (await import('vitest')).test;

export function makeTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'dailyquest-test-'));
}

export function cleanupTempRoot(root: string): void {
  rmSync(root, { recursive: true, force: true });
}

export function testConfig(overrides: Partial<DailyQuestConfig> = {}): DailyQuestConfig {
  return { ...baseConfig, ...overrides, rotation: { ...baseConfig.rotation, ...overrides.rotation } };
}

export function makeContext(options: {
  dataRoot: string;
  today?: string;
  now?: Date;
  config?: DailyQuestConfig;
  dryRun?: boolean;
  seedArchive?: Quest[];
}): PipelineContext {
  return {
    dataRoot: options.dataRoot,
    config: options.config ?? testConfig(),
    archive: options.seedArchive ?? [],
    todayOverride: options.today,
    now: options.now ?? new Date('2026-10-10T12:00:00.000Z'),
    dryRun: options.dryRun ?? false,
  };
}

/** Generates a full quest for a date inside a temp root and returns it. */
export function generateInto(
  dataRoot: string,
  date: string,
  archive: Quest[] = []
): Quest {
  const ctx = makeContext({ dataRoot, now: new Date('2026-10-10T12:00:00.000Z') });
  ctx.archive = archive;
  const result = generateQuestForDate(date, ctx);
  if (!result.quest) {
    throw new Error(`Generation for ${date} did not produce a quest`);
  }
  return result.quest;
}

/** Writes an existing quest into a temp data root at the canonical path. */
export function seedQuestFile(dataRoot: string, quest: Quest): void {
  const [year = '', month = ''] = quest.date.split('-');
  mkdirSync(join(dataRoot, 'quests', year, month), { recursive: true });
  writeFileSync(
    join(dataRoot, 'quests', year, month, `${quest.date}.json`),
    JSON.stringify(quest, null, 2)
  );
}

export { loadArchive, Rng, deriveSeed };
