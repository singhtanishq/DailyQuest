import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { Quest } from '../../../shared/types.js';
import { questPath, layoutFor } from '../storage/paths.js';
import { readJsonFile } from '../storage/io.js';
import { validateQuestStructure } from './schema.js';
import { fingerprintsFor } from '../storage/index.js';

export interface RepositoryReport {
  questCount: number;
  errors: string[];
  warnings: string[];
}

function listQuestFiles(dataRoot: string): string[] {
  const layout = layoutFor(dataRoot);
  const files: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(layout.questsDir, { recursive: true, encoding: 'utf8' });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (/^\d{4}-\d{2}-\d{2}\.json$/.test(entry.split(/[\\/]/).pop() ?? '')) {
      files.push(join(layout.questsDir, entry));
    }
  }
  return files.sort();
}

/**
 * Full consistency sweep over the archive: every quest file, the index,
 * statistics, category summaries and the latest pointer must agree.
 * Exits non-zero at the CLI level when errors exist.
 */
export function validateRepository(dataRoot: string): RepositoryReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const layout = layoutFor(dataRoot);
  const files = listQuestFiles(dataRoot);
  const quests: Quest[] = [];

  // Per-file structural validation
  for (const file of files) {
    let quest: Quest;
    try {
      quest = readJsonFile<Quest>(file);
    } catch (error) {
      errors.push(`${relative(dataRoot, file)}: ${(error as Error).message}`);
      continue;
    }
    const rel = relative(dataRoot, file);
    const expectedPath = relative(dataRoot, questPath(dataRoot, quest.date));
    if (rel !== expectedPath) {
      errors.push(`${rel}: file is at the wrong path (expected ${expectedPath})`);
    }
    for (const failed of validateQuestStructure(quest).filter((c) => !c.passed)) {
      errors.push(`${rel}: ${failed.id}${failed.detail ? ` — ${failed.detail}` : ''}`);
    }
    if (quest.validation.passed !== true) {
      errors.push(
        `${rel}: quest is marked as not validated (validation.passed must be true for published quests)`,
      );
    }
    quests.push(quest);
  }

  quests.sort((a, b) => a.date.localeCompare(b.date));

  // An untouched repository (no quests, no derived files) is not an error —
  // it is simply a fresh install that has not published yet.
  if (quests.length === 0 && files.length === 0 && !existsSync(layout.indexFile)) {
    return { questCount: 0, errors: [], warnings: ['archive is empty — no quests published yet'] };
  }

  // Cross-file invariants
  const seen = {
    ids: new Map<string, string>(),
    dates: new Map<string, string>(),
    slugs: new Map<string, string>(),
    hashes: new Map<string, string>(),
    titles: new Map<string, string>(),
    prompts: new Map<string, string>(),
  };
  quests.forEach((quest, i) => {
    const rel = `data/quests/${quest.date.replaceAll('-', '/').slice(0, 7)}/${quest.date}.json`;
    const register = (map: Map<string, string>, key: string, label: string): void => {
      const existing = map.get(key);
      if (existing !== undefined) {
        errors.push(`duplicate ${label} "${key}": ${existing} and ${rel}`);
      } else {
        map.set(key, rel);
      }
    };
    register(seen.ids, quest.id, 'id');
    register(seen.dates, quest.date, 'date');
    register(seen.slugs, quest.slug, 'slug');
    register(seen.hashes, quest.contentHash.slice(0, 16), 'content hash');
    register(seen.titles, fingerprintsFor(quest).fpt, 'title');
    register(seen.prompts, fingerprintsFor(quest).fpp, 'prompt');

    if (quest.sequenceNumber !== i + 1) {
      errors.push(`${rel}: sequenceNumber ${quest.sequenceNumber} != ${i + 1} (date order)`);
    }
    for (const related of quest.relatedQuestIds) {
      if (!seen.ids.has(related) && !quests.some((q) => q.id === related)) {
        errors.push(`${rel}: relatedQuestId ${related} does not exist`);
      }
    }
  });

  // Index agreement
  let indexEntries: Array<ReturnType<typeof JSON.parse>> = [];
  try {
    const index = readJsonFile<{ quests?: unknown[] }>(layout.indexFile);
    indexEntries = (index.quests ?? []) as Array<ReturnType<typeof JSON.parse>>;
  } catch (error) {
    errors.push(`index.json: ${(error as Error).message}`);
  }
  if (indexEntries.length !== quests.length) {
    errors.push(
      `index.json has ${indexEntries.length} entries but ${quests.length} quest files exist`,
    );
  }
  for (const entry of indexEntries) {
    const e = entry as {
      id?: string;
      date?: string;
      slug?: string;
      title?: string;
      contentHash?: string;
    };
    const quest = quests.find((q) => q.id === e.id);
    if (!quest) {
      errors.push(`index.json entry ${e.id ?? '?'} has no quest file`);
      continue;
    }
    if (e.slug !== quest.slug || e.title !== quest.title || e.date !== quest.date) {
      errors.push(`index.json entry ${e.id} disagrees with the quest file`);
    }
  }
  for (const quest of quests) {
    if (!indexEntries.some((e) => (e as { id?: string }).id === quest.id)) {
      errors.push(`quest ${quest.id} is missing from index.json`);
    }
  }

  // Stats agreement (structural fields only; generatedAt naturally differs)
  try {
    const stats = readJsonFile<Record<string, unknown>>(layout.statsFile);
    const expectedCounts = quests.length;
    if (stats.totalQuests !== expectedCounts) {
      errors.push(`stats.json totalQuests ${String(stats.totalQuests)} != ${expectedCounts}`);
    }
    const byCategory = (stats.byCategory ?? {}) as Record<string, number>;
    const actualCategory: Record<string, number> = {};
    for (const q of quests) {
      actualCategory[q.category] = (actualCategory[q.category] ?? 0) + 1;
    }
    if (JSON.stringify(byCategory) !== JSON.stringify(actualCategory)) {
      errors.push('stats.json byCategory disagrees with the archive');
    }
  } catch (error) {
    errors.push(`stats.json: ${(error as Error).message}`);
  }

  // Latest pointer
  try {
    const latest = readJsonFile<{ quest?: { id?: string } }>(layout.latestFile);
    const newest = quests[quests.length - 1];
    if (quests.length > 0 && latest.quest?.id !== newest?.id) {
      errors.push(
        `latest.json points at ${String(latest.quest?.id)} but the newest quest is ${String(newest?.id)}`,
      );
    }
  } catch (error) {
    errors.push(`latest.json: ${(error as Error).message}`);
  }

  // Date gaps are informational only
  for (let i = 1; i < quests.length; i++) {
    const prev = quests[i - 1]?.date;
    const curr = quests[i]?.date;
    if (prev && curr) {
      const [py, pm, pd] = prev.split('-').map(Number) as [number, number, number];
      const [cy, cm, cd] = curr.split('-').map(Number) as [number, number, number];
      const prevMs = Date.UTC(py, pm - 1, pd);
      const currMs = Date.UTC(cy, cm - 1, cd);
      const gapDays = Math.round((currMs - prevMs) / 86_400_000);
      if (gapDays > 1) {
        warnings.push(`gap in archive: ${prev} → ${curr} (${gapDays - 1} day(s) without a quest)`);
      }
    }
  }

  return { questCount: quests.length, errors, warnings };
}
