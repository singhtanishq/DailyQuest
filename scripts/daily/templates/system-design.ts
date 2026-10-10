import { designChallenge, type QuestTemplate } from './framework.js';

/**
 * System design pool — scoped mini-designs with requirements, components,
 * trade-offs and failure modes as first-class answers.
 */

export const systemDesignTemplates: QuestTemplate[] = [
  designChallenge({
    id: 'design.rate-limiter',
    category: 'system_design',
    challengeType: 'system_design',
    difficulty: 'hard',
    minutes: 30,
    concepts: ['rate limiting', 'distributed systems'],
    tags: ['apis', 'reliability'],
    skills: ['Limiting algorithms', 'Distributed state'],
    subcategories: ['infrastructure'],
    title: 'The Traffic Valve',
    subtitle: 'Design a distributed rate limiter.',
    description: 'Limit 100 requests per user per minute across 30 stateless API servers.',
    brief:
      'Design a rate limiter for a public API: 100 requests per user per minute, enforced across 30 stateless API servers behind a load balancer. Over-limit requests receive 429 with Retry-After.',
    requirements: [
      'Limits enforced globally, not per server.',
      'Enforcement adds less than 5 ms to request latency.',
      'Behavior must be predictable under server restarts.',
    ],
    solution: {
      summary:
        'Keep counters in shared storage (Redis) keyed by user + time window; choose fixed windows for simplicity or sliding-window/sliding-log for precision. Each API server checks-and-increments atomically (Lua script or INCR with expiry) — one fast round trip. Local token-bucket caches smooth burstiness but must sync to the global budget periodically.',
      components: [
        'Counter store: Redis with key user:{id}:window:{minuteBucket} and TTL slightly above the window.',
        'Atomic check-and-increment script returning allow/deny plus remaining budget.',
        'Optional per-server local pre-filter (token bucket) to skip the network hop for obvious violations.',
        'Config service distributing limit rules.',
      ],
      dataFlow: [
        'Request arrives with user identity (API key/token).',
        'Server computes window bucket and runs the atomic increment.',
        'Allow → proceed and attach RateLimit headers; deny → 429 with Retry-After derived from window expiry.',
        'Expired keys vanish via TTL; no cleanup job needed.',
      ],
      tradeoffs: [
        'Fixed window is trivially simple but allows 2× bursts across window boundaries; sliding window counts part of the previous bucket — better accuracy at small extra cost.',
        'Redis adds a dependency and one round trip (~1 ms same-region); losing it must fail open or closed as an explicit policy choice.',
        'Per-user keys scale with user count — shard by user id if the keyspace grows.',
      ],
      failureModes: [
        'Redis unavailable: fail open (availability over protection) or closed (protection over availability) — document the choice.',
        'Clock skew between servers: derive buckets from Redis TIME, not app clocks.',
        'Hot-user retry storms after 429: require client backoff and cache 429s briefly at the edge.',
      ],
      scaling:
        'Redis handles ~100k ops/s per node; shard counters by user hash for higher rates. Multi-region needs per-region limits or an async global sync with honest local ceilings.',
    },
    hints: [
      'Where does the counter state live so all 30 servers agree?',
      'What does the client need to back off politely?',
    ],
    objectives: [
      'Choose a limiting algorithm deliberately',
      'Design the failure policy explicitly',
    ],
    discussionPoints: [
      'Fixed vs sliding window under adversarial burst timing.',
      'Fail-open vs fail-closed for different endpoint classes.',
    ],
  }),

  designChallenge({
    id: 'design.url-shortener',
    category: 'system_design',
    challengeType: 'system_design',
    difficulty: 'intermediate',
    minutes: 30,
    concepts: ['key generation', 'redirects'],
    tags: ['design'],
    skills: ['Keyspace design', 'Hot-path optimization'],
    subcategories: ['storage'],
    title: 'The Hundred-Character Service',
    subtitle: 'Design a URL shortener.',
    description: 'Shorten URLs, redirect fast, never collide.',
    brief:
      'Design a URL shortener: shorten arbitrary URLs to ~7-character codes, redirect with minimal latency, support 10k new URLs/minute and 1M redirects/minute.',
    requirements: [
      'Redirect latency under 50 ms p99.',
      'No duplicate codes for distinct URLs; codes unguessable enough to resist enumeration.',
      'Custom aliases must be supported.',
    ],
    solution: {
      summary:
        'Store mapping code → URL in a key-value store. Generate codes from a random 62-alphabet space (62⁷ ≈ 3.5 trillion) with a uniqueness check, or preallocate ranges from a counter for guaranteed uniqueness. The redirect path is a single cache-first lookup: CDN/edge cache for hot codes, Redis for warm, KV store as source of truth. Record analytics asynchronously so redirects never write synchronously.',
      components: [
        'Key generation service (random with collision check, or range allocation).',
        'Key-value store mapping code → target URL (DynamoDB/Vitess-style).',
        'Cache layer (Redis + CDN for hot codes).',
        'Async analytics pipeline consuming click events from a queue.',
      ],
      dataFlow: [
        'POST /shorten validates URL, generates or accepts code, persists mapping.',
        'GET /:code → cache hit serves 301/302 immediately; miss reads store, backfills cache.',
        'Click event pushed to queue; consumers aggregate per code/day.',
      ],
      tradeoffs: [
        '301 vs 302: 301 caches permanently (great latency, but loses click analytics and cannot re-target); 302 keeps control — most shorteners use 302/307.',
        'Random codes resist enumeration but need collision checks; sequential base-62 codes are unique by construction but guessable.',
        'Predictable keys make the service a spam vector: require auth for creation and rate-limit aggressively.',
      ],
      failureModes: [
        'Cache failure falls back to the store — the store must handle full read load.',
        'Range allocator is a single point of serialization; ranges amortize it to one allocation per thousand codes.',
        'Abuse: malicious targets require URL validation and blocklist checks at creation.',
      ],
      scaling:
        'Redirects scale horizontally trivially (stateless + cache). Creation rate is bounded by key generation and store writes — both shard naturally by code prefix.',
    },
    hints: [
      'What is on the hot path: creation or redirect? Optimize that one first.',
      'Why does the redirect probably not want a 301?',
    ],
    objectives: ['Optimize the read-heavy hot path', 'Pick redirect semantics knowingly'],
    discussionPoints: ['Enumeration vs sequential keys.', 'Analytics without slowing redirects.'],
  }),

  designChallenge({
    id: 'design.notification-queue',
    category: 'system_design',
    challengeType: 'system_design',
    difficulty: 'hard',
    minutes: 30,
    concepts: ['queues', 'at-least-once delivery'],
    tags: ['queues', 'reliability'],
    skills: ['Async pipeline design'],
    subcategories: ['infrastructure'],
    title: 'The Patient Postman',
    subtitle: 'Design a notification pipeline.',
    description: 'Deliver email/push notifications reliably without blocking user actions.',
    brief:
      'Design the notification pipeline for an app: order confirmations (email), chat messages (push), and marketing campaigns (batch email). Sending must never block the user action; failures must retry; users must be able to unsubscribe and see their notification history.',
    requirements: [
      'Transactional notifications delivered within seconds.',
      'No lost notifications; duplicates tolerable but rare.',
      'Campaigns of 10M emails must not starve transactional mail.',
    ],
    solution: {
      summary:
        'Producers publish events to a durable queue partitioned by priority (transactional vs bulk). Consumers render templates, resolve preferences (unsubscribe state), and deliver via provider APIs with per-recipient rate limits; failures retry with exponential backoff to a DLQ for review. Dedup on event id; store every send attempt for history. Campaigns flow through a separate consumer pool with lower concurrency so transactional mail keeps its SLA.',
      components: [
        'Producer SDK emitting typed notification events (id, user, template, payload).',
        'Priority-partitioned queue (transactional lane, bulk lane).',
        'Consumer fleet: preference check → render → provider send → record attempt.',
        'DLQ + replay tooling; history store for the user-facing log.',
      ],
      dataFlow: [
        'Order service emits order.confirmed → queue.',
        'Consumer checks preferences, renders, sends, records attempt (status, provider response).',
        'Retry policy: 1m/5m/30m/2h → DLQ; campaigns capped at provider throughput.',
      ],
      tradeoffs: [
        'At-least-once delivery means consumers must dedup on event id — exactly-once is a lie at this layer.',
        'Separate lanes cost more infrastructure but protect the transactional SLA from bulk floods.',
        'Template rendering in consumers centralizes changes but couples sends to template bugs — version templates.',
      ],
      failureModes: [
        'Provider outage: retries absorb minutes-long blips; DLQ + replay covers longer ones.',
        'Duplicate sends after consumer crash mid-send: dedup window per event id.',
        'Poison event crashing consumers: schema validation at produce time plus DLQ.',
      ],
      scaling:
        'Consumers scale horizontally; per-recipient rate limits are the true ceiling. Bulk lanes scale by adding consumers until the email provider is the bottleneck.',
    },
    hints: [
      'What guarantee can the queue honestly make about delivery counts?',
      'How do bulk campaigns avoid starving order confirmations?',
    ],
    objectives: ['Separate hot and bulk traffic', 'Design dedup and DLQ flows'],
    discussionPoints: [
      'Exactly-once is a receiver-side property.',
      'Template versioning strategy.',
    ],
  }),

  designChallenge({
    id: 'design.feature-flags',
    category: 'system_design',
    challengeType: 'system_design',
    difficulty: 'intermediate',
    minutes: 25,
    concepts: ['feature flags', 'configuration'],
    tags: ['design', 'deployments'],
    skills: ['Evaluation design'],
    subcategories: ['infrastructure'],
    title: 'The Kill Switch',
    subtitle: 'Design a feature flag service.',
    description: 'Evaluate flags server-side with low latency and a real kill switch.',
    brief:
      'Design a feature flag service: 200 flags, 10k evaluations/second server-side, p99 evaluation under 2 ms, instant kill switch for a broken feature, and per-user targeting (percentage rollouts, allowlists).',
    requirements: [
      'Evaluation must not add a network hop per request.',
      'Flag changes propagate within seconds.',
      'Audit trail: who changed what, when.',
    ],
    solution: {
      summary:
        'Push, don’t poll: an admin UI writes flags to a store and publishes a snapshot (versioned JSON) to a CDN/redis pub-sub; SDKs in each service hold the snapshot in memory and evaluate locally — no per-request hop. Targeting rules (percent by stable user hash, allowlists) evaluate in-memory. Kill switch = flipping a flag and bumping the version; propagation is the snapshot push (seconds). Every change appends to an audit log with actor and diff.',
      components: [
        'Admin UI + API writing versioned snapshots.',
        'Snapshot distribution (CDN URL + etag polling, or pub-sub push).',
        'In-process evaluation SDK with deterministic hashing for rollouts.',
        'Audit log store; optional local disk fallback snapshot.',
      ],
      dataFlow: [
        'Change → new snapshot version → publish → SDKs fetch/refresh within seconds.',
        'Request → SDK evaluates flag rules against user context locally.',
        'Percentage rollout: hash(user + flagSalt) % 100 < percent — stable per user across requests.',
      ],
      tradeoffs: [
        'Snapshot polling (1–5s) is simpler and resilient; pub-sub is faster but needs its own reliability story — most teams pick polling with short intervals.',
        'Local evaluation means rules must be expressible as data (no arbitrary code) — a feature and a limitation.',
        'Stale snapshots: SDKs fall back to last-known-good from disk when the CDN errors.',
      ],
      failureModes: [
        'CDN down: SDK serves last snapshot — flags freeze rather than fail.',
        'Hash instability across SDK versions: pin the hashing algorithm per flag.',
        'Flag sprawl: document an expiry/review policy per flag or the inventory becomes archaeology.',
      ],
      scaling:
        'Evaluation scales with your service fleet (it is in-process); the control plane handles human-scale writes. Snapshot size for 200 flags is trivially cacheable.',
    },
    hints: [
      'Where does evaluation happen to keep p99 under 2 ms?',
      'How do percentage rollouts stay stable for the same user?',
    ],
    objectives: ['Design push-based config', 'Make rollouts deterministic'],
    discussionPoints: [
      'Flags as permanent config vs scheduled cleanup.',
      'Multi-region snapshot consistency.',
    ],
  }),

  designChallenge({
    id: 'design.metrics-pipeline',
    category: 'system_design',
    challengeType: 'system_design',
    difficulty: 'hard',
    minutes: 30,
    concepts: ['observability', 'stream aggregation'],
    tags: ['observability'],
    skills: ['Cardinality management'],
    subcategories: ['infrastructure'],
    title: 'The Fleet’s Pulse',
    subtitle: 'Design a metrics pipeline.',
    description: 'Collect, aggregate and serve metrics for 5k service instances.',
    brief:
      'Design metrics collection for a fleet of 5,000 instances emitting 500 metrics each at 10-second intervals. The system must answer range queries for dashboards and alerts, survive instance churn, and keep cardinality under control.',
    requirements: [
      '10-second scrape or push granularity.',
      'Dashboards render last 24h in under 2 seconds; alerts evaluate within a minute.',
      'Total series count stays bounded (label discipline).',
    ],
    solution: {
      summary:
        'Pull-based scraping (Prometheus-style): each server exposes /metrics; a scrape fleet assigns targets via service discovery with HA pairs. Local retention 24–48h; downsampling and long-term storage in a TSDB (Thanos/Mimir-style) for months. Alerts evaluate recording rules continuously. Cardinality control lives at emission: label allowlists, no unbounded labels (user ids, request ids), and per-series quotas enforced at ingestion.',
      components: [
        'Instrumentation library exposing counters/gauges/histograms.',
        'Scrape manager with service discovery and target sharding.',
        'TSDB with local + long-term tiers and downsampling rules.',
        'Rules engine for alerts and pre-aggregated dashboards.',
      ],
      dataFlow: [
        'Instance exposes metrics → scraper pulls every 10s → in-memory head block → persisted blocks.',
        'Downsampler writes 1m/5m rollups; dashboards query the coarsest sufficient tier.',
        'Alert rules run against the head block; firing alerts notify Alertmanager → paging.',
      ],
      tradeoffs: [
        'Pull vs push: pull self-discovers dead instances and needs no broker; push survives restrictive networks but complicates backpressure.',
        'Cardinality is the budget: one high-cardinality label multiplies series by its domain size.',
        'Pre-aggregation trades storage for query speed; dashboards should hit recording rules, not raw series.',
      ],
      failureModes: [
        'Scraper loss creates gaps — HA pairs duplicate scrapes; dedup at storage.',
        'Cardinality explosion (one bad label) OOMs the TSDB — quotas and slow-drip rejection protect the fleet.',
        'Alert flapping: require for-duration windows and inhibit cascades.',
      ],
      scaling:
        'Shard scrape targets across scraper fleet; shard TSDB by time + series hash. 25M samples/minute is well within modern TSDB limits when cardinality is disciplined.',
    },
    hints: [
      'Which dimension of metrics data explodes first?',
      'Where should aggregation happen: query time or write time?',
    ],
    objectives: ['Design pull-based collection', 'Engineer cardinality budgets'],
    discussionPoints: ['Pull vs push for serverless targets.', 'Alert fatigue and grouping.'],
  }),
];
