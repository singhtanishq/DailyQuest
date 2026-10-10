import type { Quest } from '../../../shared/types.js';
import { textFingerprint } from '../core/hashing.js';

/**
 * Duplicate detection: a new quest must not repeat the content hash, the
 * normalized title, or the normalized prompt of any published quest.
 * Near-duplicate analysis beyond normalization is deliberately conservative —
 * legitimate variants must not be rejected.
 */

export interface DraftFingerprints {
  contentHash: string;
  titleFingerprint: string;
  promptFingerprint: string;
}

export function draftFingerprints(quest: Pick<Quest, 'contentHash' | 'title' | 'prompt'>): DraftFingerprints {
  return {
    contentHash: quest.contentHash,
    titleFingerprint: textFingerprint(quest.title),
    promptFingerprint: textFingerprint(quest.prompt),
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
  existing: ExistingFingerprints[]
): string | null {
  const contentPrefix = draft.contentHash.slice(0, 16);
  for (const candidate of existing) {
    if (candidate.fpc === contentPrefix) {
      return candidate.id;
    }
    if (candidate.fpt !== '' && candidate.fpt === draft.titleFingerprint.slice(0, 40)) {
      return candidate.id;
    }
    if (candidate.fpp !== '' && candidate.fpp === draft.promptFingerprint.slice(0, 40)) {
      return candidate.id;
    }
  }
  return null;
}
