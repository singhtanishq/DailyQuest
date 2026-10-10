import type { QuestIndexEntry } from '../../shared/types.js';

/** "2026-10-07" → "October 7, 2026" (UTC-safe). */
export function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "2026-10-07" → "Oct 7, 2026" */
export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function padQuestNumber(n: number): string {
  return String(n).padStart(3, '0');
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Latest index entry's date, compared against the entry's own date. */
export function isToday(entry: QuestIndexEntry, latestDate: string | undefined): boolean {
  return latestDate !== undefined && entry.date === latestDate;
}

export function totalHours(totalMinutes: number): string {
  const hours = totalMinutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h` : `${Math.round(hours * 10) / 10}h`;
}
