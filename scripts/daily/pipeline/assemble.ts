import { CATEGORY_META } from '../../../shared/categories.js';
import {
  DIFFICULTY_SCORES,
  type CategoryId,
  type Difficulty,
  type Quest,
} from '../../../shared/types.js';
import { computeContentHash } from '../core/hashing.js';
import { questId, questSlug } from '../core/slug.js';
import type { QuestBody, QuestTemplate } from '../templates/framework.js';

/**
 * Assembles the canonical Quest object from a rendered template body.
 * Field order here defines the JSON key order of every published file.
 */

const CONCEPTUAL_CATEGORIES = new Set<string>([
  'architecture',
  'system_design',
  'apis',
  'http',
  'networking',
  'devops',
  'databases',
  'general_tech',
  'web',
  'cybersecurity',
]);

const IMPLEMENTATION_CATEGORIES = new Set<string>([
  'coding',
  'debugging',
  'sql',
  'regex',
  'code_review',
  'output_prediction',
  'security_analysis',
  'linux',
  'git',
  'data_structures',
  'algorithms',
]);

function clamp1to5(value: number): number {
  return Math.min(5, Math.max(1, value));
}

export function deriveComplexity(
  category: CategoryId,
  difficultyScore: number
): { conceptComplexity: number; reasoningComplexity: number; implementationComplexity: number } {
  const reasoning = clamp1to5(difficultyScore);
  const concept = CONCEPTUAL_CATEGORIES.has(category)
    ? reasoning
    : IMPLEMENTATION_CATEGORIES.has(category)
      ? clamp1to5(reasoning - 1)
      : reasoning;
  const implementation = IMPLEMENTATION_CATEGORIES.has(category)
    ? reasoning
    : clamp1to5(reasoning - 1);
  return { conceptComplexity: concept, reasoningComplexity: reasoning, implementationComplexity: implementation };
}

export interface AssembleParams {
  date: string;
  template: QuestTemplate;
  difficulty: Difficulty;
  body: QuestBody;
  seedHex: string;
  generatorVersion: string;
  sequenceNumber: number;
  relatedQuestIds: string[];
  nowIso: string;
}

export function assembleQuest(params: AssembleParams): Quest {
  const { date, template, difficulty, body, seedHex, generatorVersion, sequenceNumber, relatedQuestIds, nowIso } =
    params;
  const difficultyScore = DIFFICULTY_SCORES[difficulty] ?? 3;
  const category = template.category;
  const complexity = deriveComplexity(category, difficultyScore);
  const contentHash = computeContentHash({
    templateId: template.id,
    paramsSignature: body.paramsSignature,
    title: body.title,
    prompt: body.prompt,
    solutionSummary: body.solution.summary,
  });
  const meta = CATEGORY_META[category];

  return {
    schemaVersion: 1,
    id: questId(date),
    date,
    sequenceNumber,
    slug: questSlug(date, body.title),
    title: body.title,
    shortTitle: body.title.length <= 40 ? body.title : `${body.title.slice(0, 37).trimEnd()}…`,
    subtitle: body.subtitle,
    description: body.description,
    category,
    subcategories: body.subcategories,
    challengeType: template.challengeType,
    difficulty,
    difficultyScore,
    estimatedMinutes: body.estimatedMinutes,
    conceptComplexity: complexity.conceptComplexity,
    reasoningComplexity: complexity.reasoningComplexity,
    implementationComplexity: complexity.implementationComplexity,
    concepts: body.concepts,
    tags: body.tags,
    skills: body.skills,
    prompt: body.prompt,
    instructions: body.instructions,
    constraints: body.constraints,
    options: body.options,
    correctOptionIndex: body.correctOptionIndex,
    examples: body.examples,
    starterCode: body.starterCode,
    expectedOutput: body.expectedOutput,
    testCases: body.testCases,
    edgeCases: body.edgeCases,
    hints: body.hints,
    solution: body.solution,
    learningObjectives: body.learningObjectives,
    discussionPoints: body.discussionPoints,
    relatedQuestIds,
    authoringMethod: 'deterministic-template',
    templateId: template.id,
    generatorVersion,
    seed: seedHex,
    paramsSignature: body.paramsSignature,
    contentHash,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: 'published',
    validation: { passed: false, score: 0, checkedAt: nowIso, checks: [] },
  };
}
