import { relative } from 'node:path';

import type { Quest } from '../../../shared/types.js';
import type { DailyQuestConfig } from '../../../config/dailyquest.config.js';
import { getTodayInTz } from '../core/dates.js';
import { deriveSeed, Rng } from '../core/rng.js';
import {
  selectCategory,
  selectDifficulty,
  selectTemplate,
  templatesForCategory,
} from '../core/selection.js';
import { questPath } from '../storage/paths.js';
import { fileExists, readJsonFile, writeJsonAtomic } from '../storage/io.js';
import { fingerprintsFor } from '../storage/index.js';
import { ALL_TEMPLATES } from '../templates/index.js';
import { runVerification, VerificationError } from '../verify/runners.js';
import { validateQuestStructure, qualityScore } from '../validators/schema.js';
import { draftFingerprints, findDuplicate, type ExistingFingerprints } from '../validators/duplicates.js';
import { assembleQuest } from './assemble.js';
import { computeRelated, recentFromArchive } from './context.js';

/**
 * Generation core: deterministic, idempotent, duplicate-aware.
 *
 * The same date always produces the same quest: the seed is derived from the
 * date, the RNG consumes draws in a fixed order, and every candidate must
 * pass template verification plus structural validation before it may be
 * written. Existing quest files are never regenerated.
 */

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}

export interface PipelineContext {
  dataRoot: string;
  config: DailyQuestConfig;
  /** The archive as known so far; grows as quests are generated in this run. */
  archive: Quest[];
  /** Overrides "today" (tests only); when omitted the publication timezone decides. */
  todayOverride?: string;
  now?: Date;
  dryRun: boolean;
}

export interface GenerateOutcome {
  outcome: 'created' | 'already-exists' | 'dry-run';
  quest: Quest | null;
  warnings: string[];
  changedFile: string | null;
}

export function resolveToday(ctx: PipelineContext): string {
  if (ctx.todayOverride) {
    return ctx.todayOverride;
  }
  return getTodayInTz(ctx.config.publicationTimezone);
}

export function generateQuestForDate(date: string, ctx: PipelineContext): GenerateOutcome {
  const path = questPath(ctx.dataRoot, date);

  // Idempotency: an existing quest is validated, never regenerated.
  if (fileExists(path)) {
    const quest = readJsonFile<Quest>(path);
    const failures = validateQuestStructure(quest).filter((c) => !c.passed);
    if (failures.length > 0) {
      throw new GenerationError(
        `Existing quest ${date} failed validation: ${failures.map((f) => f.id).join(', ')}`
      );
    }
    return { outcome: 'already-exists', quest, warnings: [], changedFile: null };
  }

  const now = ctx.now ?? new Date();
  const nowIso = now.toISOString();
  const seed = deriveSeed(date, ctx.config.generatorVersion, ctx.config.seedDomain);
  const rng = new Rng(seed);
  const recent = recentFromArchive(ctx.archive);
  const warnings: string[] = [];
  const existingFingerprints: ExistingFingerprints[] = ctx.archive.map((q) => ({
    id: q.id,
    ...fingerprintsFor(q),
  }));

  for (let attempt = 1; attempt <= ctx.config.rotation.maxDuplicateRetries; attempt++) {
    const category = selectCategory(rng, ctx.config, recent);
    const pool = templatesForCategory(ALL_TEMPLATES, category);
    if (pool.length === 0) {
      throw new GenerationError(`No templates registered for category "${category}"`);
    }
    const template = selectTemplate(rng, ctx.config, pool, recent);
    const difficulty = selectDifficulty(rng, ctx.config, template, category);

    const body = template.build({ date, difficulty, rng });

    // Machine verification of the rendered claim (snippet output, SQL result
    // set, regex samples, shell/git scenario).
    if (body.verification) {
      try {
        const outcome = runVerification(body.verification);
        if (outcome.skipped) {
          warnings.push(`${template.id}: verification skipped — ${outcome.detail}`);
        }
      } catch (error) {
        if (error instanceof VerificationError) {
          throw new GenerationError(
            `Template ${template.id} failed its verification on ${date}: ${error.message}`
          );
        }
        throw error;
      }
    }

    const quest = assembleQuest({
      date,
      template,
      difficulty,
      body,
      seedHex: seed,
      generatorVersion: ctx.config.generatorVersion,
      sequenceNumber: ctx.archive.length + 1,
      relatedQuestIds: computeRelated(category, date, ctx.archive, `dq-${date}`),
      nowIso,
    });

    const checks = validateQuestStructure(quest);
    if (body.verification) {
      checks.push({ id: `verification-${body.verification.kind}`, passed: true });
    }
    const failedChecks = checks.filter((c) => !c.passed);
    if (failedChecks.length > 0) {
      throw new GenerationError(
        `Quest ${date} (template ${template.id}) failed structural validation: ${failedChecks
          .map((c) => `${c.id}${c.detail ? ` (${c.detail})` : ''}`)
          .join('; ')}`
      );
    }
    const score = qualityScore(checks);
    if (score < ctx.config.quality.minQualityScore) {
      throw new GenerationError(
        `Quest ${date} (template ${template.id}) scored ${score}, below minimum ${ctx.config.quality.minQualityScore}`
      );
    }
    quest.validation = {
      passed: true,
      score,
      checkedAt: nowIso,
      checks: checks.map((c) => (c.passed ? c.id : `${c.id}:FAIL`)),
    };

    const duplicate = findDuplicate(draftFingerprints(quest), existingFingerprints);
    if (duplicate !== null) {
      warnings.push(`attempt ${attempt}: candidate from ${template.id} duplicates ${duplicate}; rotating`);
      continue;
    }

    if (ctx.dryRun) {
      return { outcome: 'dry-run', quest, warnings, changedFile: null };
    }

    writeJsonAtomic(path, quest);
    ctx.archive.push(quest);
    return {
      outcome: 'created',
      quest,
      warnings,
      changedFile: relative(ctx.dataRoot, path),
    };
  }

  throw new GenerationError(
    `Could not generate a unique quest for ${date} after ${ctx.config.rotation.maxDuplicateRetries} attempts`
  );
}
