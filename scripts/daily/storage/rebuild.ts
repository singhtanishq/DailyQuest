import type { Quest } from '../../../shared/types.js';
import { loadConfig } from '../../../config/dailyquest.config.js';
import { layoutFor, questPath } from './paths.js';
import { fileExists, readJsonFile, writeJsonAtomic } from './io.js';
import { loadArchive } from '../pipeline/context.js';
import { buildIndexFile, type IndexEntry } from './index.js';
import { buildStats, buildCategoriesFile, buildLatestFile } from './derived.js';
import { ALL_TEMPLATES } from '../templates/index.js';

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
  opts: { lastGeneration?: { date: string; questId: string; at: string } | null } = {},
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
    const contentFingerprint = (o: object): string => {
      const clone = { ...(o as Record<string, unknown>) };
      delete clone.generatedAt;
      return JSON.stringify(clone, null, 2);
    };
    const next = build(nowIso);
    if (fileExists(path)) {
      const current = readJsonFile<Record<string, unknown>>(path);
      if (contentFingerprint(current) === contentFingerprint(next)) {
        return;
      }
    }
    writeJsonAtomic(path, next);
    changedFiles.push(path);
  };

  writeDerivedIfChanged(
    layout.indexFile,
    (at) => buildIndexFile(archive, config_.generatorVersion, at).file,
  );
  writeDerivedIfChanged(layout.statsFile, (at) => ({
    schemaVersion: 1,
    generatorVersion: config_.generatorVersion,
    generatedAt: at,
    ...buildStats(archive),
  }));
  writeDerivedIfChanged(layout.categoriesFile, (at) =>
    buildCategoriesFile(archive, config_.generatorVersion, at),
  );

  if (archive.length > 0) {
    writeDerivedIfChanged(layout.latestFile, (at) => {
      const index = buildIndexFile(archive, config_.generatorVersion, at).file;
      return buildLatestFile(index.quests as IndexEntry[], config_.generatorVersion, at);
    });
    // Preserve the lastGeneration marker on no-op runs so the health file
    // stays byte-stable (a requirement of the idempotent daily workflow).
    let existingLastGeneration = null;
    if (fileExists(layout.healthFile)) {
      existingLastGeneration =
        readJsonFile<{ lastGeneration?: { date: string; questId: string; at: string } | null }>(
          layout.healthFile,
        ).lastGeneration ?? null;
    }
    writeDerivedIfChanged(layout.healthFile, () => ({
      schemaVersion: 1,
      generatorVersion: config_.generatorVersion,
      status: 'ok' as const,
      latestQuestDate: archive[archive.length - 1]?.date ?? null,
      archiveCount: archive.length,
      templateCount: ALL_TEMPLATES.length,
      lastGeneration: opts.lastGeneration ?? existingLastGeneration,
    }));
  }

  return { questCount: archive.length, changedFiles, resequenced };
}

const config_ = loadConfig();

export function questsSorted(archive: Quest[]): Quest[] {
  return [...archive].sort((a, b) => a.date.localeCompare(b.date));
}
