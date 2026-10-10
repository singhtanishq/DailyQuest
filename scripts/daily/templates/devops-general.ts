import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * DevOps + general tech pools — deployment strategy, CI/CD discipline, and
 * the cross-cutting fundamentals (floats, time, encodings) that quietly
 * produce production incidents.
 */

export const devopsTemplates: QuestTemplate[] = [
  openChallenge({
    id: 'devops.blue-green-vs-canary',
    category: 'devops',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['deployment strategies'],
    tags: ['deployments'],
    skills: ['Release engineering'],
    subcategories: ['deployments'],
    title: 'The Rollout Decision',
    subtitle: 'Blue-green or canary for which change?',
    description: 'Match deployment strategies to change risk profiles.',
    question:
      'You deploy twice a week: (a) a routine internal refactor with identical behavior, (b) a new checkout flow touching payment code. Compare blue-green and canary deployments: mechanics, cost, what each protects against, and which you would choose for (a) and (b) — including the database-compatibility constraint both share.',
    guidance: [
      'Define both strategies mechanically.',
      'Name the failure class each catches (and the one it misses).',
      'State the schema-migration rule that underpins both.',
    ],
    solution: {
      summary:
        'Blue-green runs two full environments and flips traffic atomically — instant rollback, but 100% of users see the new version the moment it flips, and it costs double capacity. Canary shifts a small percentage first and watches metrics — it catches behavioral regressions statistically, at the cost of slower rollout and routing complexity. For (a), blue-green (or rolling) is proportionate: behavior is unchanged, so the flip is the test. For (b), canary: watch error rates, payment success rates and latency at 1% → 5% → 25% before full rollout. Both require backward-compatible database migrations: deploy schema first (additive, nullable, backfilled), code second, cleanup third.',
      reasoning: [
        'Blue-green’s atomic flip is also its blind spot: no partial exposure means no statistical signal.',
        'Canary requires meaningful metrics and routing; without observability it is theater.',
        'The expand-contract migration pattern is what makes either strategy safe with state.',
      ],
      commonMistakes: [
        'Canarying with no alerting on the affected metrics — the canary dies silently.',
        'Deploying incompatible schema changes under either strategy and discovering it at rollback time.',
      ],
    },
    hints: [
      'Which strategy gives you a statistical early warning?',
      'What must be true of the schema for rollback to be safe?',
    ],
    objectives: ['Choose strategies per change risk', 'Apply expand-contract migrations'],
  }),

  quizChallenge({
    id: 'devops.ci-cd-boundary',
    category: 'devops',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['ci/cd'],
    tags: ['ci', 'pipelines'],
    skills: ['Pipeline design'],
    subcategories: ['pipelines'],
    title: 'The Pipeline Stages',
    subtitle: 'What runs on every push, and what does not.',
    description: 'Place work in the CI/CD pipeline correctly.',
    question:
      'Which set of checks belongs on EVERY pull request and push (fast, deterministic, no external state)?',
    options: [
      'Install from lockfile, lint, typecheck, unit tests, data validation, production build',
      'Full end-to-end suite against production data',
      'Manual QA sign-off gates',
      'Load testing at 10× expected traffic',
    ],
    optionExplanations: [
      'Correct: CI stages must be fast, deterministic and hermetic — minutes, not hours, so feedback stays usable.',
      'E2E against production data is slow, flaky and reads/writes real state — a nightly or dedicated-environment job at most.',
      'Manual gates do not belong on every push; they belong before releases.',
      'Load tests are scheduled or pre-release jobs — far too heavy per push.',
    ],
    reasoning: [
      'CI economics: the pipeline runs on every change, so per-run cost × frequency dominates — keep the fast lane tight.',
      'npm ci (not install) makes CI reproducible from the lockfile.',
      'Fail the build on any red stage; never merge past red.',
    ],
    hints: [
      'What is the cost budget for a per-push pipeline?',
      'Which stages need external state or long durations?',
    ],
    objectives: ['Design the fast CI lane', 'Separate scheduled heavy checks'],
  }),
];

export const generalTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'general.float-equality',
    category: 'general_tech',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['floating point'],
    tags: ['floating-point'],
    skills: ['IEEE-754 awareness'],
    subcategories: ['numbers'],
    title: 'The Almost Equal Sum',
    subtitle: 'Why 0.1 + 0.2 !== 0.3.',
    description: 'Binary fractions, decimal expectations, and the correct comparison.',
    question:
      'In JavaScript, `0.1 + 0.2 === 0.3` is false. What is the correct general way to compare computed floating-point values?',
    options: [
      'Compare with a small tolerance relative to magnitude: Math.abs(a - b) < epsilon',
      'Round both values to integers before every comparison',
      'Use === but always write literals in the same order',
      'Parse the numbers as strings and compare lexically',
    ],
    optionExplanations: [
      'Correct: floats represent binary approximations; equality must be approximate, with epsilon scaled to the values involved (Number.EPSILON is for values near 1).',
      'Rounding changes semantics and still fails at larger magnitudes.',
      'Operand order does not change representation quality.',
      'String comparison of numbers is wrong for magnitude (and does not fix representation).',
    ],
    reasoning: [
      '0.1 and 0.2 have no exact binary representation; their sum is the nearest double to 0.30000000000000004.',
      'Absolute epsilon fails across scales — a relative tolerance (or decimal/cents arithmetic for money) is the robust rule.',
      'Money: never store floats; use integer minor units.',
    ],
    hints: [
      'Which numbers CAN binary floats represent exactly?',
      'Why does a fixed epsilon fail at 1e10?',
    ],
    objectives: ['Explain representation error', 'Compare floats correctly'],
  }),

  openChallenge({
    id: 'general.timezone-storage',
    category: 'general_tech',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['time handling', 'timezones'],
    tags: ['dates'],
    skills: ['Temporal correctness'],
    subcategories: ['time'],
    title: 'The Midnight Meeting',
    subtitle: 'Store instants, keep rules separate.',
    description: 'Design correct timestamp storage and rendering.',
    question:
      'Your app schedules meetings. A user in Berlin creates a 09:00 meeting; users in Tokyo and New York must see it at the correct local time; DST changes twice a year. Specify exactly what to STORE, what to STORE SEPARATELY for the "09:00 Berlin" intent, and how to render. What breaks when you store local wall-clock strings?',
    guidance: [
      'Separate the instant (UTC) from the civil-time intent (zone + local time).',
      'Explain DST arithmetic and why naive date math drifts.',
      'Name the failure mode of storing "2026-03-29T09:00:00" without a zone.',
    ],
    solution: {
      summary:
        'Store the absolute instant in UTC (e.g. ISO 8601 with Z) for ordering and math, AND the civil intent — the IANA zone plus the local wall time — when the event is defined as "09:00 in Berlin" (it must stay 09:00 Berlin across DST shifts, which means the UTC instant MOVES). Render with the viewer’s zone via a real timezone database (Intl/Temporal). Storing bare local strings loses the zone, makes ordering ambiguous, and silently breaks at DST boundaries — an hour of ambiguity per year, forever.',
      reasoning: [
        'Two different requirements exist: "same moment" (store UTC) and "same local time" (store zone + local time, recompute the instant).',
        'DST transitions create nonexistent and ambiguous local times — libraries (Temporal, date-fns-tz, pytz) encode the rules; hand-rolled offsets do not.',
        'Server default timezones are a classic incident source: configure explicitly, never rely on the host.',
      ],
      commonMistakes: [
        'Adding 86400000 ms for "tomorrow" across a DST boundary — the result is 23:00 or 01:00.',
        'Storing timestamps as local strings in the DB and sorting them lexicographically across zones.',
      ],
    },
    hints: [
      'Does "09:00 Berlin daily" have a fixed UTC instant?',
      'What is ambiguous about 2026-10-25T02:30 in Berlin?',
    ],
    objectives: ['Separate instants from civil time', 'Delegate DST arithmetic to real tz data'],
  }),

  quizChallenge({
    id: 'general.utf8-basics',
    category: 'general_tech',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['encodings', 'unicode'],
    tags: ['encodings'],
    skills: ['Encoding literacy'],
    subcategories: ['encodings'],
    title: 'The Mangled cafÃ©',
    subtitle: 'One encoding read as another.',
    description: 'Diagnose the classic double-encoding artifact.',
    question: 'A page shows `cafÃ©` where `café` was stored. What happened, and what is the fix?',
    options: [
      'UTF-8 bytes were decoded as Latin-1 (or Windows-1252) somewhere in the chain — fix by declaring/honoring UTF-8 consistently end to end',
      'The database truncated the string to a byte limit',
      'The accented é is invalid in UTF-8',
      'The browser needs a font that supports é',
    ],
    optionExplanations: [
      'Correct: é is two UTF-8 bytes (0xC3 0xA9); reading them as Latin-1 yields Ã© — the artifact is a decode mismatch, not data loss.',
      'Truncation would cut the string short, not produce plausible accented characters.',
      'é is perfectly valid UTF-8 — it is the interpretation that is wrong.',
      'A missing font shows boxes (tofu), never re-encoded lookalike characters.',
    ],
    reasoning: [
      'Every layer declares (or assumes) an encoding: DB column, connection charset, HTTP Content-Type, file reads, JSON parsers.',
      'The artifact itself is diagnostic: C3 A9 → Ã© is the signature of UTF-8-read-as-Latin1.',
      'The fix is consistency at every hop, and byte-preserving repair (re-encode mojibake back through the wrong decoder) only when data was already corrupted.',
    ],
    hints: [
      'How many bytes does é occupy in UTF-8, and what do those bytes render as in Latin-1?',
      'Which layer in the storage chain lacked a UTF-8 declaration?',
    ],
    objectives: ['Diagnose mojibake signatures', 'Enforce UTF-8 across the stack'],
  }),
];
