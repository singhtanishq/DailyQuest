import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Quest } from '../../../shared/types.js';
import type { RecentArchive } from '../core/selection.js';
import { layoutFor } from '../storage/paths.js';
import { readJsonFile } from '../storage/io.js';

/** Loads every quest file from data/quests, sorted by date ascending. */
export function loadArchive(dataRoot: string): Quest[] {
  const layout = layoutFor(dataRoot);
  let entries: string[];
  try {
    entries = readdirSync(layout.questsDir, { recursive: true, encoding: 'utf8' });
  } catch {
    return [];
  }
  const quests: Quest[] = [];
  for (const entry of entries) {
    if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(entry.split(/[\\/]/).pop() ?? '')) {
      continue;
    }
    try {
      quests.push(readJsonFile<Quest>(join(layout.questsDir, entry)));
    } catch (error) {
      throw new Error(`Archive file ${entry} is unreadable: ${(error as Error).message}`);
    }
  }
  return quests.sort((a, b) => a.date.localeCompare(b.date));
}

/** Extracts the newest-first rotation context from the archive. */
export function recentFromArchive(archive: Quest[]): RecentArchive {
  const newestFirst = [...archive].reverse();
  return {
    dates: newestFirst.map((q) => q.date),
    categories: newestFirst.map((q) => q.category),
    templateIds: newestFirst.map((q) => q.templateId),
    primaryConcepts: newestFirst.map((q) => q.concepts[0] ?? ''),
  };
}

/** Up to 3 nearest quests from the same category, oldest-reference stable. */
export function computeRelated(
  category: string,
  date: string,
  archive: Quest[],
  selfId: string,
): string[] {
  return archive
    .filter((q) => q.category === category && q.id !== selfId && q.date !== date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-3)
    .map((q) => q.id);
}
