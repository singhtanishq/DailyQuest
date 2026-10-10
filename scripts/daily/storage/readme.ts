import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BEGIN_MARKER = '<!-- DAILYQUEST:STATUS:BEGIN -->';
const END_MARKER = '<!-- DAILYQUEST:STATUS:END -->';

/** Resolves the public site URL for links inside the README status block. */
export function resolveSiteUrl(repoRoot: string): string {
  const env = process.env.DAILYQUEST_SITE_URL;
  if (env) {
    return env.replace(/\/$/, '');
  }
  try {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
      repository?: { url?: string } | string;
    };
    const url = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    const match = /github\.com[/:]([^/]+)\/([^/.]+)/.exec(url ?? '');
    if (match && match[1] && match[2]) {
      return `https://${match[1]}.github.io/${match[2]}`;
    }
  } catch {
    // fall through to default
  }
  return 'https://singhtanishq.github.io/DailyQuest';
}

export interface StatusBlockEntry {
  sequenceNumber: number;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  date: string;
}

export function renderStatusBlock(
  entry: StatusBlockEntry,
  displayDate: string,
  siteUrl: string,
): string {
  return [
    BEGIN_MARKER,
    `> **Today’s quest:** [#${String(entry.sequenceNumber).padStart(3, '0')} — ${entry.title}](${siteUrl}/quest/${entry.slug})`,
    `> ${displayDate} · \`${entry.category}\` · \`${entry.difficulty}\` · ${entry.estimatedMinutes} min`,
    END_MARKER,
  ].join('\n');
}

/**
 * Replaces only the delimited status section in README.md. Everything else
 * in the file is untouched — the daily commit never rewrites prose.
 */
export function updateReadmeStatus(repoRoot: string, block: string): boolean {
  const path = join(repoRoot, 'README.md');
  let content: string;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    return false;
  }
  const beginIndex = content.indexOf(BEGIN_MARKER);
  const endIndex = content.indexOf(END_MARKER);
  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    return false;
  }
  const next = `${content.slice(0, beginIndex)}${block}${content.slice(endIndex + END_MARKER.length)}`;
  if (next === content) {
    return false;
  }
  writeFileSync(path, next, 'utf8');
  return true;
}
