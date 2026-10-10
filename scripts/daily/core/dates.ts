/**
 * Date handling for DailyQuest.
 *
 * Publication dates are plain ISO YYYY-MM-DD strings interpreted in UTC.
 * "Today" is resolved through the configured publication timezone via Intl —
 * never through the host machine's local timezone — so a run at 23:30 IST and
 * a run at 00:30 IST agree on which quest belongs to which date.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MILLIS_PER_DAY = 86_400_000;

/** Current calendar date in the given IANA timezone, as YYYY-MM-DD. */
export function getTodayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const parts = value.split('-').map((part) => Number.parseInt(part, 10));
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  return (
    asUtc.getUTCFullYear() === year &&
    asUtc.getUTCMonth() === month - 1 &&
    asUtc.getUTCDate() === day
  );
}

export function assertIsoDate(value: string, label = 'date'): string {
  if (!isIsoDate(value)) {
    throw new Error(`${label} must be a valid ISO date (YYYY-MM-DD), got "${value}"`);
  }
  return value;
}

function toUtcMillis(date: string): number {
  const parts = date.split('-').map((part) => Number.parseInt(part, 10));
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid ISO date: "${date}"`);
  }
  return Date.UTC(year, month - 1, day);
}

function fromUtcMillis(millis: number): string {
  return new Date(millis).toISOString().slice(0, 10);
}

/** Date `days` after (or before, when negative) the given date. */
export function addDays(date: string, days: number): string {
  assertIsoDate(date);
  return fromUtcMillis(toUtcMillis(date) + days * MILLIS_PER_DAY);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffInDays(from: string, to: string): number {
  assertIsoDate(from);
  assertIsoDate(to);
  return Math.round((toUtcMillis(to) - toUtcMillis(from)) / MILLIS_PER_DAY);
}

/**
 * All dates in the interval (afterDate, throughDate] in ascending order.
 * Returns an empty list when throughDate <= afterDate.
 */
export function datesBetweenExclusive(afterDate: string, throughDate: string): string[] {
  const start = diffInDays(afterDate, throughDate);
  if (start <= 0) {
    return [];
  }
  const result: string[] = [];
  for (let i = 1; i <= start; i++) {
    result.push(addDays(afterDate, i));
  }
  return result;
}

/** "2026-10-07" -> "October 7, 2026" */
export function formatDisplayDate(date: string): string {
  assertIsoDate(date);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "2026-10-07" -> "Oct 7, 2026" */
export function formatShortDate(date: string): string {
  assertIsoDate(date);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}
