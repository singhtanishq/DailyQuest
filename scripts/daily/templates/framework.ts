import type {
  CategoryId,
  ChallengeType,
  Difficulty,
  QuestCode,
  QuestExample,
  QuestSolution,
  QuestTestCase,
} from '../../../shared/types.js';
import type { Rng } from '../core/rng.js';

/**
 * Template framework.
 *
 * A template is a deterministic recipe for one challenge. Templates are
 * authored with small declarative factories that centralize the boring parts
 * (option shuffling, computing expected outputs by executing reference code,
 * assembling solutions) and attach machine-checkable verification specs that
 * the pipeline executes before anything is published.
 */

export interface TemplateContext {
  date: string;
  difficulty: Difficulty;
  rng: Rng;
}

/** Machine-executable checks attached to a rendered challenge. */
export type VerificationSpec =
  /** Execute a JavaScript snippet in a sandbox; stdout/completion must equal expectedOutput. */
  | { kind: 'javascript'; code: string; expectedOutput: string }
  /** Run fixture + query against SQLite; result rows must equal expectedRows. */
  | {
      kind: 'sqlite';
      fixture: string;
      query: string;
      expectedColumns: string[];
      expectedRows: string[][];
    }
  /** Evaluate a RegExp against match / non-match samples. */
  | { kind: 'regex'; pattern: string; flags: string; samples: { text: string; matches: boolean }[] }
  /** Run bash setup + command in a temp dir; stdout must equal expectedOutput. */
  | { kind: 'shell'; setup: string[]; files?: Record<string, string>; command: string; expectedOutput: string }
  /** Run git commands in a temp repo and assert repository state. */
  | {
      kind: 'git';
      setup: string[];
      expect: {
        logSubjects?: string[];
        fileContents?: Record<string, string>;
        revCount?: number;
      };
    };

export interface QuestBody {
  title: string;
  subtitle: string;
  description: string;
  prompt: string;
  instructions: string[];
  constraints: string[];
  options?: string[];
  correctOptionIndex?: number;
  examples: QuestExample[];
  starterCode?: QuestCode;
  expectedOutput?: string;
  testCases?: QuestTestCase[];
  edgeCases?: string[];
  hints: string[];
  solution: QuestSolution;
  learningObjectives: string[];
  discussionPoints?: string[];
  subcategories: string[];
  concepts: string[];
  tags: string[];
  skills: string[];
  estimatedMinutes: number;
  paramsSignature: string;
  verification?: VerificationSpec;
}

export interface QuestTemplate {
  /** Globally unique template id, e.g. "coding.string-rotation". */
  id: string;
  category: CategoryId;
  challengeType: ChallengeType;
  difficulties: readonly Difficulty[];
  /** Primary concepts, used by the rotation window. */
  concepts: string[];
  build(ctx: TemplateContext): QuestBody;
}

export interface TemplateSpecBase {
  id: string;
  category: CategoryId;
  challengeType: ChallengeType;
  difficulty: Difficulty | readonly Difficulty[];
  minutes: number;
  concepts: string[];
  tags: string[];
  skills: string[];
  subcategories?: string[];
}

function toDifficulties(d: Difficulty | readonly Difficulty[]): Difficulty[] {
  if (typeof d === 'string') {
    return [d];
  }
  return [...d];
}

function requireHints(hints: string[], label: string): string[] {
  if (hints.length > 3) {
    throw new Error(`${label}: at most 3 hints allowed`);
  }
  return hints;
}

function codeFence(language: string, code: string): string {
  return `\`\`\`${language}\n${code.trimEnd()}\n\`\`\``;
}

// ---------------------------------------------------------------------------
// quizChallenge — multiple-choice conceptual challenge
// ---------------------------------------------------------------------------

export interface QuizSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  /** Optional code/context block shown before the question. */
  scenario?: { language: string; code: string };
  question: string;
  /** The CORRECT option must be listed first; options are shuffled at build time. */
  options: [string, ...string[]];
  /** Explanations aligned with `options` (index 0 explains the correct one). */
  optionExplanations: string[];
  reasoning?: string[];
  hints: string[];
  objectives: string[];
  discussionPoints?: string[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

export function quizChallenge(spec: QuizSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: spec.challengeType,
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: ({ rng }) => {
      const order = rng.shuffle(spec.options.map((_, i) => i));
      const shuffledOptions = order.map((i) => spec.options[i] ?? '');
      const correctOptionIndex = order.indexOf(0);
      if (correctOptionIndex < 0) {
        throw new Error(`${spec.id}: missing correct option`);
      }

      const promptParts: string[] = [];
      if (spec.scenario) {
        promptParts.push(codeFence(spec.scenario.language, spec.scenario.code));
      }
      promptParts.push(spec.question);
      promptParts.push(
        shuffledOptions.map((opt, i) => `**${LETTERS[i] ?? '?'}.** ${opt}`).join('\n')
      );

      const solution: QuestSolution = {
        summary: `The correct answer is ${LETTERS[correctOptionIndex] ?? '?'} — ${spec.options[0] ?? ''}`,
        answer: spec.options[0] ?? '',
        reasoning: spec.reasoning,
        whyNot: shuffledOptions
          .map((opt, presentedIndex) => {
            if (presentedIndex === correctOptionIndex) {
              return null;
            }
            const originalIndex = order[presentedIndex];
            const explanation =
              originalIndex !== undefined ? spec.optionExplanations[originalIndex] : undefined;
            return explanation ? `${opt} — ${explanation}` : null;
          })
          .filter((entry): entry is string => entry !== null),
      };

      return {
        title: spec.title,
        subtitle: spec.subtitle,
        description: spec.description,
        prompt: promptParts.join('\n\n'),
        instructions: ['Choose the single best answer.'],
        constraints: [],
        options: shuffledOptions,
        correctOptionIndex,
        examples: [],
        hints: requireHints(spec.hints, spec.id),
        solution,
        learningObjectives: spec.objectives,
        discussionPoints: spec.discussionPoints,
        subcategories: spec.subcategories ?? spec.concepts,
        concepts: spec.concepts,
        tags: spec.tags,
        skills: spec.skills,
        estimatedMinutes: spec.minutes,
        paramsSignature: 'v1',
      };
    },
  };
}

// ---------------------------------------------------------------------------
// openChallenge — conceptual free-form challenge with a worked answer
// ---------------------------------------------------------------------------

export interface OpenSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  scenario?: { language: string; code: string };
  question: string;
  /** Bullets appended to the prompt describing what a good answer addresses. */
  guidance?: string[];
  solution: {
    summary: string;
    reasoning: string[];
    alternatives?: string[];
    commonMistakes?: string[];
  };
  hints: string[];
  objectives: string[];
  discussionPoints?: string[];
}

export function openChallenge(spec: OpenSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: spec.challengeType,
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => {
      const promptParts: string[] = [];
      if (spec.scenario) {
        promptParts.push(codeFence(spec.scenario.language, spec.scenario.code));
      }
      promptParts.push(spec.question);
      if (spec.guidance && spec.guidance.length > 0) {
        promptParts.push(`A strong answer addresses:\n${spec.guidance.map((g) => `- ${g}`).join('\n')}`);
      }

      return {
        title: spec.title,
        subtitle: spec.subtitle,
        description: spec.description,
        prompt: promptParts.join('\n\n'),
        instructions: ['Answer in your own words, then compare with the solution.'],
        constraints: [],
        examples: [],
        hints: requireHints(spec.hints, spec.id),
        solution: {
          summary: spec.solution.summary,
          reasoning: spec.solution.reasoning,
          alternatives: spec.solution.alternatives,
          commonMistakes: spec.solution.commonMistakes,
        },
        learningObjectives: spec.objectives,
        discussionPoints: spec.discussionPoints,
        subcategories: spec.subcategories ?? spec.concepts,
        concepts: spec.concepts,
        tags: spec.tags,
        skills: spec.skills,
        estimatedMinutes: spec.minutes,
        paramsSignature: 'v1',
      };
    },
  };
}

// ---------------------------------------------------------------------------
// codingChallenge — executable implementation challenge
// ---------------------------------------------------------------------------

export interface CodingSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  /** Shown before the task description. */
  promptIntro: string;
  instructions: string[];
  constraints: string[];
  /**
   * Reference implementation. Parses the canonical input string and returns
   * the canonical output string. Used to compute every expected test output
   * and example output — expected values are never hand-invented.
   */
  run: (input: string) => string;
  tests: { name: string; input: string }[];
  /** Inputs are run through `run` to compute the displayed output. */
  examples: { title: string; input: string; explanation?: string }[];
  starter?: { language: string; code: string };
  solution: {
    summary: string;
    approach: string[];
    code: { language?: string; code: string };
    complexity: string;
    alternatives?: string[];
    mistakes?: string[];
  };
  hints: string[];
  objectives: string[];
  edgeCases?: string[];
}

export function codingChallenge(spec: CodingSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'coding',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => {
      const testCases: QuestTestCase[] = spec.tests.map((test) => {
        let expected: string;
        try {
          expected = spec.run(test.input);
        } catch (error) {
          throw new Error(
            `${spec.id}: reference implementation failed on test "${test.name}": ${(error as Error).message}`
          );
        }
        return { name: test.name, input: test.input, expected };
      });

      const examples: QuestExample[] = spec.examples.map((example) => {
        let output: string;
        try {
          output = spec.run(example.input);
        } catch (error) {
          throw new Error(
            `${spec.id}: reference implementation failed on example "${example.title}": ${(error as Error).message}`
          );
        }
        return { title: example.title, input: example.input, output, explanation: example.explanation };
      });

      return {
        title: spec.title,
        subtitle: spec.subtitle,
        description: spec.description,
        prompt: spec.promptIntro,
        instructions: spec.instructions,
        constraints: spec.constraints,
        examples,
        starterCode: spec.starter,
        testCases,
        edgeCases: spec.edgeCases,
        hints: requireHints(spec.hints, spec.id),
        solution: {
          summary: spec.solution.summary,
          approach: spec.solution.approach,
          code: {
            language: spec.solution.code.language ?? 'javascript',
            label: 'Reference solution',
            code: spec.solution.code.code,
          },
          complexity: spec.solution.complexity,
          alternatives: spec.solution.alternatives,
          commonMistakes: spec.solution.mistakes,
        },
        learningObjectives: spec.objectives,
        subcategories: spec.subcategories ?? spec.concepts,
        concepts: spec.concepts,
        tags: spec.tags,
        skills: spec.skills,
        estimatedMinutes: spec.minutes,
        paramsSignature: 'v1',
      };
    },
  };
}

// ---------------------------------------------------------------------------
// predictionChallenge — output prediction, verified by executing the snippet
// ---------------------------------------------------------------------------

export interface PredictionSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  /** JavaScript source shown to the solver; executed in a sandbox to verify. */
  snippet: string;
  /** The exact printed output. Must match what the snippet actually prints. */
  output: string;
  reasoning: string[];
  hints: string[];
  objectives: string[];
}

export function predictionChallenge(spec: PredictionSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'output_prediction',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => {
      const code = spec.snippet.trimEnd();
      return {
        title: spec.title,
        subtitle: spec.subtitle,
        description: spec.description,
        prompt: `What does this JavaScript program print to the console?\n\n${codeFence('javascript', code)}`,
        instructions: ['Predict the exact console output before revealing the solution.'],
        constraints: [],
        examples: [],
        expectedOutput: spec.output,
        verification: { kind: 'javascript', code, expectedOutput: spec.output },
        hints: requireHints(spec.hints, spec.id),
        solution: {
          summary: `The program prints:\n\n${codeFence('text', spec.output)}`,
          reasoning: spec.reasoning,
        },
        learningObjectives: spec.objectives,
        subcategories: spec.subcategories ?? spec.concepts,
        concepts: spec.concepts,
        tags: spec.tags,
        skills: spec.skills,
        estimatedMinutes: spec.minutes,
        paramsSignature: 'v1',
      };
    },
  };
}

// ---------------------------------------------------------------------------
// debuggingChallenge — broken code, root cause, fix
// ---------------------------------------------------------------------------

export interface DebugSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  language: string;
  brokenCode: string;
  expectedBehaviour: string;
  actualBehaviour: string;
  fixedCode: string;
  rootCause: string;
  /** Trace of why the bug produces the observed behaviour. */
  reasoning: string[];
  regressionTest?: { language: string; code: string };
  mistakes?: string[];
  hints: string[];
  objectives: string[];
}

export function debuggingChallenge(spec: DebugSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'debugging',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => ({
      title: spec.title,
      subtitle: spec.subtitle,
      description: spec.description,
      prompt: [
        '**Expected behaviour:** ' + spec.expectedBehaviour,
        '**Actual behaviour:** ' + spec.actualBehaviour,
        codeFence(spec.language, spec.brokenCode),
        'Identify the bug, explain why it causes the observed behaviour, and fix it.',
      ].join('\n\n'),
      instructions: [
        'Reproduce the failure mentally or locally.',
        'Pinpoint the exact line and mechanism of the bug.',
        'Write the minimal fix that restores the expected behaviour.',
      ],
      constraints: ['Do not redesign the function unless the bug requires it.'],
      examples: [],
      hints: requireHints(spec.hints, spec.id),
      solution: {
        summary: spec.rootCause,
        approach: spec.reasoning,
        code: {
          language: spec.language,
          label: 'Corrected implementation',
          code: spec.fixedCode,
        },
        commonMistakes: spec.mistakes,
      },
      learningObjectives: spec.objectives,
      subcategories: spec.subcategories ?? spec.concepts,
      concepts: spec.concepts,
      tags: spec.tags,
      skills: spec.skills,
      estimatedMinutes: spec.minutes,
      paramsSignature: 'v1',
    }),
  };
}

// ---------------------------------------------------------------------------
// reviewChallenge — code review with annotated issues
// ---------------------------------------------------------------------------

export interface ReviewSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  language: string;
  code: string;
  context?: string;
  issues: {
    title: string;
    severity: 'critical' | 'major' | 'minor';
    explanation: string;
    fix: string;
  }[];
  improvedCode?: { language: string; code: string };
  hints: string[];
  objectives: string[];
}

export function reviewChallenge(spec: ReviewSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'code_review',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => ({
      title: spec.title,
      subtitle: spec.subtitle,
      description: spec.description,
      prompt: [
        spec.context ? spec.context : 'Review the following code as if it appeared in your team’s pull request.',
        codeFence(spec.language, spec.code),
        'Identify every issue worth raising: correctness, security, performance, and maintainability.',
      ].join('\n\n'),
      instructions: [
        'List each issue with its severity.',
        'For every issue, explain the concrete risk it creates.',
        'Propose the smallest fix that resolves it.',
      ],
      constraints: [],
      examples: [],
      hints: requireHints(spec.hints, spec.id),
      solution: {
        summary: `Review found ${spec.issues.length} issue${spec.issues.length === 1 ? '' : 's'}: ${spec.issues
          .map((i) => i.title)
          .join('; ')}.`,
        reasoning: spec.issues.map(
          (issue) => `**[${issue.severity.toUpperCase()}] ${issue.title}** — ${issue.explanation} Fix: ${issue.fix}`
        ),
        code: spec.improvedCode
          ? { language: spec.improvedCode.language, label: 'Improved implementation', code: spec.improvedCode.code }
          : undefined,
      },
      learningObjectives: spec.objectives,
      subcategories: spec.subcategories ?? spec.concepts,
      concepts: spec.concepts,
      tags: spec.tags,
      skills: spec.skills,
      estimatedMinutes: spec.minutes,
      paramsSignature: 'v1',
    }),
  };
}

// ---------------------------------------------------------------------------
// sqlChallenge — validated against SQLite when the binary is available
// ---------------------------------------------------------------------------

export interface SqlSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  /** SQLite fixture: CREATE TABLE statements plus seed INSERTs. */
  schema: string;
  question: string;
  /** Reference query; executed against the fixture at verification time. */
  query: string;
  expectedColumns: string[];
  /** Expected result rows, values as displayed strings ("NULL" for SQL NULL). */
  expectedRows: string[][];
  explanation: string[];
  performance?: string;
  mistakes?: string[];
  hints: string[];
  objectives: string[];
}

export function sqlChallenge(spec: SqlSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'sql',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => ({
      title: spec.title,
      subtitle: spec.subtitle,
      description: spec.description,
      prompt: [
        'You are working with the following schema (SQLite):',
        codeFence('sql', spec.schema),
        spec.question,
      ].join('\n\n'),
      instructions: ['Write a single SQL query that produces the requested result.'],
      constraints: ['The query must be deterministic and must not modify the database.'],
      examples: [],
      hints: requireHints(spec.hints, spec.id),
      solution: {
        summary: 'The reference query is:',
        code: { language: 'sql', label: 'Reference query', code: spec.query },
        reasoning: spec.explanation,
        commonMistakes: spec.mistakes,
        complexity: spec.performance,
      },
      learningObjectives: spec.objectives,
      subcategories: spec.subcategories ?? spec.concepts,
      concepts: spec.concepts,
      tags: spec.tags,
      skills: spec.skills,
      estimatedMinutes: spec.minutes,
      paramsSignature: 'v1',
      verification: {
        kind: 'sqlite',
        fixture: spec.schema,
        query: spec.query,
        expectedColumns: spec.expectedColumns,
        expectedRows: spec.expectedRows,
      },
    }),
  };
}

// ---------------------------------------------------------------------------
// regexChallenge — verified by executing the pattern against samples
// ---------------------------------------------------------------------------

export interface RegexSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  mode: 'explain' | 'write';
  pattern: string;
  flags: string;
  samples: { text: string; matches: boolean; note?: string }[];
  question: string;
  explanation: string[];
  /** Additional acceptable patterns for "write" mode. */
  alternatives?: string[];
  mistakes?: string[];
  hints: string[];
  objectives: string[];
}

export function regexChallenge(spec: RegexSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'regex',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => {
      const sampleLines = spec.samples
        .map((s) => `- \`${s.text}\` → ${s.matches ? 'match' : 'NO match'}${s.note ? ` (${s.note})` : ''}`)
        .join('\n');

      const prompt =
        spec.mode === 'explain'
          ? [spec.question, codeFence('regex', `/${spec.pattern}/${spec.flags}`), 'Test strings:', sampleLines].join(
              '\n\n'
            )
          : [
              spec.question,
              'Test strings:',
              sampleLines,
              'The pattern runs in JavaScript (`RegExp` semantics).',
            ].join('\n\n');

      return {
        title: spec.title,
        subtitle: spec.subtitle,
        description: spec.description,
        prompt,
        instructions:
          spec.mode === 'explain'
            ? ['State which strings match and which do not, and explain why.']
            : ['Write a single regular expression that satisfies every test string.'],
        constraints: [],
        examples: [],
        hints: requireHints(spec.hints, spec.id),
        solution: {
          summary:
            spec.mode === 'explain'
              ? `The pattern \`/${spec.pattern}/${spec.flags}\` behaves as shown above.`
              : `A correct pattern is \`/${spec.pattern}/${spec.flags}\`.`,
          reasoning: spec.explanation,
          alternatives: spec.alternatives,
          commonMistakes: spec.mistakes,
        },
        learningObjectives: spec.objectives,
        subcategories: spec.subcategories ?? spec.concepts,
        concepts: spec.concepts,
        tags: spec.tags,
        skills: spec.skills,
        estimatedMinutes: spec.minutes,
        paramsSignature: 'v1',
        verification: { kind: 'regex', pattern: spec.pattern, flags: spec.flags, samples: spec.samples },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// shellChallenge — Linux command challenge verified in a sandbox
// ---------------------------------------------------------------------------

export interface ShellSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  /** Fixture directory contents. */
  files: Record<string, string>;
  /** Bash commands that prepare the fixture (run inside the temp dir). */
  setup?: string[];
  /** The command whose output the question asks about. */
  command: string;
  question: string;
  /** Verified stdout of `command` (trimmed). */
  expectedOutput: string;
  explanation: string[];
  mistakes?: string[];
  hints: string[];
  objectives: string[];
}

export function shellChallenge(spec: ShellSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'linux',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => {
      const fileListing = Object.keys(spec.files)
        .map((name) => `- \`${name}\``)
        .join('\n');
      return {
        title: spec.title,
        subtitle: spec.subtitle,
        description: spec.description,
        prompt: [
          'You are in a directory containing these files:',
          fileListing,
          spec.question,
          codeFence('bash', spec.command),
        ].join('\n\n'),
        instructions: ['Predict the exact output of the command.'],
        constraints: [],
        examples: [],
        expectedOutput: spec.expectedOutput,
        hints: requireHints(spec.hints, spec.id),
        solution: {
          summary: `The command prints:\n\n${codeFence('text', spec.expectedOutput)}`,
          reasoning: spec.explanation,
          commonMistakes: spec.mistakes,
        },
        learningObjectives: spec.objectives,
        subcategories: spec.subcategories ?? spec.concepts,
        concepts: spec.concepts,
        tags: spec.tags,
        skills: spec.skills,
        estimatedMinutes: spec.minutes,
        paramsSignature: 'v1',
        verification: {
          kind: 'shell',
          files: spec.files,
          setup: spec.setup ?? [],
          command: spec.command,
          expectedOutput: spec.expectedOutput,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// gitChallenge — verified against a real temporary repository
// ---------------------------------------------------------------------------

export interface GitSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  scenario: string;
  /** The complete command sequence, run non-interactively in a temp repo. */
  commands: string[];
  question: string;
  expect: {
    logSubjects?: string[];
    fileContents?: Record<string, string>;
    revCount?: number;
  };
  explanation: string[];
  mistakes?: string[];
  hints: string[];
  objectives: string[];
}

export function gitChallenge(spec: GitSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: 'git',
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => ({
      title: spec.title,
      subtitle: spec.subtitle,
      description: spec.description,
      prompt: [spec.scenario, spec.question].join('\n\n'),
      instructions: ['Reason about the repository state after the command sequence.'],
      constraints: [],
      examples: [],
      hints: requireHints(spec.hints, spec.id),
      solution: {
        summary: spec.explanation[0] ?? '',
        reasoning: spec.explanation,
        commonMistakes: spec.mistakes,
      },
      learningObjectives: spec.objectives,
      subcategories: spec.subcategories ?? spec.concepts,
      concepts: spec.concepts,
      tags: spec.tags,
      skills: spec.skills,
      estimatedMinutes: spec.minutes,
      paramsSignature: 'v1',
      verification: { kind: 'git', setup: spec.commands, expect: spec.expect },
    }),
  };
}

// ---------------------------------------------------------------------------
// designChallenge — scoped system design / architecture prompts
// ---------------------------------------------------------------------------

export interface DesignSpec extends TemplateSpecBase {
  title: string;
  subtitle: string;
  description: string;
  brief: string;
  requirements: string[];
  solution: {
    summary: string;
    components: string[];
    dataFlow: string[];
    tradeoffs: string[];
    failureModes: string[];
    scaling?: string;
  };
  hints: string[];
  objectives: string[];
  discussionPoints?: string[];
}

export function designChallenge(spec: DesignSpec): QuestTemplate {
  return {
    id: spec.id,
    category: spec.category,
    challengeType: spec.challengeType,
    difficulties: toDifficulties(spec.difficulty),
    concepts: spec.concepts,
    build: () => ({
      title: spec.title,
      subtitle: spec.subtitle,
      description: spec.description,
      prompt: [spec.brief, `**Requirements**\n${spec.requirements.map((r) => `- ${r}`).join('\n')}`].join(
        '\n\n'
      ),
      instructions: [
        'Sketch the components and their responsibilities.',
        'Define the data flow for the primary operation.',
        'Name the key trade-offs you accepted and why.',
        'Describe how the design fails and how it scales.',
      ],
      constraints: ['Keep the design scoped to the stated requirements.'],
      examples: [],
      hints: requireHints(spec.hints, spec.id),
      solution: {
        summary: spec.solution.summary,
        reasoning: [
          `**Components**\n${spec.solution.components.map((c) => `- ${c}`).join('\n')}`,
          `**Data flow**\n${spec.solution.dataFlow.map((d) => `- ${d}`).join('\n')}`,
          `**Trade-offs**\n${spec.solution.tradeoffs.map((t) => `- ${t}`).join('\n')}`,
          `**Failure modes**\n${spec.solution.failureModes.map((f) => `- ${f}`).join('\n')}`,
        ],
        complexity: spec.solution.scaling,
      },
      learningObjectives: spec.objectives,
      discussionPoints: spec.discussionPoints,
      subcategories: spec.subcategories ?? spec.concepts,
      concepts: spec.concepts,
      tags: spec.tags,
      skills: spec.skills,
      estimatedMinutes: spec.minutes,
      paramsSignature: 'v1',
    }),
  };
}
