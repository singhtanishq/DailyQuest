import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { cleanupTempRoot, makeTempRoot, testConfig } from './helpers.js';
import { generateQuestForDate } from '../scripts/daily/pipeline/generate.js';
import { publishDaily } from '../scripts/daily/pipeline/publish.js';
import { rebuildDerived } from '../scripts/daily/storage/rebuild.js';
import { validateRepository } from '../scripts/daily/validators/repository.js';
import {
  runJsSnippet,
  runVerification,
  VerificationError,
} from '../scripts/daily/verify/runners.js';

const FIXED_NOW = new Date('2026-10-10T12:00:00.000Z');

function makeCtx(dataRoot: string) {
  return {
    dataRoot,
    config: testConfig(),
    archive: [],
    now: FIXED_NOW,
    dryRun: false,
  };
}

function stripVolatile(text: string): string {
  return text.replace(/"generatedAt": "[^"]*"/g, '"generatedAt": "-"');
}

describe('integration: generation pipeline', () => {
  it('is deterministic: two independent roots produce identical quests', () => {
    const rootA = makeTempRoot();
    const rootB = makeTempRoot();
    try {
      const ctxA = makeCtx(rootA);
      const ctxB = makeCtx(rootB);
      const a = generateQuestForDate('2026-01-15', ctxA);
      const b = generateQuestForDate('2026-01-15', ctxB);
      expect(a.outcome).toBe('created');
      expect(b.outcome).toBe('created');
      expect(JSON.stringify(a.quest)).toBe(JSON.stringify(b.quest));

      // Derived files match apart from generation timestamps.
      rebuildDerived(rootA);
      rebuildDerived(rootB);
      for (const name of ['index.json', 'stats.json', 'categories.json']) {
        const fileA = readFileSync(join(rootA, name), 'utf8');
        const fileB = readFileSync(join(rootB, name), 'utf8');
        expect(stripVolatile(fileA)).toBe(stripVolatile(fileB));
      }
    } finally {
      cleanupTempRoot(rootA);
      cleanupTempRoot(rootB);
    }
  });

  it('is idempotent: regenerating an existing date changes nothing', () => {
    const root = makeTempRoot();
    try {
      const ctx = makeCtx(root);
      generateQuestForDate('2026-01-15', ctx);
      const before = readFileSync(join(root, 'quests', '2026', '01', '2026-01-15.json'), 'utf8');

      const second = generateQuestForDate('2026-01-15', ctx);
      expect(second.outcome).toBe('already-exists');

      const after = readFileSync(join(root, 'quests', '2026', '01', '2026-01-15.json'), 'utf8');
      expect(after).toBe(before);
    } finally {
      cleanupTempRoot(root);
    }
  });

  it('publishes with catch-up and reaches a fully consistent state', () => {
    const root = makeTempRoot();
    try {
      // First run: a single quest is created for the target date.
      const first = publishDaily({
        dataRoot: root,
        repoRoot: root, // no README here; the update is a no-op
        dateOverride: '2026-10-03',
        now: FIXED_NOW,
      });
      expect(first.entries).toHaveLength(1);
      expect(first.entries[0]?.outcome).toBe('created');
      expect(first.noOp).toBe(false);

      // Re-running for the same date is a no-op.
      const second = publishDaily({
        dataRoot: root,
        repoRoot: root,
        dateOverride: '2026-10-03',
        now: FIXED_NOW,
      });
      expect(second.noOp).toBe(true);

      // Two days later: the missing date is caught up, then today is created.
      const third = publishDaily({
        dataRoot: root,
        repoRoot: root,
        dateOverride: '2026-10-05',
        now: FIXED_NOW,
      });
      expect(third.entries.map((e) => e.date)).toEqual(['2026-10-04', '2026-10-05']);
      expect(third.entries.every((e) => e.outcome === 'created')).toBe(true);

      // Whole-archive validation passes.
      const report = validateRepository(root);
      expect(report.errors).toEqual([]);
      expect(report.questCount).toBe(3);

      // Sequences follow date order.
      const index = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8')) as {
        quests: Array<{ sequenceNumber: number }>;
      };
      expect(index.quests.map((q) => q.sequenceNumber)).toEqual([1, 2, 3]);

      // A second rebuild changes nothing.
      const rebuild = rebuildDerived(root);
      expect(rebuild.changedFiles).toEqual([]);
    } finally {
      cleanupTempRoot(root);
    }
  });

  it('verification genuinely executes: wrong claims abort, right claims pass', () => {
    expect(runJsSnippet("console.log('5' - 3)")).toBe('2');

    const wrong = {
      kind: 'javascript' as const,
      code: "console.log('5' + 3)",
      expectedOutput: '8',
    };
    expect(() => runVerification(wrong)).toThrow(VerificationError);

    const right = {
      kind: 'javascript' as const,
      code: "console.log('5' + 3)",
      expectedOutput: '53',
    };
    expect(runVerification(right).ok).toBe(true);
  });
});
