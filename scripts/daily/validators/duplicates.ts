import type { Quest } from '../../../shared/types.js';
import { sha256Hex, textFingerprint } from '../core/hashing.js';

/**
 * Duplicate detection: a new quest must not repeat the content hash, the
 * normalized title, or the normalized prompt of any published quest.
 * Fingerprints are 16-hex hashes of the normalized text; near-duplicate
 * analysis beyond normalization is deliberately conservative — legitimate
 * variants must not be rejected.
 */

export interface DraftFingerprints {
  contentHash: string;
  titleFingerprint: string;
  promptFingerprint: string;
}

export function draftFingerprints(
  quest: Pick<Quest, 'contentHash' | 'title' | 'prompt'>,
): DraftFingerprints {
  return {
    contentHash: quest.contentHash.slice(0, 16),
    titleFingerprint: sha256Hex(textFingerprint(quest.title)).slice(0, 16),
    promptFingerprint: sha256Hex(textFingerprint(quest.prompt)).slice(0, 16),
  };
}

export interface ExistingFingerprints {
  id: string;
  fpc: string;
  fpt: string;
  fpp: string;
}

/** Returns the conflicting quest id, or null when the draft is unique. */
export function findDuplicate(
  draft: DraftFingerprints,
  existing: ExistingFingerprints[],
): string | null {
  for (const candidate of existing) {
    if (candidate.fpc !== '' && candidate.fpc === draft.contentHash) {
      return candidate.id;
    }
    if (candidate.fpt !== '' && candidate.fpt === draft.titleFingerprint) {
      return candidate.id;
    }
    if (candidate.fpp !== '' && candidate.fpp === draft.promptFingerprint) {
      return candidate.id;
    }
  }
  return null;
}
