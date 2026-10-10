import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CLI end-to-end tests: prove the exact commands the daily workflow relies on
 * behave correctly — including that a --dry-run emits CI outputs (so the
 * workflow can gate push/deploy) while writing nothing.
 */

const repoRoot = resolve(import.meta.dirname, '..');
const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx');

function runCli(args: string[], env: Record<string, string> = {}): ReturnType<typeof spawnSync> {
  return spawnSync(tsxBin, ['scripts/daily/cli/main.ts', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 180_000,
    env: { ...process.env, ...env },
  });
}

describe('dailyquest CLI', () => {
  it(
    'keeps the help invocation help-only (no generation side effects)',
    () => {
      const result = runCli(['--help']);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('daily');
    },
    60_000
  );

  it(
    'rejects an invalid --date before touching anything',
    () => {
      const result = runCli(['daily', '--date=not-a-date', '--dry-run']);
      expect(result.status).not.toBe(0);
      expect(`${result.stderr}${result.stdout}`).toContain('ISO date');
    },
    60_000
  );

  it(
    'runs a fixed-date dry run with CI outputs and writes nothing',
    () => {
      const outputPath = join(
        mkdtempSync(join(tmpdir(), 'dailyquest-ci-')),
        'github-output.txt'
      );
      const result = runCli(['daily', '--date=2099-01-01', '--dry-run', '--ci'], {
        GITHUB_OUTPUT: outputPath,
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('DRY RUN');

      const outputs = readFileSync(outputPath, 'utf8');
      expect(outputs).toContain('publication_date=2099-01-01');
      expect(outputs).toMatch(/outcome=dry-run/);
      expect(outputs).toMatch(/quest_number=\d+/);
      expect(outputs).toContain('quest_title=');
      // The defining property: a dry run must never signal a publication.
      expect(outputs).toContain('changed=false');

      // Nothing may be written to the production archive or reports.
      expect(existsSync(join(repoRoot, 'data', 'quests', '2099'))).toBe(false);
      expect(existsSync(join(repoRoot, 'reports', 'daily', '2099-01-01.json'))).toBe(false);
    },
    240_000
  );

  it(
    'rejects an unknown command with the help text',
    () => {
      const result = runCli(['definitely-not-a-command']);
      expect(result.status).not.toBe(0);
      expect(`${result.stderr}${result.stdout}`).toContain('Usage:');
    },
    60_000
  );
});
