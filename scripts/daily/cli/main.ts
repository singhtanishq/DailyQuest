#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { isIsoDate } from '../core/dates.js';
import { addDays, datesBetweenExclusive } from '../core/dates.js';
import {
  GenerationError,
  generateQuestForDate,
  type PipelineContext,
} from '../pipeline/generate.js';
import { publishDaily, type PublishSummary } from '../pipeline/publish.js';
import { loadArchive } from '../pipeline/context.js';
import { rebuildDerived } from '../storage/rebuild.js';
import { validateRepository } from '../validators/repository.js';
import { loadConfig } from '../../../config/dailyquest.config.js';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const DATA_ROOT = resolve(ROOT, 'data');

const HELP = `DailyQuest quest pipeline

Usage:
  npm run quest -- <command> [options]

Commands:
  daily                        Generate today's quest (with catch-up policy).
      --date=YYYY-MM-DD        Override the publication date.
      --dry-run                Validate and preview without writing files.
      --scheduled              Mark the run as scheduled (respects publishingEnabled).
      --ci                     Emit GitHub Actions outputs and a step summary.
  date <YYYY-MM-DD>            Generate one specific date if missing.
  backfill <start> <end>       Generate every missing date in an inclusive range.
  validate                     Validate the whole archive; non-zero exit on errors.
  rebuild                      Rebuild index, stats, categories, latest and health.

Options:
  --dry-run                    Preview only (validates with the daily command).
  -h, --help                   Show this help.

Examples:
  npm run generate:daily
  npm run generate:daily -- --dry-run
  npm run generate:date -- 2026-10-07
  npm run generate:backfill -- 2026-10-01 2026-10-07
`;

function die(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function writeCiOutputs(summary: PublishSummary): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  // Real publications and dry-run previews both carry quest metadata; only
  // `outcome` and `changed` distinguish a real publication from a preview.
  const created = summary.entries.find((e) => e.outcome === 'created');
  const candidate = created ?? summary.entries.find((e) => e.outcome === 'dry-run');
  // A dry run must never signal "changed": push and deployment gating rely on
  // this output to distinguish a real publication from a preview or a no-op.
  const dryRun = summary.entries.some((e) => e.outcome === 'dry-run');
  const changed =
    !dryRun && !(summary.noOp && summary.derivedChanged.length === 0 && !summary.readmeChanged);
  if (outputPath) {
    // Entries are generated in ascending date order; the newest date is the
    // one the push-safety check must compare against.
    const newest = [...summary.entries].reverse().find((e) => e.date.length > 0);
    const lines = [
      `publication_date=${newest?.date ?? summary.today ?? ''}`,
      `outcome=${dryRun ? 'dry-run' : created ? 'created' : summary.noOp ? 'no-op' : 'updated'}`,
      `quest_number=${candidate?.sequenceNumber ?? ''}`,
      `quest_title=${candidate?.title ?? ''}`,
      `quest_slug=${candidate?.questId?.replace('dq-', '') ?? ''}`,
      `changed=${changed ? 'true' : 'false'}`,
      '',
    ];
    appendFileSync(outputPath, lines.join('\n'));
  }
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const lines = ['## DailyQuest Publishing Report', ''];
    if (summary.noOp) {
      lines.push('Status: **NO-OP** — the archive is already up to date.', '');
    } else {
      for (const entry of summary.entries) {
        lines.push(
          `- **${entry.date}** — ${entry.outcome === 'created' ? `Quest #${entry.sequenceNumber}` : 'already published'}: ${entry.title ?? '—'}`,
        );
        if (entry.category) {
          lines.push(
            `  - Category: \`${entry.category}\` · Difficulty: \`${entry.difficulty}\` · Quality: ${entry.qualityScore ?? '—'}/100`,
          );
        }
      }
      lines.push('');
      lines.push(
        `Derived files updated: ${summary.derivedChanged.length} · README: ${summary.readmeChanged ? 'updated' : 'unchanged'}`,
      );
    }
    if (summary.warnings.length > 0) {
      lines.push('', '**Warnings**', '');
      for (const warning of summary.warnings) {
        lines.push(`- ⚠️ ${warning}`);
      }
    }
    lines.push('');
    appendFileSync(summaryPath, lines.join('\n'));
  }
}

function printPublishSummary(summary: PublishSummary, dryRun: boolean): void {
  if (summary.noOp) {
    console.log('✓ Archive already up to date — nothing to do.');
  }
  for (const entry of summary.entries) {
    if (entry.outcome === 'already-exists') {
      console.log(`• ${entry.date}: already published (${entry.title ?? entry.questId})`);
      continue;
    }
    const label = dryRun
      ? 'DRY RUN'
      : `Quest #${String(entry.sequenceNumber ?? 0).padStart(3, '0')}`;
    console.log(`✓ ${entry.date}: ${label} — ${entry.title}`);
    console.log(
      `  ${entry.category} · ${entry.difficulty} · template ${entry.templateId} · quality ${entry.qualityScore}/100`,
    );
  }
  if (summary.readmeChanged) {
    console.log('✓ README status block updated');
  }
  if (summary.derivedChanged.length > 0) {
    console.log(`✓ Derived files updated (${summary.derivedChanged.length})`);
  }
  for (const warning of summary.warnings) {
    console.warn(`⚠ ${warning}`);
  }
}

function makeContext(dryRun: boolean): PipelineContext {
  return {
    dataRoot: DATA_ROOT,
    config: loadConfig(),
    archive: loadArchive(DATA_ROOT),
    dryRun,
    now: new Date(),
  };
}

function runBackfill(start: string, end: string, dryRun: boolean): void {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    die('backfill requires two ISO dates: backfill <start> <end>');
  }
  if (start > end) {
    die('backfill start date must be on or before the end date');
  }
  const ctx = makeContext(dryRun);
  const dates = datesBetweenExclusive(addDays(start, -1), end);
  let created = 0;
  for (const date of dates) {
    const result = generateQuestForDate(date, ctx);
    if (result.outcome === 'created') {
      created++;
      console.log(`✓ ${date}: generated — ${result.quest?.title} (${result.quest?.templateId})`);
    } else {
      console.log(`• ${date}: already exists`);
    }
    for (const warning of result.warnings) {
      console.warn(`⚠ ${date}: ${warning}`);
    }
  }
  if (!dryRun) {
    const rebuild = rebuildDerived(DATA_ROOT);
    console.log(
      `✓ Derived files rebuilt (${rebuild.changedFiles.length} changed, ${rebuild.questCount} quests)`,
    );
  }
  console.log(created === 0 ? 'Nothing to backfill.' : `Backfilled ${created} quest(s).`);
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    console.log(HELP);
    return;
  }

  const [command, ...rest] = argv;
  try {
    switch (command) {
      case 'daily': {
        const { values } = parseArgs({
          args: rest,
          options: {
            date: { type: 'string' },
            'dry-run': { type: 'boolean', default: false },
            scheduled: { type: 'boolean', default: false },
            ci: { type: 'boolean', default: false },
          },
          strict: true,
        });
        if (values.date && !isIsoDate(values.date)) {
          die(`--date must be an ISO date (YYYY-MM-DD), got "${values.date}"`);
        }
        const summary = publishDaily({
          dataRoot: DATA_ROOT,
          repoRoot: ROOT,
          dateOverride: values.date,
          dryRun: values['dry-run'],
          scheduled: values.scheduled,
        });
        printPublishSummary(summary, values['dry-run'] ?? false);
        if (values.ci) {
          writeCiOutputs(summary);
        }
        break;
      }
      case 'date': {
        const target = rest.find((a) => !a.startsWith('--'));
        if (!target || !isIsoDate(target)) {
          die('date requires a valid ISO date: date <YYYY-MM-DD>');
        }
        const dryRun = rest.includes('--dry-run');
        const ctx = makeContext(dryRun);
        const result = generateQuestForDate(target, ctx);
        if (result.outcome === 'already-exists') {
          console.log(`• ${target}: already exists — ${result.quest?.title}`);
        } else {
          console.log(
            `✓ ${target}: ${dryRun ? 'DRY RUN' : 'generated'} — ${result.quest?.title} (${result.quest?.templateId})`,
          );
        }
        for (const warning of result.warnings) {
          console.warn(`⚠ ${warning}`);
        }
        if (!dryRun) {
          const rebuild = rebuildDerived(DATA_ROOT);
          console.log(`✓ Derived files rebuilt (${rebuild.changedFiles.length} changed)`);
        }
        break;
      }
      case 'backfill': {
        const positional = rest.filter((a) => !a.startsWith('--'));
        if (positional.length < 2) {
          die('backfill requires two ISO dates: backfill <start> <end>');
        }
        runBackfill(positional[0] ?? '', positional[1] ?? '', rest.includes('--dry-run'));
        break;
      }
      case 'validate': {
        const report = validateRepository(DATA_ROOT);
        console.log(`Archive: ${report.questCount} quest(s)`);
        for (const warning of report.warnings) {
          console.warn(`⚠ ${warning}`);
        }
        if (report.errors.length > 0) {
          for (const error of report.errors) {
            console.error(`✗ ${error}`);
          }
          die(`${report.errors.length} validation error(s)`);
        }
        console.log('✓ All data valid');
        break;
      }
      case 'rebuild': {
        const rebuild = rebuildDerived(DATA_ROOT);
        console.log(
          `✓ Rebuilt derived files for ${rebuild.questCount} quest(s); ${rebuild.changedFiles.length} file(s) changed, ${rebuild.resequenced} resequenced`,
        );
        break;
      }
      default:
        die(`Unknown command "${String(command)}".\n\n${HELP}`);
    }
  } catch (error) {
    if (error instanceof GenerationError) {
      die(error.message);
    }
    die((error as Error).stack ?? String(error));
  }
}

main();
