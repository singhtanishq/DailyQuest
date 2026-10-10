import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Performance pool — practical engineering: N+1, complexity accidents,
 * caching, bundles, waterfalls and index usage.
 */

export const performanceTemplates: QuestTemplate[] = [
  openChallenge({
    id: 'perf.n1-queries',
    category: 'performance',
    challengeType: 'performance',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['n+1 queries', 'eager loading'],
    tags: ['databases', 'orm'],
    skills: ['Query pattern analysis'],
    subcategories: ['databases'],
    title: 'The 201-Query Page',
    subtitle: 'One list, two hundred follow-ups.',
    description: 'Diagnose and fix the ORM N+1 pattern.',
    question:
      'A page listing 200 orders renders each order’s customer name. The ORM code looks clean: `orders.map(o => render(o, o.customer.name))` — yet the DB logs 201 queries. Explain exactly why, then fix it two ways (eager loading and an explicit join), and state when each fix wins.',
    guidance: [
      'Trace the lazy-loading mechanism that produces one query per row.',
      'Compare preload/eager-loading vs a single joined query.',
      'Name the measurement that proves the fix (query count, latency).',
    ],
    solution: {
      summary:
        'The customer association is lazy: the first access of o.customer inside the map fires SELECT … WHERE id = ? per order — 200 follow-ups plus the list query. Eager loading (INCLUDE/with/preload of customer) issues two queries and stitches the relation in memory; an explicit JOIN returns one flat result set. Eager loading wins for one-level relations and keeps the ORM ergonomics; joins win for deep graphs, aggregations or enormous row counts where shipping two big sets is wasteful.',
      reasoning: [
        'ORMs defer relation loads to attribute access — invisible in code, visible in query logs.',
        'Batching variants (IN-lists of 200 ids) are the eager-load implementation under the hood.',
        'The detection habit: log query counts per request, alert on growth proportional to list size.',
      ],
      commonMistakes: [
        'Fixing with per-request caching of customers — still O(n) first-time queries.',
        'Blindly joining everything: over-fetching wide tables outweighs round-trip savings.',
      ],
    },
    hints: ['When exactly is o.customer fetched?', 'What shape does the fixed query count look like: constant or proportional?'],
    objectives: ['Recognize N+1 from symptoms', 'Choose between preloading and joins'],
  }),

  quizChallenge({
    id: 'perf.quadratic-accident',
    category: 'performance',
    challengeType: 'performance',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['complexity accidents'],
    tags: ['complexity'],
    skills: ['Complexity spotting'],
    subcategories: ['complexity'],
    title: 'The Accidental Quadratic',
    subtitle: 'Small n is fine. Then the data grows.',
    description: 'Which innocent-looking loop is quadratic?',
    question:
      'Which snippet degrades quadratically as items grow?',
    options: [
      'const seen = new Set(); for (const id of ids) { if (seen.has(id)) continue; seen.add(id); process(id); }',
      'for (const a of items) { if (others.includes(a.id)) { flagged.push(a); } }',
      'items.forEach((x) => totals.push(x.price * x.qty))',
      'const merged = [...first, ...second]',
    ],
    optionExplanations: [
      'Correct pattern avoidance — this one is linear thanks to the Set.',
      'Correct: others.includes is O(m) inside an O(n) loop → O(n·m), the classic quadratic accident that passes every small-data test.',
      'Pushing to an array per element is amortized O(1) — linear overall.',
      'A single spread is O(n+m) once.',
    ],
    optionExplanationsNote: undefined,
    reasoning: [
      'Nested full scans hide behind clean loop syntax; the array-method version reads like it is "just a filter".',
      'The universal fix: hoist the lookup into a hash-based structure once, then query it per iteration.',
    ],
    hints: ['Find the hidden inner loop.', 'Which operation is O(m) per call on arrays but O(1) on Sets?'],
    objectives: ['Spot hidden inner loops', 'Substitute hash lookups for scans'],
  }),

  openChallenge({
    id: 'perf.cache-strategy',
    category: 'performance',
    challengeType: 'performance',
    difficulty: 'hard',
    minutes: 25,
    concepts: ['caching', 'invalidation'],
    tags: ['caching'],
    skills: ['Cache design'],
    subcategories: ['caching'],
    title: 'The Expensive Leaderboard',
    subtitle: 'Cache it — but what invalidates it?',
    description: 'Design a cache around a hot, expensive query.',
    question:
      'A leaderboard query aggregates 5M rows and is requested 50×/second; results may lag up to one minute. Design the caching layer: what you cache (payload shape), TTL vs explicit invalidation, stampede protection, and how you would monitor hit rate and staleness.',
    guidance: [
      'Choose cache level (in-process vs shared Redis) with justification.',
      'Define TTL, jitter, and single-flight/stampede protection.',
      'Define observability: hit rate, build time, staleness monitoring.',
    ],
    solution: {
      summary:
        'Cache the rendered payload (not the ORM rows) in a shared store (Redis) with a 60s TTL plus jitter, and guard rebuilds with single-flight locking so one builder serves the stampede. TTL alone meets the one-minute staleness budget — explicit invalidation on every score write would be more correct but couples the write path to the read path, so start with TTL and add write-through invalidation for the top-N slice if users notice. Monitor hit rate, rebuild duration, and worst-case staleness (now − payload timestamp).',
      reasoning: [
        'Stampedes are the real risk at 50 rps: an expired key with 50 waiters triggers 50 parallel 5M-row aggregates without locking.',
        'In-process caches multiply misses by instance count and break consistency — shared cache first.',
        'Staleness must be measurable: embed a computed_at in the payload.',
      ],
      commonMistakes: [
        'Caching ORM objects with connections attached — cache the DTO.',
        'Setting TTL without jitter: synchronized expiry recreates the stampede every interval.',
      ],
    },
    hints: ['What happens when the cached entry expires under 50 rps?', 'Where does staleness become visible and testable?'],
    objectives: ['Design TTL + stampede-safe caching', 'Make staleness observable'],
  }),

  quizChallenge({
    id: 'perf.bundle-impact',
    category: 'performance',
    challengeType: 'performance',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['bundle size', 'code splitting'],
    tags: ['web', 'frontend'],
    skills: ['Frontend delivery'],
    subcategories: ['frontend'],
    title: 'The Shrinking Bundle',
    subtitle: 'What actually moves the initial-load needle?',
    description: 'Prioritize bundle optimizations by real impact.',
    question:
      'A React app’s initial bundle is 900 KB (300 KB gzip). Which change MOST reduces time-to-interactive for first-time visitors?',
    options: [
      'Route-based code splitting so the landing route ships only its own chunks',
      'Renaming vendor chunks for better gzip',
      'Replacing all JPEGs with WebP images',
      'Adding preload hints for every script',
    ],
    optionExplanations: [
      'Correct: splitting removes entire feature/dependency graphs from the critical path — often the largest single win for TTI.',
      'Chunk naming changes nothing about bytes transferred.',
      'Images matter for LCP but not for JS time-to-interactive; and this is about the bundle.',
      'Preloading everything forces the browser to fetch the same 900 KB sooner — it can even compete for bandwidth.',
    ],
    reasoning: [
      'TTI is dominated by parse/execute of critical-path JS; the fix is shipping less JS up front.',
      'Tree shaking helps only what is imported; splitting changes WHEN it is imported.',
      'Measure with Lighthouse/bundlesize budgets in CI so regressions are caught at review time.',
    ],
    hints: ['Which bytes does the browser parse before interactive?', 'What does dynamic import change about the dependency graph?'],
    objectives: ['Prioritize optimizations by mechanism', 'Guard bundles with budgets'],
  }),

  openChallenge({
    id: 'perf.render-waterfall',
    category: 'performance',
    challengeType: 'performance',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['waterfalls', 'render blocking'],
    tags: ['web', 'frontend'],
    skills: ['Critical path analysis'],
    subcategories: ['frontend'],
    title: 'The Chained Waterfall',
    subtitle: 'Four sequential round trips before pixels.',
    description: 'Untangle a render-blocking resource chain.',
    question:
      'A page loads: HTML → <link css> → css @import font.css → font.css declares a font URL → text cannot render until the font arrives. Sketch the request waterfall, explain why each link is blocking, and list the concrete fixes (inline critical CSS, preload the font, drop @import) with the order you would apply them.',
    guidance: [
      'Draw the dependency chain and count round trips.',
      'Explain why @import serializes discovery.',
      'Prioritize fixes by (impact ÷ effort).',
    ],
    solution: {
      summary:
        'The chain is HTML → CSS1 → CSS2(@import) → font — four serial dependencies, each discovered only after the previous arrives, so render waits for all four. Fixes in order: (1) replace @import with <link> tags so discovery is parallel; (2) preload the font with <link rel="preload" as="font" crossorigin>; (3) inline the critical CSS in the HTML and defer the rest; (4) font-display: swap so text renders immediately in a fallback face. Expected effect: render no longer waits on the font, and CSS discovery collapses to one hop.',
      reasoning: [
        'Browsers cannot know about @import targets until the importing CSS downloads — serial by construction.',
        'preload breaks the discovery chain for assets you know are needed.',
        'font-display trades brand fidelity for perceived speed — usually the right trade for content.',
      ],
      commonMistakes: [
        'Preloading fonts without crossorigin (double-fetch or failed match).',
        'Inlining ALL CSS — large inline stylesheets cannot be cached and slow every navigation.',
      ],
    },
    hints: ['Which requests can begin only after another finishes?', 'Which fix removes the last hop entirely?'],
    objectives: ['Read and shorten resource waterfalls', 'Apply parallel-discovery fixes'],
  }),

  quizChallenge({
    id: 'perf.index-defeat',
    category: 'performance',
    challengeType: 'performance',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['indexing', 'sargability'],
    tags: ['databases'],
    skills: ['Query plan reasoning'],
    subcategories: ['databases'],
    title: 'The Ignored Index',
    subtitle: 'Wrapping a column in a function hides the index.',
    description: 'Which query fails to use the index on created_at?',
    question:
      'The table orders has an index on created_at. Which query CANNOT use it efficiently?',
    options: [
      'WHERE created_at >= \'2026-01-01\' AND created_at < \'2026-02-01\'',
      'WHERE DATE(created_at) = \'2026-01-15\'',
      'WHERE created_at BETWEEN \'2026-01-15 00:00:00\' AND \'2026-01-15 23:59:59\'',
      'ORDER BY created_at LIMIT 10',
    ],
    optionExplanations: [
      'This is sargable — a direct range the index serves perfectly.',
      'Correct: applying a function to the COLUMN (DATE(created_at)) makes the predicate non-sargable; the planner must evaluate it per row and falls back to a scan. Rewrite as a range on the bare column.',
      'BETWEEN on the bare column is a range scan — index-friendly (mind the inclusive upper bound for sub-second precision).',
      'ORDER BY on the indexed column with LIMIT is the index’s best case.',
    ],
    reasoning: [
      'Sargability rule: indexable predicates reference the bare column; wrap functions around VALUES, never columns.',
      'The rewrite for the DATE case: created_at >= date AND created_at < date + 1 day.',
    ],
    hints: ['Which side of the comparison carries the function?', 'What does the planner need to seek: a computable range or a per-row computation?'],
    objectives: ['Write sargable predicates', 'Rewrite function-wrapped filters as ranges'],
  }),
];
