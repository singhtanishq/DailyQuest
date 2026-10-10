import { describe, expect, it } from 'vitest';

import { cleanupTempRoot, generateInto, makeTempRoot } from './helpers.js';
import { questId, questSlug, slugify } from '../scripts/daily/core/slug.js';
import { computeContentHash, textFingerprint } from '../scripts/daily/core/hashing.js';
import { qualityScore, validateQuestStructure } from '../scripts/daily/validators/schema.js';
import { draftFingerprints, findDuplicate } from '../scripts/daily/validators/duplicates.js';
import { fingerprintsFor } from '../scripts/daily/storage/index.js';
import { planCatchUp } from '../scripts/daily/pipeline/catchup.js';
import { validateRepository } from '../scripts/daily/validators/repository.js';

describe('slug', () => {
  it('slugifies titles to URL-safe kebab case', () => {
    expect(slugify('The Vanishing Promise')).toBe('the-vanishing-promise');
    expect(slugify('Regex: Under Pressure!')).toBe('regex-under-pressure');
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });

  it('builds canonical ids and slugs', () => {
    expect(questId('2026-10-07')).toBe('dq-2026-10-07');
    expect(questSlug('2026-10-07', 'A Cache Gone Wrong')).toBe('2026-10-07-a-cache-gone-wrong');
  });
});

describe('hashing + fingerprints', () => {
  it('content hash ignores whitespace but not wording', () => {
    const base = {
      templateId: 't',
      paramsSignature: 'v1',
      title: 'Same Title',
      prompt: 'Line one.\nLine two.',
      solutionSummary: 'Same answer.',
    };
    expect(computeContentHash(base)).toBe(
      computeContentHash({ ...base, prompt: 'Line one.   Line two.' }),
    );
    expect(computeContentHash(base)).not.toBe(
      computeContentHash({ ...base, title: 'Different Title' }),
    );
  });

  it('text fingerprints collide on punctuation/case, not on words', () => {
    expect(textFingerprint('The Regex Trap!')).toBe(textFingerprint('the regex trap'));
    expect(textFingerprint('The Regex Trap')).not.toBe(textFingerprint('The Regex Wrapper'));
  });

  it('index fingerprints match draft fingerprints for the same quest', () => {
    const quest = {
      contentHash: 'a'.repeat(64),
      title: 'The Balanced Ledger',
      prompt: 'A bracket balancing quest prompt.',
    };
    const index = fingerprintsFor(quest);
    const draft = draftFingerprints(quest);
    expect(index.fpc).toBe(draft.contentHash);
    expect(index.fpt).toBe(draft.titleFingerprint);
    expect(index.fpp).toBe(draft.promptFingerprint);
  });

  it('findDuplicate catches each fingerprint class', () => {
    const existing = [{ id: 'dq-2026-10-01', fpc: 'aaaa', fpt: 'bbbb', fpp: 'cccc' }];
    expect(
      findDuplicate(
        { contentHash: 'aaaa', titleFingerprint: 'x', promptFingerprint: 'y' },
        existing,
      ),
    ).toBe('dq-2026-10-01');
    expect(
      findDuplicate(
        { contentHash: 'zzzz', titleFingerprint: 'bbbb', promptFingerprint: 'y' },
        existing,
      ),
    ).toBe('dq-2026-10-01');
    expect(
      findDuplicate(
        { contentHash: 'zzzz', titleFingerprint: 'x', promptFingerprint: 'cccc' },
        existing,
      ),
    ).toBe('dq-2026-10-01');
    expect(
      findDuplicate(
        { contentHash: 'zzzz', titleFingerprint: 'x', promptFingerprint: 'y' },
        existing,
      ),
    ).toBeNull();
  });
});

describe('planCatchUp', () => {
  it('returns only today on first run', () => {
    expect(planCatchUp(null, '2026-10-07', 7)).toEqual({ dates: ['2026-10-07'] });
  });

  it('returns no dates when up to date', () => {
    expect(planCatchUp('2026-10-07', '2026-10-07', 7).dates).toEqual([]);
  });

  it('backfills small gaps', () => {
    expect(planCatchUp('2026-10-05', '2026-10-08', 7).dates).toEqual([
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
    ]);
  });

  it('refuses giant gaps and records a warning', () => {
    const plan = planCatchUp('2026-09-01', '2026-10-07', 7);
    expect(plan.dates).toEqual(['2026-10-07']);
    expect(plan.warning).toContain('36 days were missed');
  });
});

describe('generated quests pass validation', () => {
  it('a freshly generated quest scores 100 and passes every structural check', () => {
    const root = makeTempRoot();
    try {
      const quest = generateInto(root, '2026-01-15');
      const checks = validateQuestStructure(quest);
      expect(checks.filter((c) => !c.passed)).toEqual([]);
      expect(qualityScore(checks)).toBe(100);
      expect(quest.id).toBe('dq-2026-01-15');
      expect(quest.slug).toBe(questSlug(quest.date, quest.title));
      expect(quest.validation.passed).toBe(true);
    } finally {
      cleanupTempRoot(root);
    }
  });
});

describe('validateRepository on an empty root', () => {
  it('reports zero quests without crashing', () => {
    const root = makeTempRoot();
    try {
      const report = validateRepository(root);
      expect(report.questCount).toBe(0);
      expect(report.errors).toEqual([]);
    } finally {
      cleanupTempRoot(root);
    }
  });
});
