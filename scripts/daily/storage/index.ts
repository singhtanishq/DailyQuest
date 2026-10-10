import type { Quest, QuestIndexEntry, QuestIndexFile, SCHEMA_VERSION } from '../../../shared/types.js';
import { textFingerprint } from '../core/hashing.js';

/** Compact content fingerprints stored with each index entry. */
export interface QuestFingerprints {
  /** contentHash, truncated */
  fpc: string;
  /** normalized title fingerprint */
  fpt: string;
  /** hashed normalized prompt fingerprint */
  fpp: string;
}

export function fingerprintsFor(quest: Pick<Quest, 'contentHash' | 'title' | 'prompt'>): QuestFingerprints {
  return {
    fpc: quest.contentHash.slice(0, 16),
    fpt: textFingerprint(quest.title).slice(0, 40),
    fpp: textFingerprint(quest.prompt).slice(0, 40),
  };
}

export function toIndexEntry(quest: Quest): QuestIndexEntry & QuestFingerprints {
  return {
    id: quest.id,
    date: quest.date,
    sequenceNumber: quest.sequenceNumber,
    slug: quest.slug,
    title: quest.title,
    shortTitle: quest.shortTitle,
    description: quest.description,
    category: quest.category,
    challengeType: quest.challengeType,
    difficulty: quest.difficulty,
    difficultyScore: quest.difficultyScore,
    estimatedMinutes: quest.estimatedMinutes,
    concepts: quest.concepts,
    tags: quest.tags,
    contentHash: quest.contentHash,
    ...fingerprintsFor(quest),
  };
}

/**
 * Index entries are typed as QuestIndexEntry & QuestFingerprints; the file
 * keeps the union shape. The index is sorted by date ascending — the
 * canonical archive order.
 */
export type IndexEntry = QuestIndexEntry & QuestFingerprints;

export function buildIndexFile(
  quests: Quest[],
  generatorVersion: string,
  generatedAt: string
): { file: Omit<QuestIndexFile, 'quests'> & { quests: IndexEntry[] } } {
  const sorted = [...quests].sort((a, b) => a.date.localeCompare(b.date));
  return {
    file: {
      schemaVersion: 1 satisfies typeof SCHEMA_VERSION,
      generatorVersion,
      generatedAt,
      quests: sorted.map(toIndexEntry),
    },
  };
}
