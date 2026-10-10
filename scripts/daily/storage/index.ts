import type { Quest, QuestIndexEntry, QuestIndexFile } from '../../../shared/types.js';
import { sha256Hex, textFingerprint } from '../core/hashing.js';

/** Compact content fingerprints stored with each index entry (16-hex each). */
export interface QuestFingerprints {
  /** contentHash, truncated */
  fpc: string;
  /** hash of the normalized title fingerprint */
  fpt: string;
  /** hash of the normalized prompt fingerprint */
  fpp: string;
}

export function fingerprintsFor(
  quest: Pick<Quest, 'contentHash' | 'title' | 'prompt'>,
): QuestFingerprints {
  return {
    fpc: quest.contentHash.slice(0, 16),
    fpt: sha256Hex(textFingerprint(quest.title)).slice(0, 16),
    fpp: sha256Hex(textFingerprint(quest.prompt)).slice(0, 16),
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
  generatedAt: string,
): { file: Omit<QuestIndexFile, 'quests'> & { quests: IndexEntry[] } } {
  const sorted = [...quests].sort((a, b) => a.date.localeCompare(b.date));
  return {
    file: {
      schemaVersion: 1 as const,
      generatorVersion,
      generatedAt,
      quests: sorted.map(toIndexEntry),
    },
  };
}
