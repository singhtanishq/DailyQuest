import type { CategoryId, Difficulty } from '../shared/types.js';

/**
 * DailyQuest — central configuration.
 *
 * Everything tunable about daily generation lives here: weights, rotation
 * rules, catch-up policy and the generator version. No magic constants are
 * scattered through the pipeline.
 */

export interface DailyQuestConfig {
  /** IANA timezone used to resolve "today" for daily publication. */
  publicationTimezone: string;
  /** Semantic version of the generator; stored on every published quest. */
  generatorVersion: string;
  /** Domain string used in seed derivation. */
  seedDomain: string;
  /** Master switch for scheduled publishing. */
  publishingEnabled: boolean;
  /**
   * Maximum number of consecutive missed days the daily run will backfill.
   * If more days were missed, only today is generated and the gap is recorded
   * (use `npm run generate:backfill` for older gaps).
   */
  maxCatchupDays: number;
  /** Relative likelihood of each category being selected. */
  categoryWeights: Record<CategoryId, number>;
  /** Relative likelihood of each difficulty, when a template allows a choice. */
  difficultyWeights: Record<Difficulty, number>;
  /**
   * Per-category difficulty weight overrides. A category may cap or boost
   * certain difficulty tiers (e.g. system design rarely publishes beginner).
   */
  categoryDifficultyOverrides: Partial<Record<CategoryId, Partial<Record<Difficulty, number>>>>;
  rotation: {
    /** Do not reuse a template within this many most-recent quests. */
    templateWindow: number;
    /** Do not reuse the same primary concept within this many most-recent quests. */
    conceptWindow: number;
    /** Maximum consecutive days a category may publish (e.g. 2 = no 3-in-a-row). */
    categoryRepeatLimit: number;
    /** Attempts to find a non-duplicate challenge before failing. */
    maxDuplicateRetries: number;
  };
  quality: {
    /** Minimum internal validation score required to publish. */
    minQualityScore: number;
  };
}

const categoryWeights: Record<CategoryId, number> = {
  coding: 18,
  debugging: 10,
  algorithms: 10,
  web: 6,
  javascript: 7,
  python: 7,
  cybersecurity: 7,
  sql: 6,
  linux: 5,
  git: 5,
  networking: 5,
  regex: 4,
  logic: 4,
  system_design: 3,
  performance: 3,
  architecture: 3,
  http: 4,
  apis: 4,
  typescript: 3,
  react: 3,
  data_structures: 4,
  code_review: 5,
  output_prediction: 5,
  databases: 2,
  security_analysis: 3,
  devops: 2,
  general_tech: 2,
  puzzle: 2,
};

const difficultyWeights: Record<Difficulty, number> = {
  beginner: 10,
  easy: 20,
  intermediate: 35,
  hard: 25,
  expert: 10,
};

export const config: DailyQuestConfig = {
  publicationTimezone: process.env.DAILYQUEST_TIMEZONE ?? 'Asia/Kolkata',
  generatorVersion: '1.0.0',
  seedDomain: 'DailyQuest',
  publishingEnabled: true,
  maxCatchupDays: 7,
  categoryWeights,
  difficultyWeights,
  categoryDifficultyOverrides: {
    // Concept-heavy categories rarely start at the bottom of the ladder.
    system_design: { beginner: 0 },
    architecture: { beginner: 0 },
    security_analysis: { beginner: 0 },
    databases: { beginner: 0, easy: 8 },
    // Craft categories can go deep.
    regex: { hard: 28, expert: 14 },
    algorithms: { intermediate: 38 },
  },
  rotation: {
    templateWindow: 14,
    conceptWindow: 7,
    categoryRepeatLimit: 2,
    maxDuplicateRetries: 8,
  },
  quality: {
    minQualityScore: 70,
  },
};

/** Resolved runtime configuration (env overrides applied). */
export function loadConfig(): DailyQuestConfig {
  return config;
}
