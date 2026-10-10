import {
  CATEGORY_IDS,
  CHALLENGE_TYPES,
  DIFFICULTIES,
  DIFFICULTY_SCORES,
  QUEST_STATUSES,
  type Quest,
} from '../../../shared/types.js';
import { isIsoDate } from '../core/dates.js';
import { slugify } from '../core/slug.js';

/**
 * Structural + content validation for a single quest object. Returns a list
 * of checks so the pipeline can compute a quality score and the repository
 * validator can report precise failures.
 */

export interface CheckResult {
  id: string;
  passed: boolean;
  detail?: string;
}

const PLACEHOLDER_PATTERN = /\b(TODO|FIXME|LOREM IPSUM|PLACEHOLDER|TBD|XXX)\b/i;
const SECRET_PATTERN = /\b(sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})\b/;

function collectText(quest: Quest): string {
  const parts: string[] = [
    quest.title,
    quest.subtitle,
    quest.description,
    quest.prompt,
    ...quest.instructions,
    ...quest.constraints,
    ...quest.hints,
    ...quest.learningObjectives,
    quest.solution.summary,
    ...(quest.solution.reasoning ?? []),
    ...(quest.solution.approach ?? []),
    ...(quest.solution.commonMistakes ?? []),
    ...quest.examples.map((e) => `${e.title} ${e.output} ${e.explanation ?? ''}`),
  ];
  if (quest.solution.code) {
    parts.push(quest.solution.code.code);
  }
  if (quest.starterCode) {
    parts.push(quest.starterCode.code);
  }
  return parts.filter(Boolean).join('\n');
}

function countFences(text: string): number {
  const matches = text.match(/^```/gm);
  return matches ? matches.length : 0;
}

export function validateQuestStructure(quest: Quest): CheckResult[] {
  const checks: CheckResult[] = [];
  const check = (id: string, passed: boolean, detail?: string): void => {
    checks.push({ id, passed, detail });
  };

  // Identity
  check('schemaVersion', quest.schemaVersion === 1, `got ${quest.schemaVersion}`);
  check(
    'id-format',
    /^dq-\d{4}-\d{2}-\d{2}$/.test(quest.id) && quest.id === `dq-${quest.date}`,
    `id=${quest.id} date=${quest.date}`
  );
  check('date-valid', isIsoDate(quest.date));
  const expectedSlug = `${quest.date}-${slugify(quest.title)}`;
  check(
    'slug-canonical',
    quest.slug === expectedSlug && !quest.slug.includes('--'),
    `slug=${quest.slug} expected=${expectedSlug}`
  );
  check('sequence-positive', Number.isInteger(quest.sequenceNumber) && quest.sequenceNumber >= 1);
  check('status-published', QUEST_STATUSES.includes(quest.status));
  check('authoring-method', quest.authoringMethod === 'deterministic-template');
  check('template-id-present', typeof quest.templateId === 'string' && quest.templateId.length > 0);
  check(
    'generator-version',
    /^\d+\.\d+\.\d+$/.test(quest.generatorVersion)
  );
  check('seed-present', /^[0-9a-f]{16,}$/.test(quest.seed));
  check('content-hash-present', /^[0-9a-f]{16,}$/.test(quest.contentHash));
  check(
    'timestamps',
    isIsoDate(quest.createdAt.split('T')[0] ?? '') && quest.updatedAt.includes('T')
  );

  // Taxonomy
  check('category-valid', (CATEGORY_IDS as readonly string[]).includes(quest.category));
  check('challenge-type-valid', (CHALLENGE_TYPES as readonly string[]).includes(quest.challengeType));
  check('difficulty-valid', (DIFFICULTIES as readonly string[]).includes(quest.difficulty));
  check(
    'difficulty-score-aligned',
    quest.difficultyScore === DIFFICULTY_SCORES[quest.difficulty],
    `score=${quest.difficultyScore} difficulty=${quest.difficulty}`
  );
  for (const key of ['conceptComplexity', 'reasoningComplexity', 'implementationComplexity'] as const) {
    const value = quest[key];
    check(`${key}-range`, Number.isInteger(value) && value >= 1 && value <= 5, `got ${value}`);
  }

  // Content substance
  check('title-nonempty', quest.title.trim().length >= 4);
  check('title-length', quest.title.length <= 80, `${quest.title.length} chars`);
  check('short-title-nonempty', quest.shortTitle.trim().length > 0);
  check('subtitle-nonempty', quest.subtitle.trim().length > 0);
  check('description-nonempty', quest.description.trim().length >= 20);
  check(
    'prompt-substantial',
    quest.prompt.trim().length >= 40,
    `${quest.prompt.trim().length} chars`
  );
  check(
    'instructions-nonempty',
    quest.instructions.length > 0 && quest.instructions.every((i) => i.trim().length > 0)
  );
  check('hints-count', quest.hints.length <= 3 && quest.hints.every((h) => h.trim().length > 0));
  check('solution-summary', quest.solution.summary.trim().length >= 10);
  check(
    'estimated-minutes',
    quest.estimatedMinutes >= 5 && quest.estimatedMinutes <= 120,
    `${quest.estimatedMinutes}`
  );
  check('concepts-nonempty', quest.concepts.length > 0 && quest.concepts.every((c) => c.trim().length > 0));
  check('tags-nonempty', quest.tags.length > 0 && quest.tags.every((t) => t.trim().length > 0));
  check('skills-nonempty', quest.skills.length > 0);
  check('objectives-nonempty', quest.learningObjectives.length > 0);
  check(
    'validation-record',
    quest.validation.passed === true && quest.validation.score >= 0 && quest.validation.checkedAt.includes('T')
  );

  // Multiple-choice consistency
  if (quest.options !== undefined || quest.correctOptionIndex !== undefined) {
    const optionsOk =
      quest.options !== undefined &&
      quest.options.length >= 2 &&
      quest.options.every((o) => o.trim().length > 0) &&
      quest.correctOptionIndex !== undefined &&
      quest.correctOptionIndex >= 0 &&
      quest.correctOptionIndex < quest.options.length &&
      quest.options[quest.correctOptionIndex] === quest.solution.answer;
    check('options-consistent', optionsOk);
  }

  // Executable challenges carry examples/tests
  const executable = ['coding', 'output_prediction', 'sql', 'regex', 'linux'].includes(
    quest.challengeType
  );
  if (executable && quest.examples.length === 0 && !quest.testCases && !quest.expectedOutput) {
    check('executable-examples', false, 'executable quest without examples or expected output');
  }

  // Hygiene
  const text = collectText(quest);
  const placeholderMatch = PLACEHOLDER_PATTERN.exec(text);
  check('no-placeholders', placeholderMatch === null, placeholderMatch?.[0]);
  const secretMatch = SECRET_PATTERN.exec(text);
  check('no-secrets', secretMatch === null, secretMatch ? 'credential-like token found' : undefined);
  check(
    'markdown-fences-balanced',
    countFences(text) % 2 === 0,
    `${countFences(text)} fences`
  );

  return checks;
}

export function qualityScore(checks: CheckResult[]): number {
  if (checks.length === 0) {
    return 0;
  }
  const passed = checks.filter((c) => c.passed).length;
  return Math.round((passed / checks.length) * 100);
}
