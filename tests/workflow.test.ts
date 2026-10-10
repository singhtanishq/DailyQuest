import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Workflow regression tests.
 *
 * These read the workflow YAML as text on purpose: they encode deployment
 * invariants that must hold no matter how the files are edited, most
 * importantly that the daily pipeline invokes the REAL generation command
 * (a help-only `npm run quest` invocation would silently publish nothing).
 */

const repoRoot = resolve(import.meta.dirname, '..');
const daily = readFileSync(resolve(repoRoot, '.github/workflows/daily-quest.yml'), 'utf8');
const deploy = readFileSync(resolve(repoRoot, '.github/workflows/deploy.yml'), 'utf8');
const ci = readFileSync(resolve(repoRoot, '.github/workflows/ci.yml'), 'utf8');
const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

describe('daily workflow: generation command', () => {
  it('invokes the real generation script, never the help-only quest alias', () => {
    expect(daily).toContain('npm run generate:daily');
    expect(daily).not.toMatch(/npm run quest\b/);
  });

  it('keeps `quest` as the help command and `generate:daily` as the generator', () => {
    expect(pkg.scripts.quest).toContain('--help');
    expect(pkg.scripts['generate:daily']).toMatch(/cli\/main\.ts daily$/);
  });

  it('passes --scheduled on schedule events so publishingEnabled is respected', () => {
    expect(daily).toContain('DAILYQUEST_SCHEDULED');
    expect(daily).toContain('ARGS="$ARGS --scheduled"');
  });
});

describe('daily workflow: inputs and schedule', () => {
  it('keeps the 00:17 Asia/Kolkata schedule', () => {
    expect(daily).toContain("cron: '17 0 * * *'");
    expect(daily).toContain("timezone: 'Asia/Kolkata'");
  });

  it('passes workflow inputs through env and validates the date', () => {
    expect(daily).toContain('DAILYQUEST_TARGET_DATE: ${{ inputs.target_date }}');
    expect(daily).toContain('DAILYQUEST_DRY_RUN: ${{ inputs.dry_run }}');
    expect(daily).toContain('must be an ISO date (YYYY-MM-DD)');
  });

  it('never interpolates inputs directly inside the generation run block', () => {
    const generateStep = daily.split('- name: Generate quest')[1]?.split('\n      - name:')[0] ?? '';
    expect(generateStep).toContain('npm run generate:daily');
    expect(generateStep).not.toContain('${{ inputs');
    expect(generateStep).not.toContain('${{ secrets');
  });

  it('supports workflow_dispatch with target_date and dry_run', () => {
    expect(daily).toContain('workflow_dispatch:');
    expect(daily).toContain('target_date:');
    expect(daily).toContain('dry_run:');
  });
});

describe('pages artifact and deployment gating', () => {
  it('uploads dist/ (never the repository root) in both deploy paths', () => {
    expect(daily).toMatch(/path: dist\s*$/m);
    expect(deploy).toMatch(/path: dist\s*$/m);
    expect(daily).not.toMatch(/path: \.\s*$/m);
    expect(deploy).not.toMatch(/path: \.\s*$/m);
  });

  it('gates deployment on a real publication (changed == true)', () => {
    expect(daily).toContain("needs.publish.outputs.changed == 'true'");
    expect(daily).toMatch(/if: \$\{\{ !inputs\.dry_run && steps\.publish\.outputs\.changed == 'true' \}\}/);
  });

  it('shares the github-pages concurrency group between both deploy paths', () => {
    expect(daily).toContain('group: github-pages');
    expect(deploy).toContain('group: github-pages');
  });

  it('configures pages inside the deploy job, not the publishing job', () => {
    const deployJob = daily.split('  deploy:')[1] ?? '';
    expect(deployJob).toContain('actions/configure-pages@v5');
    expect(deployJob).toContain('actions/deploy-pages@v4');
    const publishJob = daily.split('  publish:')[1]?.split('\n  deploy:')[0] ?? '';
    expect(publishJob).not.toContain('configure-pages');
  });
});

describe('attribution and push safety', () => {
  it('configures the human git identity from secrets before committing', () => {
    expect(daily).toContain('git config user.name');
    expect(daily).toContain('git config user.email');
    expect(daily).toContain('DAILYQUEST_COMMIT_NAME');
    expect(daily).toContain('DAILYQUEST_COMMIT_EMAIL');
  });

  it('rejects bot identities and never force-pushes', () => {
    expect(daily).toContain('github-actions[bot]');
    expect(daily).toContain('noreply@github.com');
    expect(daily).not.toMatch(/push\s+.*--force/);
    expect(daily).not.toMatch(/git push -f\b/);
  });

  it('pushes with the account token via checkout, not a URL-embedded credential', () => {
    expect(daily).toContain('token: ${{ secrets.DAILYQUEST_PUSH_TOKEN }}');
    expect(daily).not.toMatch(/https:\/\/[^@ ]*@[^\s"]*/);
  });
});

describe('ci workflow', () => {
  it('runs the full verification chain without committing', () => {
    for (const step of ['npm run lint', 'npm run typecheck', 'npm test', 'npm run validate', 'npm run build']) {
      expect(ci).toContain(step);
    }
    expect(ci).toContain('contents: read');
    expect(ci).not.toContain('git commit');
    expect(ci).not.toContain('git push');
  });
});
