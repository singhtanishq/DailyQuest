import type { Quest } from '../../../shared/types.js';
import { layoutFor, questPath } from './paths.js';
import { fileExists, readJsonFile, writeJsonAtomic } from './io.js';
import { loadArchive } from '../pipeline/context.js';
import { buildIndexFile, type IndexEntry } from './index.js';
import { buildStats, buildCategoriesFile, buildLatestFile } from './derived.js';

export interface RebuildResult {
  questCount: number;
  changedFiles: string[];
  resequenced: number;
}

/**
 * Rebuilds every derived file (index, stats, categories, latest, health)
 * from the canonical quest files — a deterministic full rebuild, never an
 * incremental patch.
 *
 * `generatedAt` is refreshed only when the file's CONTENT actually changes,
 * so a no-op rebuild leaves the working tree byte-identical (the basis of
 * the daily workflow's "no commit when nothing changed" guarantee).
 */
export function rebuildDerived(
  dataRoot: string,
  opts: { lastGeneration?: { date: string; questId: string; at: string } | null } = {}
): RebuildResult {
  const layout = layoutFor(dataRoot);
  const nowIso = new Date().toISOString();
  const changedFiles: string[] = [];
  let resequenced = 0;

  const archive = loadArchive(dataRoot);

  // Sequences follow date order. Backfilled dates in the middle of the
  // archive renumber successors — a metadata-only update.
  archive.forEach((quest, i) => {
    if (quest.sequenceNumber !== i + 1) {
      quest.sequenceNumber = i + 1;
      writeJsonAtomic(questPath(dataRoot, quest.date), quest);
      resequenced++;
    }
  });

  const writeDerivedIfChanged = (path: string, build: (generatedAt: string) => object): void => {
    const probe = build('__probe__');
    const canonical = JSON.stringify(probe, null, 2);
    if (fileExists(path)) {
      const current = readJsonFile<Record<string, unknown>>(path);
      const currentCanonical = JSON.stringify({ ...current, generatedAt: '__probe__' }, null, 2);
      if (currentCanonical === canonical) {
        return;
      }
    }
    writeJsonAtomic(path, build(nowIso));
    changedFiles.push(path);
  };

  writeDerivedIfChanged(layout.indexFile, (at) => buildIndexFile(archive, version(), at).file);
  writeDerivedIfChanged(layout.statsFile, (at) => ({
    schemaVersion: 1,
    generatorVersion: version(),
    generatedAt: at,
    ...buildStats(archive, version(), at),
  }));
  writeDerivedIfChanged(layout.categoriesFile, (at) => buildCategoriesFile(archive, version(), at));

  if (archive.length > 0) {
    writeDerivedIfChanged(layout.latestFile, (at) => {
      const index = buildIndexFile(archive, version(), at).file;
      return buildLatestFile(index.quests as IndexEntry[], version(), at);
    });
    writeDerivedIfChanged(layout.healthFile, () => ({
      schemaVersion: 1,
      generatorVersion: version(),
      status: 'ok' as const,
      latestQuestDate: archive[archive.length - 1]?.date ?? null,
      archiveCount: archive.length,
      lastGeneration: opts.lastGeneration ?? null,
    }));
  }

  return { questCount: archive.length, changedFiles, resequenced };
}

function version(): string {
  // Imported lazily to avoid a cycle at module load.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return config_.generatorVersion;
}

import { loadConfig } from '../../../config/dailyquest.config.js';
const config_ = loadConfig();

export function questsSorted(archive: Quest[]): Quest[] {
  return [...archive].sort((a, b) => a.date.localeCompare(b.date));
}
