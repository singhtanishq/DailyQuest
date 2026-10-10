import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

import type { VerificationSpec } from '../templates/framework.js';

/**
 * Verification runners — execute machine-checkable claims attached to
 * rendered quests.
 *
 * Everything executed here is repository-owned template content (never user
 * input), run in throwaway sandbox directories with hard timeouts. Runners
 * either prove the claim or throw a VerificationError, which aborts
 * generation before anything is written.
 */

export class VerificationError extends Error {
  constructor(
    message: string,
    readonly kind: string,
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}

export interface RunOutcome {
  ok: boolean;
  detail: string;
  /** True when the check could not run (e.g. sqlite3 missing) and was skipped. */
  skipped?: boolean;
}

// ---------------------------------------------------------------------------
// JavaScript sandbox
// ---------------------------------------------------------------------------

/**
 * Runs a JS snippet and returns its printed output (console.log lines joined
 * by newlines), or the completion value when nothing was logged. The sandbox
 * provides only console — no timers, no process, no require.
 */
export function runJsSnippet(code: string, timeoutMs = 1000): string {
  const logs: string[] = [];
  const sandbox = {
    console: {
      log: (...args: unknown[]) => {
        logs.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
      },
    },
  };
  const context = createContext(sandbox);
  let completion: unknown;
  try {
    completion = runInContext(code, context, { timeout: timeoutMs });
  } catch (error) {
    throw new VerificationError(`Snippet threw: ${(error as Error).message}`, 'javascript');
  }
  if (logs.length > 0) {
    return logs.join('\n');
  }
  return completion === undefined ? '' : String(completion);
}

// ---------------------------------------------------------------------------
// SQLite
// ---------------------------------------------------------------------------

export function sqlite3Available(): boolean {
  const result = spawnSync('sqlite3', ['--version'], { encoding: 'utf8', timeout: 5000 });
  return !result.error && result.status === 0;
}

interface SqliteJsonRow {
  [column: string]: unknown;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  return String(value);
}

/**
 * Runs fixture + query against in-memory SQLite and returns the result set
 * as normalized string rows (values stringified, NULL for null).
 */
export function runSqlite(fixture: string, query: string): { columns: string[]; rows: string[][] } {
  const input = `${fixture}\n.mode json\n.headers on\n${query}\n`;
  const result = spawnSync('sqlite3', [':memory:'], {
    input,
    encoding: 'utf8',
    timeout: 10_000,
  });
  if (result.error || (result.status !== 0 && result.stdout.trim() === '')) {
    const stderr = (result.stderr ?? '').trim().split('\n').slice(0, 3).join(' | ');
    throw new VerificationError(`SQLite failed: ${stderr || 'unknown error'}`, 'sqlite');
  }
  const stdout = result.stdout.trim();
  if (stdout === '') {
    return { columns: [], rows: [] };
  }
  let parsed: SqliteJsonRow[];
  try {
    parsed = JSON.parse(stdout) as SqliteJsonRow[];
  } catch {
    throw new VerificationError(`SQLite output was not JSON: ${stdout.slice(0, 200)}`, 'sqlite');
  }
  if (!Array.isArray(parsed)) {
    throw new VerificationError('SQLite output was not a JSON array', 'sqlite');
  }
  const columns = parsed.length > 0 ? Object.keys(parsed[0] ?? {}) : [];
  const rows = parsed.map((row) => columns.map((c) => formatCell(row[c])));
  return { columns, rows };
}

// ---------------------------------------------------------------------------
// Shell sandbox
// ---------------------------------------------------------------------------

function makeSandboxDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), `${prefix}-`));
}

/**
 * Runs bash setup + command inside a throwaway directory containing the
 * declared fixture files. Returns trimmed stdout of the command.
 */
export function runShellCommand(
  files: Record<string, string>,
  setup: string[],
  command: string,
  timeoutMs = 10_000,
): string {
  const dir = makeSandboxDir('dailyquest-shell');
  try {
    for (const [path, content] of Object.entries(files)) {
      const target = join(dir, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    if (setup.length > 0) {
      const setupResult = spawnSync('bash', ['-c', setup.join('\n')], {
        cwd: dir,
        encoding: 'utf8',
        timeout: timeoutMs,
      });
      if (setupResult.status !== 0) {
        throw new VerificationError(
          `Sandbox setup failed: ${(setupResult.stderr ?? '').slice(0, 300)}`,
          'shell',
        );
      }
    }
    const result = spawnSync('bash', ['-c', command], {
      cwd: dir,
      encoding: 'utf8',
      timeout: timeoutMs,
    });
    if (result.status !== 0) {
      throw new VerificationError(
        `Command exited with ${result.status}: ${(result.stderr ?? '').slice(0, 300)}`,
        'shell',
      );
    }
    return (result.stdout ?? '').trimEnd();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Git sandbox
// ---------------------------------------------------------------------------

const GIT_IDENTITY = {
  GIT_AUTHOR_NAME: 'DailyQuest',
  GIT_AUTHOR_EMAIL: 'dailyquest@example.com',
  GIT_COMMITTER_NAME: 'DailyQuest',
  GIT_COMMITTER_EMAIL: 'dailyquest@example.com',
};

function runGitCommand(dir: string, command: string, timeoutMs = 15_000): string {
  const result = spawnSync('bash', ['-c', command], {
    cwd: dir,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: {
      ...process.env,
      ...GIT_IDENTITY,
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
    },
  });
  if (result.status !== 0) {
    throw new VerificationError(
      `git command failed ("${command.slice(0, 80)}"): ${(result.stderr ?? '').slice(0, 300)}`,
      'git',
    );
  }
  return (result.stdout ?? '').trim();
}

/**
 * Runs a git scenario in a throwaway repository and asserts the resulting
 * state: log subjects, revision count, and file contents (trailing newline
 * insensitive).
 */
export function runGitScenario(
  setup: string[],
  expect: {
    logSubjects?: string[];
    fileContents?: Record<string, string>;
    revCount?: number;
  },
): void {
  const dir = makeSandboxDir('dailyquest-git');
  try {
    runGitCommand(dir, 'git init -q -b main');
    for (const command of setup) {
      runGitCommand(dir, command);
    }
    if (expect.revCount !== undefined) {
      const count = Number.parseInt(runGitCommand(dir, 'git rev-list --count HEAD'), 10);
      if (count !== expect.revCount) {
        throw new VerificationError(`Expected ${expect.revCount} commits, found ${count}`, 'git');
      }
    }
    if (expect.logSubjects) {
      const subjects = runGitCommand(dir, 'git log --format=%s')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (JSON.stringify(subjects) !== JSON.stringify(expect.logSubjects)) {
        throw new VerificationError(
          `Expected log subjects ${JSON.stringify(expect.logSubjects)}, found ${JSON.stringify(subjects)}`,
          'git',
        );
      }
    }
    if (expect.fileContents) {
      for (const [path, expected] of Object.entries(expect.fileContents)) {
        let actual: string;
        try {
          actual = readFileSync(join(dir, path), 'utf8').trimEnd();
        } catch {
          throw new VerificationError(`Expected file ${path} to exist after scenario`, 'git');
        }
        if (actual !== expected.trimEnd()) {
          throw new VerificationError(
            `File ${path} content mismatch: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`,
            'git',
          );
        }
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function runVerification(spec: VerificationSpec): RunOutcome {
  switch (spec.kind) {
    case 'javascript': {
      const actual = runJsSnippet(spec.code);
      const expected = spec.expectedOutput.trimEnd();
      if (actual.trimEnd() !== expected) {
        throw new VerificationError(
          `Snippet printed ${JSON.stringify(actual)} but quest claims ${JSON.stringify(expected)}`,
          'javascript',
        );
      }
      return { ok: true, detail: 'snippet output matches' };
    }
    case 'regex': {
      let re: RegExp;
      try {
        re = new RegExp(spec.pattern, spec.flags);
      } catch (error) {
        throw new VerificationError(`Invalid regex: ${(error as Error).message}`, 'regex');
      }
      for (const sample of spec.samples) {
        const matches = re.test(sample.text);
        if (matches !== sample.matches) {
          throw new VerificationError(
            `Pattern /${spec.pattern}/${spec.flags} ${matches ? 'matches' : 'does not match'} ${JSON.stringify(
              sample.text,
            )} but the quest claims otherwise`,
            'regex',
          );
        }
      }
      return { ok: true, detail: `${spec.samples.length} samples verified` };
    }
    case 'sqlite': {
      if (!sqlite3Available()) {
        return {
          ok: true,
          detail: 'sqlite3 not available — skipped (expected rows used as authored)',
          skipped: true,
        };
      }
      const result = runSqlite(spec.fixture, spec.query);
      const actualRows = result.rows.map((r) => r.join(' | '));
      const expectedRows = spec.expectedRows.map((r) => r.join(' | '));
      if (JSON.stringify(actualRows) !== JSON.stringify(expectedRows)) {
        throw new VerificationError(
          `SQLite result mismatch.\nExpected: ${JSON.stringify(expectedRows)}\nActual:   ${JSON.stringify(actualRows)}`,
          'sqlite',
        );
      }
      return { ok: true, detail: 'result set matches SQLite' };
    }
    case 'shell': {
      const actual = runShellCommand(spec.files ?? {}, spec.setup ?? [], spec.command);
      if (actual !== spec.expectedOutput.trimEnd()) {
        throw new VerificationError(
          `Command printed ${JSON.stringify(actual)} but quest claims ${JSON.stringify(spec.expectedOutput)}`,
          'shell',
        );
      }
      return { ok: true, detail: 'command output matches' };
    }
    case 'git': {
      runGitScenario(spec.setup, spec.expect);
      return { ok: true, detail: 'git scenario state matches' };
    }
  }
}
