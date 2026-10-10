import { describe, expect } from 'vitest';
import { test } from './helpers.js';
import { addDays, datesBetweenExclusive, diffInDays, formatDisplayDate, formatShortDate, getTodayInTz, isIsoDate } from '../scripts/daily/core/dates.js';

describe('dates', () => {
  test('isIsoDate accepts real dates and rejects the rest', () => {
    expect(isIsoDate('2026-10-07')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-10-7')).toBe(false);
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate('2026-10-07T00:00:00Z')).toBe(false);
  });

  test('addDays crosses month and year boundaries correctly', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-10-07', 0)).toBe('2026-10-07');
  });

  test('diffInDays is sign-aware', () => {
    expect(diffInDays('2026-10-01', '2026-10-10')).toBe(9);
    expect(diffInDays('2026-10-10', '2026-10-01')).toBe(-9);
    expect(diffInDays('2026-10-10', '2026-10-10')).toBe(0);
  });

  test('datesBetweenExclusive is (start, end]', () => {
    expect(datesBetweenExclusive('2026-09-30', '2026-10-03')).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
    expect(datesBetweenExclusive('2026-10-03', '2026-10-03')).toEqual([]);
    expect(datesBetweenExclusive('2026-10-05', '2026-10-03')).toEqual([]);
  });

  test('getTodayInTz resolves the calendar date per zone, not the host zone', () => {
    // 2026-01-01 00:30 Asia/Kolkata is still 2025-12-31 in UTC.
    const instant = Date.UTC(2025, 11, 31, 19, 0, 0);
    const originalNow = Date.now;
    Date.now = () => instant;
    try {
      expect(getTodayInTz('Asia/Kolkata')).toBe('2026-01-01');
      expect(getTodayInTz('UTC')).toBe('2025-12-31');
      expect(getTodayInTz('America/Los_Angeles')).toBe('2025-12-31');
    } finally {
      Date.now = originalNow;
    }
  });

  test('display formatting is stable and human readable', () => {
    expect(formatDisplayDate('2026-10-07')).toBe('October 7, 2026');
    expect(formatShortDate('2026-10-07')).toBe('Oct 7, 2026');
    expect(formatDisplayDate('2027-01-01')).toBe('January 1, 2027');
  });
});
