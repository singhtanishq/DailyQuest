import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * APIs pool — design decisions: pagination, idempotency, versioning,
 * rate limiting and webhooks, each with defensible trade-offs.
 */

export const apiTemplates: QuestTemplate[] = [
  openChallenge({
    id: 'api.cursor-pagination',
    category: 'apis',
    challengeType: 'api',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['pagination', 'cursors'],
    tags: ['pagination', 'design'],
    skills: ['Collection design'],
    subcategories: ['design'],
    title: 'The Drifting Offset',
    subtitle: 'Offset pagination lies when rows move.',
    description: 'Design pagination that survives inserts between pages.',
    question:
      'A feed endpoint uses `?page=3&limit=20`. During heavy traffic, new posts constantly appear and clients report duplicates and missing items. Explain why offset pagination fails here, then design cursor-based pagination for it: the cursor contents, the query shape, and how clients handle "next".',
    guidance: [
      'Show the duplicate/miss mechanism with a concrete insert-between-pages example.',
      'Define the cursor: opaque, ordered by a stable tie-broken key.',
      'Address sorting requirements at the storage layer.',
    ],
    solution: {
      summary:
        'Offset skips by position, so an insert between requests shifts every later row: page 3 re-shows or skips items. A cursor encodes the last-seen sort key (created_at, id) and the next page is WHERE (created_at, id) < cursor ORDER BY created_at DESC, id DESC LIMIT 20 — position-independent and stable. Cursors should be opaque (base64 of the key pair) with an explicit next_cursor in the response; the index (created_at, id) makes the seek O(log n).',
      reasoning: [
        'Offset cost grows linearly (OFFSET 100000 reads 100k rows) while cursor seek is logarithmic.',
        'Ties must be broken by a unique column or rows can be skipped at boundaries.',
        'Jump-to-page-N is genuinely impossible with cursors — that is the trade you accept.',
      ],
      commonMistakes: [
        'Encoding the offset in base64 and calling it a cursor.',
        'Cursoring over a non-unique sort key without a tiebreaker.',
      ],
    },
    hints: ['Insert a row between two page requests and trace what page 3 returns.', 'What must the WHERE clause express to continue where the last page stopped?'],
    objectives: ['Diagnose offset pagination drift', 'Design stable keyset pagination'],
  }),

  openChallenge({
    id: 'api.idempotency-keys',
    category: 'apis',
    challengeType: 'api',
    difficulty: 'hard',
    minutes: 25,
    concepts: ['idempotency', 'retries'],
    tags: ['idempotency', 'reliability'],
    skills: ['Safe write design'],
    subcategories: ['reliability'],
    title: 'The Double Charge',
    subtitle: 'One timeout, two payments.',
    description: 'Design idempotency keys for unsafe methods and specify the whole contract.',
    question:
      'A payment POST times out at the client; the client retries and the user is charged twice. Design the idempotency-key contract: where the key lives, server-side storage and lookup semantics, what the server returns on a replayed key with the same vs a different payload, and how long keys should be retained.',
    guidance: [
      'Specify the request header and key generation rules.',
      'Define the server’s store: key → response snapshot, request fingerprint.',
      'State replay behaviour for matching, mismatching, and in-flight requests.',
    ],
    solution: {
      summary:
        'The client generates a UUID per logical operation and sends it in an Idempotency-Key header on every retry. The server records key → (request fingerprint, response status/body) atomically with the operation — ideally in the same transaction. A replayed key with the SAME fingerprint returns the stored response (even an error) instead of re-executing; a DIFFERENT fingerprint is a client bug and gets 422; a request still in flight gets 409 or a Retry-After. Retain keys long enough to exceed the client’s retry horizon (24h is typical).',
      reasoning: [
        'The race that must be handled: two concurrent requests with the same key — unique constraint or lock decides the winner.',
        'Storing the response (not just a flag) makes retries truly side-effect-free, including error responses.',
        'Stripe-style APIs follow exactly this contract; clients must regenerate keys per USER OPERATION, not per retry.',
      ],
      commonMistakes: [
        'Generating a fresh UUID for each retry attempt — that defeats the mechanism.',
        'Recording the key after the operation instead of atomically with it.',
      ],
    },
    hints: ['Where must the key → result record be written to survive crashes between execute and respond?', 'What should happen if the same key arrives with a different body?'],
    objectives: ['Design the full idempotency contract', 'Handle concurrent-replay races'],
  }),

  quizChallenge({
    id: 'api.versioning-strategy',
    category: 'apis',
    challengeType: 'api',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['versioning', 'compatibility'],
    tags: ['versioning'],
    skills: ['Compatibility management'],
    subcategories: ['design'],
    title: 'The Breaking Field',
    subtitle: 'When removing a field becomes an incident.',
    description: 'Choose a versioning strategy and know what a breaking change is.',
    question:
      'Which change to a REST API response is NOT breaking for tolerant clients?',
    options: [
      'Adding a new optional field to a response',
      'Renaming an existing response field',
      'Changing a field’s type from string to number',
      'Removing a documented field',
    ],
    optionExplanations: [
      'Correct: new members are additive; tolerant readers ignore unknown fields (the Postel/robustness principle in practice).',
      'Renaming removes the old name — every client reading it breaks.',
      'Type changes break parsing and validation in typed clients.',
      'Removal breaks any client that reads the field, even defensively.',
    ],
    reasoning: [
      'The compatibility rule: additive = safe; renames/removals/retypes = breaking and need a version boundary and deprecation window.',
      'Version location is secondary: /v1/ paths are simplest and most visible; headers are purer but invisible in logs.',
      'A real deprecation needs sunset dates in headers (Deprecation, Sunset) and a documented migration.',
    ],
    hints: ['Which change can every tolerant parser already absorb?', 'Which header pair signals a planned shutdown?'],
    objectives: ['Classify changes by compatibility', 'Plan deprecations deliberately'],
  }),

  quizChallenge({
    id: 'api.rate-limit-response',
    category: 'apis',
    challengeType: 'api',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['rate limiting'],
    tags: ['rate-limiting'],
    skills: ['Client guidance'],
    subcategories: ['reliability'],
    title: 'The Polite Rejection',
    subtitle: '429 with instructions.',
    description: 'What a rate-limited response must tell the client.',
    question:
      'A client exceeds your API’s rate limit. What is the correct, most helpful response?',
    options: [
      '429 Too Many Requests, ideally with Retry-After and RateLimit headers describing limits and reset',
      '503 Service Unavailable, since the server refuses to work',
      '200 OK with an error field in the body',
      '403 Forbidden, treating the client as banned',
    ],
    optionExplanations: [
      'Correct: 429 exists for exactly this; Retry-After (seconds or date) tells the client when to try, and RateLimit/RateLimit-Remaining expose the budget.',
      '503 means the SERVICE is unavailable — rate limiting is a policy response to this client, not a service outage.',
      '200 hides the failure from status-based clients and breaks monitoring.',
      '403 implies authorization denial; the client is authorized, just too fast.',
    ],
    reasoning: [
      'Machine-readable limits let well-behaved clients self-throttle instead of hammering.',
      'Exponential backoff with jitter should still be implemented client-side — Retry-After is the server’s floor, not a substitute.',
    ],
    hints: ['Which status code was added specifically for throttling?', 'Which header carries "seconds until you may retry"?'],
    objectives: ['Return actionable throttling responses', 'Expose budget headers'],
  }),

  openChallenge({
    id: 'api.error-shape',
    category: 'apis',
    challengeType: 'api',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['error design', 'http semantics'],
    tags: ['errors', 'design'],
    skills: ['API ergonomics'],
    subcategories: ['design'],
    title: 'The Unhelpful 400',
    subtitle: 'One error shape to debug them all.',
    description: 'Design a machine-readable, human-helpful error envelope.',
    question:
      'Every 4xx/5xx from your API currently returns `{"error": "something went wrong"}`. Design a consistent error envelope: required members, how validation failures list multiple field errors, how clients distinguish retryable from permanent failures, and why status codes still matter alongside the body.',
    guidance: [
      'Base the shape on RFC 9457 (problem details) or justify a deviation.',
      'Define the members: type, title, status, detail, instance, errors[].',
      'Separate "who caused it" (4xx/5xx) from "can it be retried".',
    ],
    solution: {
      summary:
        'Adopt RFC 9457 problem details: {type (stable machine identifier), title (short human summary), status (mirrors HTTP status), detail (human explanation), instance (request path/id), plus an extension member for per-field validation errors}. Clients branch on status for retryability (5xx and 429 retryable; 4xx generally not) and on type for handling specific cases. Status codes matter because proxies, monitors and libraries act on them without parsing bodies.',
      reasoning: [
        'A stable `type` URI lets clients write switch statements that survive wording changes.',
        'instance/request-id ties the error to logs — the field support will thank you.',
        'Never bury authentication failures in 200s: it breaks caches, monitors and client SDKs.',
      ],
      commonMistakes: [
        'Changing error body wording clients regex-match on — keep human text out of contracts.',
        'Returning arrays of errors at the top level inconsistently across endpoints.',
      ],
    },
    hints: ['There is an RFC for exactly this problem — name it.', 'What do intermediaries (caches, LBs) act on: status or body?'],
    objectives: ['Design RFC 9457-based errors', 'Keep machines and humans both served'],
  }),

  openChallenge({
    id: 'api.webhook-reliability',
    category: 'apis',
    challengeType: 'api',
    difficulty: 'hard',
    minutes: 25,
    concepts: ['webhooks', 'at-least-once delivery'],
    tags: ['webhooks', 'reliability'],
    skills: ['Event delivery design'],
    subcategories: ['reliability'],
    title: 'The Missing Delivery',
    subtitle: 'Your webhook will fail — design for it.',
    description: 'Design a webhook system with retries, signatures and idempotent consumers.',
    question:
      'Your SaaS must notify customer systems via webhooks. Design delivery: retry policy and backoff, event signing so receivers can verify origin, ordering expectations you must document, and what receivers must do because you will deliver at-least-once.',
    guidance: [
      'Define the retry schedule and terminal failure handling.',
      'Specify signing (HMAC over timestamp + body) and replay protection.',
      'State the delivery guarantees honestly: at-least-once, unordered.',
    ],
    solution: {
      summary:
        'Deliver at-least-once with exponential backoff (e.g. 1m, 5m, 30m, 2h … up to 24h), then park the event for manual replay. Sign each delivery: HMAC-SHA256 over the raw body plus a timestamp, sent in a header; receivers reject messages older than a few minutes to kill replays. Because retries and concurrent events make order unguaranteed, every event carries a unique id and receivers must deduplicate on it and treat events as independent facts (or version them with sequence data where order matters).',
      reasoning: [
        'Retries save you from receiver deploys and blips; parking after terminal failure avoids infinite retry loops.',
        'Signing with a timestamp proves origin AND freshness — a bare signature is replayable forever.',
        'At-least-once is the honest guarantee: exactly-once delivery is a receiver-side dedup property, not a network property.',
      ],
      commonMistakes: [
        'Delivering unordered and assuming receivers cope without documented semantics.',
        'Signing only the body — replays become undetectable.',
      ],
    },
    hints: ['What is the strongest guarantee a distributed delivery system can honestly make?', 'How does a receiver prove a webhook came from you AND is recent?'],
    objectives: ['Design webhook delivery end to end', 'Push idempotency to the receiver contract'],
  }),

  quizChallenge({
    id: 'api.auth-flow-choice',
    category: 'apis',
    challengeType: 'cybersecurity',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['authentication', 'oauth'],
    tags: ['auth', 'security'],
    skills: ['Credential selection'],
    subcategories: ['auth'],
    title: 'The Credential Menu',
    subtitle: 'Match the client to the flow.',
    description: 'API keys, client-credentials OAuth and authorization-code flows serve different actors.',
    question:
      'A third-party BACKEND service calls your API on behalf of itself (not a user). Which credential design fits best?',
    options: [
      'OAuth 2.0 client credentials flow: the service authenticates with its own client id/secret (or private key JWT) and receives a short-lived access token',
      'A shared API key embedded in the third party’s mobile app',
      'The authorization-code flow, with a redirect through a user’s browser',
      'Basic auth with a global username and password',
    ],
    optionExplanations: [
      'Correct: client credentials is machine-to-machine authentication with no user context — tokens are short-lived and scoped.',
      'A key in a mobile app is public the moment it ships; anything in client code is attacker-visible.',
      'Authorization code flow exists for USER-delegated access; there is no user here.',
      'Basic auth over long-lived shared secrets has no expiry, no scoping and no revocation story.',
    ],
    reasoning: [
      'Pick by actor: user present → authorization code (+PKCE); no user, server-to-server → client credentials; truly trivial integrations → signed static keys with rotation.',
      'Short-lived tokens bound the damage of leakage; rotation and scopes bound blast radius.',
    ],
    hints: ['Is there a human in the loop at all?', 'What happens when a long-lived shared secret leaks?'],
    objectives: ['Match flows to actors', 'Reason about token lifetime and scope'],
  }),
];
