import { createHash } from 'node:crypto';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Collapses whitespace so hashes and fingerprints ignore formatting noise. */
export function normalizeText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Reduces free text to a lowercase alphanumeric fingerprint. Used for title
 * and prompt duplicate detection: "The Regex Trap" and "the regex trap."
 * must collide; different challenges must not.
 */
export function textFingerprint(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export interface ContentFingerprintInput {
  templateId: string;
  paramsSignature: string;
  title: string;
  prompt: string;
  solutionSummary: string;
}

/**
 * Hash of the semantic content of a challenge. Deliberately excludes
 * identity fields (id, date, sequence) and volatile metadata, so two
 * generations that render the same challenge from the same template state
 * produce the same hash regardless of when they ran.
 */
export function computeContentHash(input: ContentFingerprintInput): string {
  const normalized = {
    templateId: input.templateId,
    paramsSignature: input.paramsSignature,
    title: normalizeText(input.title),
    prompt: normalizeText(input.prompt),
    solutionSummary: normalizeText(input.solutionSummary),
  };
  return sha256Hex(JSON.stringify(normalized));
}
