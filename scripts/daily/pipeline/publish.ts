import type { DailyReport } from '../../../shared/types.js';
import { formatDisplayDate, getTodayInTz } from '../core/dates.js';
import { loadConfig } from '../../../config/dailyquest.config.js';
import { reportPath } from '../storage/paths.js';
import { writeJsonAtomic } from '../storage/io.js';
import { rebuildDerived } from '../storage/rebuild.js';
import { resolveSiteUrl, renderStatusBlock, updateReadmeStatus } from '../storage/readme.js';
import { loadArchive } from './context.js';
import { generateQuestForDate, type PipelineContext } from './generate.js';
import { planCatchUp } from './catchup.js';

export interface PublishEntry {
  date: string;
  outcome: string;
  questId: string | null;
  sequenceNumber: number | null;
  title: string | null;
  category: string | null;
  difficulty: string | null;
  templateId: string | null;
  qualityScore: number | null;
  warnings: string[];
}

export interface PublishSummary {
  today: string;
  noOp: boolean;
  entries: PublishEntry[];
  derivedChanged: string[];
  readmeChanged: boolean;
  warnings: string[];
}

/**
 * The daily publishing pipeline:
 *   resolve today → plan catch-up → generate each missing date →
 *   rebuild all derived files → update the README status block → reports.
 *
 * Dry-run mode performs everything except writing files and reports.
 */
export function publishDaily(opts: {
  dataRoot: string;
  repoRoot: string;
  dateOverride?: string;
  dryRun?: boolean;
  scheduled?: boolean;
  /** Injectable clock (tests); defaults to wall-clock time. */
  now?: Date;
}): PublishSummary {
  const config = loadConfig();
  const dryRun = opts.dryRun ?? false;
  const warnings: string[] = [];

  if (opts.scheduled && !config.publishingEnabled) {
    return {
      today: opts.dateOverride ?? '',
      noOp: true,
      entries: [],
      derivedChanged: [],
      readmeChanged: false,
      warnings: ['publishingEnabled is false in config — scheduled run skipped'],
    };
  }

  const today = opts.dateOverride ?? getTodayInTz(config.publicationTimezone);
  const archive = loadArchive(opts.dataRoot);
  const lastPublished = archive.length > 0 ? (archive[archive.length - 1]?.date ?? null) : null;
  const plan = planCatchUp(lastPublished, today, config.maxCatchupDays);
  if (plan.warning) {
    warnings.push(plan.warning);
  }

  const now = opts.now ?? new Date();
  const ctx: PipelineContext = {
    dataRoot: opts.dataRoot,
    config,
    archive,
    dryRun,
    now,
  };

  const entries: PublishEntry[] = [];
  let lastCreated: { date: string; questId: string } | null = null;

  for (const date of plan.dates) {
    const result = generateQuestForDate(date, ctx);
    for (const warning of result.warnings) {
      warnings.push(`${date}: ${warning}`);
    }
    entries.push({
      date,
      outcome: result.outcome,
      questId: result.quest?.id ?? null,
      sequenceNumber: result.quest?.sequenceNumber ?? null,
      title: result.quest?.title ?? null,
      category: result.quest?.category ?? null,
      difficulty: result.quest?.difficulty ?? null,
      templateId: result.quest?.templateId ?? null,
      qualityScore: result.quest?.validation.score ?? null,
      warnings: result.warnings,
    });
    if (result.outcome === 'created' && result.quest) {
      lastCreated = { date: result.quest.date, questId: result.quest.id };
    }
  }

  if (dryRun) {
    return {
      today,
      noOp: entries.length === 0,
      entries,
      derivedChanged: [],
      readmeChanged: false,
      warnings,
    };
  }

  const rebuild = rebuildDerived(opts.dataRoot, {
    lastGeneration: lastCreated ? { ...lastCreated, at: now.toISOString() } : null,
  });

  let readmeChanged = false;
  if (archive.length > 0) {
    const latest = archive[archive.length - 1];
    if (latest) {
      readmeChanged = updateReadmeStatus(
        opts.repoRoot,
        renderStatusBlock(
          {
            sequenceNumber: latest.sequenceNumber,
            title: latest.title,
            slug: latest.slug,
            category: latest.category,
            difficulty: latest.difficulty,
            estimatedMinutes: latest.estimatedMinutes,
            date: latest.date,
          },
          formatDisplayDate(latest.date),
          resolveSiteUrl(opts.repoRoot),
        ),
      );
    }
  }

  for (const entry of entries) {
    if (entry.questId && entry.outcome === 'created') {
      const report: DailyReport = {
        schemaVersion: 1,
        date: entry.date,
        generatedAt: now.toISOString(),
        generatorVersion: config.generatorVersion,
        outcome: 'created',
        questId: entry.questId,
        sequenceNumber: entry.sequenceNumber,
        title: entry.title,
        category: entry.category,
        difficulty: entry.difficulty,
        templateId: entry.templateId,
        validationScore: entry.qualityScore,
        changedDerivedFiles: rebuild.changedFiles,
        warnings: entry.warnings,
        durationMs: 0,
      };
      writeJsonAtomic(reportPath(opts.dataRoot, entry.date), report);
    }
  }

  return {
    today,
    noOp: entries.every((e) => e.outcome === 'already-exists') && rebuild.changedFiles.length === 0,
    entries,
    derivedChanged: rebuild.changedFiles,
    readmeChanged,
    warnings,
  };
}
