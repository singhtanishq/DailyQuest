/**
 * DailyQuest — canonical domain types.
 *
 * This module is the single source of truth for the quest data model. It is
 * shared by the deterministic generator (Node) and the frontend (browser), so
 * the published JSON schema and the UI can never drift apart.
 */

export const DIFFICULTIES = ['beginner', 'easy', 'intermediate', 'hard', 'expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const CATEGORY_IDS = [
  'coding',
  'debugging',
  'algorithms',
  'data_structures',
  'performance',
  'code_review',
  'output_prediction',
  'python',
  'javascript',
  'typescript',
  'react',
  'web',
  'http',
  'apis',
  'databases',
  'sql',
  'linux',
  'git',
  'devops',
  'networking',
  'cybersecurity',
  'security_analysis',
  'regex',
  'logic',
  'puzzle',
  'architecture',
  'system_design',
  'general_tech',
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CHALLENGE_TYPES = [
  'coding',
  'debugging',
  'output_prediction',
  'code_review',
  'sql',
  'regex',
  'git',
  'linux',
  'networking',
  'http',
  'api',
  'cybersecurity',
  'logic_puzzle',
  'algorithm',
  'data_structure',
  'architecture',
  'system_design',
  'performance',
  'security_analysis',
  'reasoning',
] as const;
export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export const QUEST_STATUSES = ['published', 'corrected', 'deprecated', 'archived'] as const;
export type QuestStatus = (typeof QUEST_STATUSES)[number];

export const SCHEMA_VERSION = 1 as const;

/** A single worked example attached to a quest. */
export interface QuestExample {
  title: string;
  input?: string;
  output: string;
  explanation?: string;
}

/** A runnable test case for executable challenges. */
export interface QuestTestCase {
  name: string;
  input: string;
  expected: string;
}

/** Reference code shown inside a quest (starter or solution). */
export interface QuestCode {
  language: string;
  label?: string;
  code: string;
}

export interface QuestSolution {
  /** One-paragraph answer to the challenge. */
  summary: string;
  /** Step-by-step approach, in order. */
  approach?: string[];
  /** Reference implementation, when applicable. */
  code?: QuestCode;
  /** The correct choice for multiple-choice quests. */
  answer?: string;
  /** Reasoning walkthrough for conceptual quests. */
  reasoning?: string[];
  /** Why each incorrect option is wrong (aligned with the presented options). */
  whyNot?: string[];
  /** Complexity analysis for algorithmic quests. */
  complexity?: string;
  /** Alternative valid approaches. */
  alternatives?: string[];
  /** Mistakes solvers commonly make here. */
  commonMistakes?: string[];
}

/** Validation record stored with each published quest. */
export interface QuestValidation {
  passed: boolean;
  /** Internal quality score 0-100, computed from executed checks. */
  score: number;
  checkedAt: string;
  checks: string[];
}

/**
 * A published quest. This is the canonical object stored at
 * data/quests/YYYY/MM/YYYY-MM-DD.json.
 */
export interface Quest {
  schemaVersion: typeof SCHEMA_VERSION;
  /** Stable identifier: dq-YYYY-MM-DD. */
  id: string;
  /** Publication date, ISO YYYY-MM-DD (in the publication timezone). */
  date: string;
  /** 1-based position across all published quests, in date order. */
  sequenceNumber: number;
  /** URL-safe: YYYY-MM-DD-the-title. */
  slug: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  category: CategoryId;
  subcategories: string[];
  challengeType: ChallengeType;
  difficulty: Difficulty;
  /** 1-5, aligned with the difficulty ladder. */
  difficultyScore: number;
  estimatedMinutes: number;
  conceptComplexity: number;
  reasoningComplexity: number;
  implementationComplexity: number;
  concepts: string[];
  tags: string[];
  skills: string[];
  /** Main challenge body. */
  prompt: string;
  instructions: string[];
  constraints: string[];
  /** Multiple-choice options, in presented (shuffled) order, when applicable. */
  options?: string[];
  /** Index into `options` of the correct choice, when applicable. */
  correctOptionIndex?: number;
  examples: QuestExample[];
  starterCode?: QuestCode;
  expectedOutput?: string;
  testCases?: QuestTestCase[];
  edgeCases?: string[];
  /** 0-3 hints, escalating from direction to strategy. */
  hints: string[];
  solution: QuestSolution;
  learningObjectives: string[];
  discussionPoints?: string[];
  /** Quest ids from the same category worth trying next. */
  relatedQuestIds: string[];
  authoringMethod: 'deterministic-template';
  templateId: string;
  generatorVersion: string;
  /** Hex seed this quest was generated from (derived from the date). */
  seed: string;
  /** Stable signature of the selected template parameters. */
  paramsSignature: string;
  /** Hash of normalized semantic content; used for duplicate detection. */
  contentHash: string;
  createdAt: string;
  updatedAt: string;
  status: QuestStatus;
  validation: QuestValidation;
}

/** Compact metadata used by the archive, search, and navigation. */
export interface QuestIndexEntry {
  id: string;
  date: string;
  sequenceNumber: number;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: CategoryId;
  challengeType: ChallengeType;
  difficulty: Difficulty;
  difficultyScore: number;
  estimatedMinutes: number;
  concepts: string[];
  tags: string[];
  contentHash: string;
}

export interface QuestIndexFile {
  schemaVersion: typeof SCHEMA_VERSION;
  generatorVersion: string;
  generatedAt: string;
  quests: QuestIndexEntry[];
}

export interface CategoryStat {
  id: CategoryId;
  label: string;
  count: number;
  percent: number;
}

export interface QuestStats {
  schemaVersion: typeof SCHEMA_VERSION;
  generatorVersion: string;
  generatedAt: string;
  totalQuests: number;
  currentSequence: number;
  latestQuestDate: string | null;
  oldestQuestDate: string | null;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
  categoryBreakdown: CategoryStat[];
  averageEstimatedMinutes: number;
  totalEstimatedMinutes: number;
  /** Consecutive published days ending at the latest quest date. */
  currentStreak: number;
  /** Longest run of consecutive published days in archive history. */
  longestStreak: number;
  /** Calendar days between oldest and latest quest, inclusive. */
  archiveSpanDays: number;
  /** Number of calendar days inside the span with no published quest. */
  missedDays: number;
  mostFrequentCategory: string | null;
  mostFrequentDifficulty: string | null;
}

export interface CategorySummary {
  id: CategoryId;
  label: string;
  description: string;
  icon: string;
  group: string;
  questCount: number;
  difficultyDistribution: Record<string, number>;
  skills: string[];
  topTags: string[];
  latestQuestDate: string | null;
}

export type CategoriesFile = {
  schemaVersion: typeof SCHEMA_VERSION;
  generatorVersion: string;
  generatedAt: string;
  categories: CategorySummary[];
};

export interface LatestFile {
  schemaVersion: typeof SCHEMA_VERSION;
  generatorVersion: string;
  generatedAt: string;
  quest: QuestIndexEntry;
}

export interface HealthFile {
  schemaVersion: typeof SCHEMA_VERSION;
  generatorVersion: string;
  status: 'ok' | 'degraded';
  latestQuestDate: string | null;
  archiveCount: number;
  lastGeneration: {
    date: string;
    questId: string;
    at: string;
  } | null;
}

export interface DailyReport {
  schemaVersion: typeof SCHEMA_VERSION;
  date: string;
  generatedAt: string;
  generatorVersion: string;
  outcome: 'created' | 'already-exists' | 'dry-run' | 'catch-up';
  questId: string | null;
  sequenceNumber: number | null;
  title: string | null;
  category: string | null;
  difficulty: string | null;
  templateId: string | null;
  validationScore: number | null;
  changedDerivedFiles: string[];
  warnings: string[];
  durationMs: number;
}

/** Result of one generation run, used by the CLI and workflows. */
export interface GenerationResult {
  quest: Quest | null;
  outcome: DailyReport['outcome'];
  changedFiles: string[];
  warnings: string[];
  durationMs: number;
}
