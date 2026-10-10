import { addDays, datesBetweenExclusive } from '../core/dates.js';

export interface CatchUpPlan {
  dates: string[];
  warning?: string;
}

/**
 * Catch-up policy: backfill up to `maxCatchupDays` of missed days; beyond
 * that, generate only today and record the gap (manual backfill recovers it).
 */
export function planCatchUp(
  lastPublished: string | null,
  today: string,
  maxCatchupDays: number
): CatchUpPlan {
  if (lastPublished === null) {
    return { dates: [today] };
  }
  const missing = datesBetweenExclusive(lastPublished, today);
  if (missing.length === 0) {
    return { dates: [] };
  }
  if (missing.length > maxCatchupDays) {
    return {
      dates: [today],
      warning: `${missing.length} days were missed (last published ${lastPublished}), exceeding the catch-up limit of ${maxCatchupDays}. Generated only ${today}; run \`npm run generate:backfill -- ${addDays(
        today,
        -missing.length
      )} ${addDays(today, -1)}\` to recover the gap.`,
    };
  }
  return { dates: missing };
}
