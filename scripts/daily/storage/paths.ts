import { join } from 'node:path';

/** Centralized path layout for the data directory. */
export interface DataLayout {
  root: string;
  questsDir: string;
  reportsDir: string;
  indexFile: string;
  statsFile: string;
  latestFile: string;
  categoriesFile: string;
  healthFile: string;
}

export function layoutFor(dataRoot: string): DataLayout {
  return {
    root: dataRoot,
    questsDir: join(dataRoot, 'quests'),
    reportsDir: join(dataRoot, '..', 'reports', 'daily'),
    indexFile: join(dataRoot, 'index.json'),
    statsFile: join(dataRoot, 'stats.json'),
    latestFile: join(dataRoot, 'latest.json'),
    categoriesFile: join(dataRoot, 'categories.json'),
    healthFile: join(dataRoot, 'health.json'),
  };
}

/** data/quests/2026/10/2026-10-07.json */
export function questPath(dataRoot: string, date: string): string {
  const [year = '', month = ''] = date.split('-');
  return join(dataRoot, 'quests', year, month, `${date}.json`);
}

/** reports/daily/2026-10-07.json */
export function reportPath(dataRoot: string, date: string): string {
  return join(dataRoot, '..', 'reports', 'daily', `${date}.json`);
}
