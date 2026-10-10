import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Architecture pool — trade-off questions with positions to defend.
 */

export const architectureTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'arch.monolith-vs-services',
    category: 'architecture',
    challengeType: 'architecture',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['architecture styles'],
    tags: ['architecture'],
    skills: ['Structural decision-making'],
    subcategories: ['styles'],
    title: 'The Modular Monolith Moment',
    subtitle: 'When do microservices actually pay?',
    description: 'Choose the architecture that matches the org, not the conference talks.',
    question:
      'A 12-engineer team ships a B2B product with one deployment per week. Which architecture argument is the strongest for their stage?',
    options: [
      'A modular monolith: one deployable with strict internal module boundaries, split into services only when team scale or scaling profiles demand it',
      'Microservices from day one, so the architecture never needs migration',
      'A single-file script, since 12 engineers is small',
      'Serverless functions for every operation, since services are outdated',
    ],
    optionExplanations: [
      'Correct: microservices buy independent scaling and team autonomy — costs (distributed debugging, data consistency, operational surface) that pay off with many teams, not with one deployable worth of complexity.',
      'Day-one microservices distribute a monolith’s coupling over the network: shared database, chatty calls, and every feature touching five repos.',
      ' straw man — the choice is about module boundaries, not file counts.',
      'Function-per-operation has real costs (cold starts, orphaned distributed state) that must be justified per workload.',
    ],
    reasoning: [
      'Conway’s law: architecture mirrors communication paths; one team argues for one deployable with clean seams.',
      'Migration cost from modular monolith to services is real but predictable — extract along the seams you maintained.',
      'The signal to split: divergent scaling profiles, independent release cadences, or team ownership boundaries.',
    ],
    hints: ['What does the team actually need: independent scaling or simpler operations?', 'What do module boundaries cost to maintain versus service boundaries?'],
    objectives: ['Match architecture to org scale', 'Preserve extraction seams'],
  }),

  openChallenge({
    id: 'arch.outbox-pattern',
    category: 'architecture',
    challengeType: 'architecture',
    difficulty: 'hard',
    minutes: 25,
    concepts: ['distributed transactions', 'outbox pattern'],
    tags: ['events', 'consistency'],
    skills: ['Consistency design'],
    subcategories: ['integration'],
    title: 'The Double-Write Problem',
    subtitle: 'One transaction, two systems, no lies.',
    description: 'Publish events reliably from a transactional service.',
    question:
      'An order service writes to PostgreSQL and must publish an `order.created` event to Kafka. Doing both "in one operation" is impossible — a crash between them loses or orphans events. Design the outbox solution and explain how consumers tolerate duplicates.',
    guidance: [
      'Show why commit-then-publish and publish-then-commit both fail.',
      'Design the outbox table, relay, and delivery semantics.',
      'Specify the consumer-side contract that makes at-least-once safe.',
    ],
    solution: {
      summary:
        'Write the event into an outbox TABLE inside the same PostgreSQL transaction as the order row; a relay (poller or CDC/log-based) reads new outbox rows and publishes to Kafka, marking rows sent. Crash between commit and publish? The relay still finds the row. Relay publishes twice? Kafka delivers at-least-once, so consumers deduplicate on event id (or process idempotently by natural key + version). The guarantee: no committed state change goes unpublished, and duplicates are bounded and detectable.',
      reasoning: [
        'The atomicity unit is the database transaction — so the event must live inside it.',
        'Polling relays are simple with second-level latency; log-based CDC (Debezium) is lower-latency and avoids extra load, at operational cost.',
        'Outbox rows are pruned after confirmation to keep the table small.',
      ],
      commonMistakes: [
        'Marking rows sent BEFORE the broker acknowledges — the exact gap the pattern closes.',
        'Assuming Kafka transactions remove consumer dedup needs across service boundaries.',
      ],
    },
    hints: ['Which system can commit atomically with the state change?', 'What does the consumer need to survive a double publish?'],
    objectives: ['Close the dual-write gap', 'Specify at-least-once consumer duties'],
  }),

  quizChallenge({
    id: 'arch.sync-vs-async-integration',
    category: 'architecture',
    challengeType: 'architecture',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['integration styles'],
    tags: ['integration'],
    skills: ['Coupling analysis'],
    subcategories: ['integration'],
    title: 'The Coupling Ledger',
    subtitle: 'Request/response or events — who waits?',
    description: 'Choose integration styles by coupling and latency needs.',
    question:
      'Order checkout must (a) charge the card and return success/failure to the customer, and (b) update the recommendations service. Which integration pairing is right?',
    options: [
      '(a) synchronous request/response — the customer waits on the outcome; (b) asynchronous event — recommendations must not block checkout',
      'Both synchronous: consistency demands it',
      'Both asynchronous: queues solve everything',
      '(a) asynchronous with eventual confirmation; (b) synchronous polling',
    ],
    optionExplanations: [
      'Correct: the call whose ANSWER the user needs is synchronous; the downstream consumer that merely reacts is event-driven — temporal decoupling keeps checkout alive when recommendations is down.',
      'Synchronous (b) couples checkout’s latency and availability to a non-critical service — a classic outage amplifier.',
      'Queues cannot return the payment result the customer is staring at.',
      'Payments need a definitive answer in the request path; polling the recommendations service inverts the dependency.',
    ],
    reasoning: [
      'Decision rule: does the caller need the answer NOW? Yes → sync. No → async event.',
      'Events trade immediate consistency for resilience; that trade is correct exactly when the caller does not consume the result.',
      'Eventual consistency must be visible and bounded — document propagation expectations.',
    ],
    hints: ['Which of the two operations produces data the customer sees?', 'What happens to checkout when recommendations has a bad deploy?'],
    objectives: ['Apply the sync/async decision rule', 'Protect critical paths from optional dependencies'],
  }),

  openChallenge({
    id: 'arch.strangler-migration',
    category: 'architecture',
    challengeType: 'architecture',
    difficulty: 'hard',
    minutes: 25,
    concepts: ['migration', 'strangler fig'],
    tags: ['migration'],
    skills: ['Incremental migration'],
    subcategories: ['evolution'],
    title: 'The Slow Replacement',
    subtitle: 'Migrate without a big-bang cutover.',
    description: 'Replace a legacy module incrementally behind a facade.',
    question:
      'A 300k-line monolith contains a pricing module that must be rewritten. Design a strangler-fig migration: routing, coexistence of old and new logic, verification of equivalence, rollback, and the completion criteria. What makes this safer than a rewrite-and-switch?',
    guidance: [
      'Define the facade/routing layer and traffic shifting.',
      'Design shadow/dual-run verification before real cutover.',
      'Specify rollback and the done criteria.',
    ],
    solution: {
      summary:
        'Put a routing facade in front of pricing calls. Migrate endpoint-by-endpoint or customer-segment-by-segment: new implementation serves an increasing traffic percentage while the old one stays warm. During migration, run the new path in shadow mode — execute both, compare outputs, alert on divergence — before shifting real traffic. Each step is reversible by moving the route back; done means 100% of traffic, no divergence over a soak period, and old code deleted (not just unrouted). This is safer than big-bang because every step is production-tested and reversible, and risk scales with percentage, not with launch day.',
      reasoning: [
        'Shadow traffic surfaces behavioral drift (rounding, edge cases) with zero customer impact.',
        'Segment-based rollout (internal users → 1% → 50% → 100%) bounds blast radius per step.',
        'The hardest part is data: pricing rules duplicated across systems need a source-of-truth decision per artifact.',
      ],
      commonMistakes: [
        'Leaving the old module "temporarily" forever — completion must include deletion.',
        'Comparing outputs by reference equality when legitimate nondeterminism exists (timestamps) — compare semantically.',
      ],
    },
    hints: ['What runs before real traffic moves, and what does it compare?', 'What is the rollback action at any point in the migration?'],
    objectives: ['Stage a strangler migration', 'Verify equivalence with shadow runs'],
  }),

  openChallenge({
    id: 'arch.data-ownership',
    category: 'architecture',
    challengeType: 'architecture',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['service boundaries', 'data ownership'],
    tags: ['data', 'services'],
    skills: ['Boundary design'],
    subcategories: ['boundaries'],
    title: 'The Shared Database Taboo',
    subtitle: 'Who owns the orders table?',
    description: 'Establish data ownership across service boundaries.',
    question:
      'Three services (orders, shipping, analytics) all read order data. Today they share one PostgreSQL database and join freely. A proposal splits them into services with separate databases. What problems does the shared database cause at scale, what replaces cross-service joins, and when is the split actually worth it?',
    guidance: [
      'Name the coupling problems: schema changes, migration locks, blast radius.',
      'Describe the replacements: APIs, replicated read models, event-fed projections.',
      'State the honest cost/benefit for this specific team size.',
    ],
    solution: {
      summary:
        'A shared database couples services at the schema level: every migration is cross-team, one bad query degrades everyone, and ownership of tables becomes ambiguous. The replacements: (1) synchronous API reads for real-time needs; (2) event-fed local projections — shipping runs its own read model of order events; (3) the analytics service consumes the event stream into a warehouse. The split is worth it when teams deploy independently and failure domains must isolate; for small teams it adds cross-service consistency work that a modular monolith with schema ownership rules avoids.',
      reasoning: [
        'The database is the real API in shared-database architectures — schema is contract.',
        'Projections trade join simplicity for eventual consistency and replication lag — visible and usually acceptable for reads.',
        'Aggregate boundaries should follow ownership: one writer per data set, everyone else through APIs or events.',
      ],
      commonMistakes: [
        'Splitting the database but keeping distributed joins in application code — the coupling moved, not left.',
        'Events as an afterthought: without them, every consumer becomes a synchronous caller.',
      ],
    },
    hints: ['What happens to a migration when four teams’ code touches one table?', 'Which service genuinely needs real-time order data?'],
    objectives: ['Argue ownership boundaries', 'Replace joins with contracts'],
  }),
];
