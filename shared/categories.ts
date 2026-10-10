import type { CategoryId, ChallengeType } from './types.js';

/**
 * Human-facing metadata for every category. The generator uses this for
 * category pages and descriptions; the frontend renders labels and icons from
 * the same source so the two never disagree.
 */

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  /** One-line tagline used on cards. */
  tagline: string;
  /** Full description used on category pages. */
  description: string;
  /** Lucide icon key, mapped to a component in the frontend. */
  icon: string;
  group: string;
  /** Challenge types this category typically publishes. */
  types: ChallengeType[];
}

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  coding: {
    id: 'coding',
    label: 'Coding',
    tagline: 'Write code that actually works.',
    description:
      'Hands-on implementation challenges: string manipulation, parsing, simulation and small utilities. Every coding quest ships with executable reference tests, so the expected behaviour is verified, not invented.',
    icon: 'terminal',
    group: 'Engineering',
    types: ['coding'],
  },
  debugging: {
    id: 'debugging',
    label: 'Debugging',
    tagline: 'Find the bug before it finds production.',
    description:
      'Realistic broken code with expected versus actual behaviour. Trace the failure, understand the root cause, and compare your fix against the corrected implementation.',
    icon: 'bug',
    group: 'Engineering',
    types: ['debugging'],
  },
  algorithms: {
    id: 'algorithms',
    label: 'Algorithms',
    tagline: 'Think in complexity, not brute force.',
    description:
      'Classic techniques — searching, two pointers, sliding windows, dynamic programming — applied to concrete problems with clear complexity expectations.',
    icon: 'network',
    group: 'Engineering',
    types: ['algorithm'],
  },
  data_structures: {
    id: 'data_structures',
    label: 'Data Structures',
    tagline: 'Pick the right container for the job.',
    description:
      'Stacks, queues, hash maps, heaps and sets used the way they are meant to be used. Challenges focus on choosing and applying the structure, not reciting definitions.',
    icon: 'layers',
    group: 'Engineering',
    types: ['data_structure', 'coding'],
  },
  performance: {
    id: 'performance',
    label: 'Performance',
    tagline: 'Make it fast by understanding why it is slow.',
    description:
      'N+1 queries, accidental quadratic algorithms, caching mistakes and network waterfalls. Performance quests teach practical profiling instincts rather than micro-optimizations.',
    icon: 'gauge',
    group: 'Engineering',
    types: ['performance'],
  },
  code_review: {
    id: 'code_review',
    label: 'Code Review',
    tagline: 'Read code like a senior engineer.',
    description:
      'A deliberately flawed snippet awaits your review. Identify the correctness, security, performance and maintainability issues, then compare findings with the annotated solution.',
    icon: 'search-code',
    group: 'Engineering',
    types: ['code_review'],
  },
  output_prediction: {
    id: 'output_prediction',
    label: 'Output Prediction',
    tagline: 'Does the runtime agree with you?',
    description:
      'Short snippets with surprising-but-correct behaviour. Every expected output is computed by actually executing the snippet in a sandbox at generation time — never guessed.',
    icon: 'eye',
    group: 'Engineering',
    types: ['output_prediction'],
  },
  python: {
    id: 'python',
    label: 'Python',
    tagline: 'Idiomatic, correct Python.',
    description:
      'Language semantics, the standard library, mutability traps and idiomatic patterns — the details that separate Python you can write from Python you can trust.',
    icon: 'file-code',
    group: 'Languages & Frameworks',
    types: ['coding', 'debugging', 'output_prediction'],
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    tagline: 'The language underneath the frameworks.',
    description:
      'Closures, coercion, the event loop, prototypes and array semantics. JavaScript quests target the parts of the language that genuinely surprise working developers.',
    icon: 'braces',
    group: 'Languages & Frameworks',
    types: ['coding', 'debugging', 'output_prediction'],
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    tagline: 'Types that carry their weight.',
    description:
      'Narrowing, generics, utility types and the difference between unsafe assertions and honest types. Challenges mirror decisions you make in real codebases.',
    icon: 'file-type',
    group: 'Languages & Frameworks',
    types: ['coding', 'debugging', 'output_prediction'],
  },
  react: {
    id: 'react',
    label: 'React',
    tagline: 'Hooks, renders and the rules that bind them.',
    description:
      'Hook rules, dependency arrays, keys, controlled inputs and render behaviour. React quests focus on the mental model, not framework trivia.',
    icon: 'atom',
    group: 'Languages & Frameworks',
    types: ['debugging', 'output_prediction', 'code_review'],
  },
  web: {
    id: 'web',
    label: 'Web Platform',
    tagline: 'Semantics, layout and the browser itself.',
    description:
      'HTML semantics, accessibility, CSS layout behaviour and browser fundamentals — the platform knowledge that makes everything else easier.',
    icon: 'globe',
    group: 'Web & APIs',
    types: ['reasoning', 'code_review'],
  },
  http: {
    id: 'http',
    label: 'HTTP',
    tagline: 'The protocol everything speaks.',
    description:
      'Methods, status codes, caching, headers, cookies and TLS semantics. HTTP quests demand precision: what does the protocol actually specify, and what do servers actually do?',
    icon: 'arrow-left-right',
    group: 'Web & APIs',
    types: ['http', 'reasoning'],
  },
  apis: {
    id: 'apis',
    label: 'APIs',
    tagline: 'Design interfaces others can live with.',
    description:
      'REST design, pagination, idempotency, versioning, retries and rate limiting. API quests ask you to make design decisions and defend them.',
    icon: 'plug',
    group: 'Web & APIs',
    types: ['api', 'reasoning'],
  },
  databases: {
    id: 'databases',
    label: 'Databases',
    tagline: 'How data behaves at rest and under load.',
    description:
      'Indexing, transactions, isolation levels and schema design — database behaviour that application code inherits whether you understand it or not.',
    icon: 'database',
    group: 'Data',
    types: ['reasoning'],
  },
  sql: {
    id: 'sql',
    label: 'SQL',
    tagline: 'Ask the database precise questions.',
    description:
      'Joins, aggregation, NULL semantics and window functions against small concrete schemas. SQL quests are validated against SQLite at generation time, so the expected result set is real.',
    icon: 'table',
    group: 'Data',
    types: ['sql'],
  },
  linux: {
    id: 'linux',
    label: 'Linux',
    tagline: 'Command-line fluency under pressure.',
    description:
      'grep, find, sed, pipes, permissions and process management. Some Linux quests are verified by executing the actual commands against a fixture in a sandbox.',
    icon: 'square-terminal',
    group: 'Systems & Tooling',
    types: ['linux', 'reasoning'],
  },
  git: {
    id: 'git',
    label: 'Git',
    tagline: 'History is a graph. Read it like one.',
    description:
      'Reset versus revert, rebase semantics, reflog recovery and conflict resolution. Git quests check your mental model of what actually happens to commits.',
    icon: 'git-branch',
    group: 'Systems & Tooling',
    types: ['git', 'reasoning'],
  },
  devops: {
    id: 'devops',
    label: 'DevOps',
    tagline: 'Ship reliably, fail loudly.',
    description:
      'Pipelines, environments, rollbacks and observability basics. DevOps quests focus on the decisions that keep deployments boring.',
    icon: 'infinity',
    group: 'Systems & Tooling',
    types: ['reasoning'],
  },
  networking: {
    id: 'networking',
    label: 'Networking',
    tagline: 'Packets, ports and the paths between.',
    description:
      'TCP versus UDP, DNS resolution, CIDR math, TLS handshakes and latency. Networking quests keep the terminology precise — several include computed answers.',
    icon: 'network',
    group: 'Systems & Tooling',
    types: ['networking', 'reasoning'],
  },
  cybersecurity: {
    id: 'cybersecurity',
    label: 'Cybersecurity',
    tagline: 'Think like a defender.',
    description:
      'Defensive security: vulnerability classes, secure coding, detection and mitigation. Quests analyse controlled examples — XSS, CSRF, injection, JWT mistakes — without ever targeting real systems.',
    icon: 'shield-check',
    group: 'Security',
    types: ['cybersecurity'],
  },
  security_analysis: {
    id: 'security_analysis',
    label: 'Security Analysis',
    tagline: 'Spot the vulnerability in the diff.',
    description:
      'Read a snippet, identify the vulnerability class, explain the risk and propose the mitigation. Purely defensive: analysis and secure fixes, never exploitation.',
    icon: 'scan-search',
    group: 'Security',
    types: ['security_analysis'],
  },
  regex: {
    id: 'regex',
    label: 'Regex',
    tagline: 'Match exactly what you mean.',
    description:
      'Character classes, anchors, groups and the greediness traps between them. Every regex quest is verified by executing the pattern against match and non-match samples.',
    icon: 'regex',
    group: 'Reasoning & Craft',
    types: ['regex'],
  },
  logic: {
    id: 'logic',
    label: 'Logic',
    tagline: 'Reason carefully, conclude correctly.',
    description:
      'Deduction, quantifiers, parity and truth-telling puzzles with fully worked reasoning. The answer matters; the derivation matters more.',
    icon: 'brain',
    group: 'Reasoning & Craft',
    types: ['logic_puzzle'],
  },
  puzzle: {
    id: 'puzzle',
    label: 'Puzzles',
    tagline: 'Technical brainteasers with a twist.',
    description:
      'Short self-contained brainteasers drawn from computing: bit tricks, number properties and counterintuitive-but-checkable results.',
    icon: 'puzzle',
    group: 'Reasoning & Craft',
    types: ['logic_puzzle'],
  },
  architecture: {
    id: 'architecture',
    label: 'Architecture',
    tagline: 'Trade-offs all the way down.',
    description:
      'Monolith versus services, event-driven design, data ownership and integration styles. Architecture quests ask for a position and the reasoning behind it.',
    icon: 'blocks',
    group: 'Design',
    types: ['architecture'],
  },
  system_design: {
    id: 'system_design',
    label: 'System Design',
    tagline: 'Design it, then defend it.',
    description:
      'Scoped mini-designs — rate limiters, URL shorteners, webhook delivery — with requirements, trade-offs, failure modes and scaling as first-class answers.',
    icon: 'workflow',
    group: 'Design',
    types: ['system_design'],
  },
  general_tech: {
    id: 'general_tech',
    label: 'General Tech',
    tagline: 'The details every engineer trips on.',
    description:
      'Encodings, floating point, dates, JSON and other cross-cutting fundamentals that produce disproportionately many production bugs.',
    icon: 'cpu',
    group: 'Reasoning & Craft',
    types: ['reasoning'],
  },
};

export const CATEGORY_GROUPS = [
  'Engineering',
  'Languages & Frameworks',
  'Web & APIs',
  'Data',
  'Systems & Tooling',
  'Security',
  'Reasoning & Craft',
  'Design',
] as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  intermediate: 'Intermediate',
  hard: 'Hard',
  expert: 'Expert',
};

/** Numeric 1-5 score aligned with the difficulty ladder. */
export const DIFFICULTY_SCORES: Record<string, number> = {
  beginner: 1,
  easy: 2,
  intermediate: 3,
  hard: 4,
  expert: 5,
};
