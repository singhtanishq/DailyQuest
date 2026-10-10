import { reviewChallenge, type QuestTemplate } from './framework.js';

/**
 * Code review pool — deliberately flawed snippets with annotated, severitied
 * findings. Bugs are realistic, never ambiguous or contrived.
 */

export const codeReviewTemplates: QuestTemplate[] = [
  reviewChallenge({
    id: 'cr.open-redirect',
    category: 'code_review',
    challengeType: 'code_review',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['open redirect', 'input validation'],
    tags: ['security'],
    skills: ['Security review'],
    subcategories: ['security'],
    title: 'The Helpful Handoff',
    subtitle: 'Login success goes wherever the URL says.',
    description: 'A post-login redirect that trusts a query parameter.',
    language: 'typescript',
    context: 'This runs in an Express-style route handler after successful login.',
    code: `app.get("/login", async (req, res) => {
  const { username, password, redirectTo } = req.query;
  const user = await verifyCredentials(String(username), String(password));
  if (!user) {
    return res.status(401).send("Invalid credentials");
  }
  req.session.userId = user.id;
  res.redirect(String(redirectTo));
});`,
    issues: [
      {
        title: 'Open redirect via redirectTo',
        severity: 'critical',
        explanation:
          'An attacker sends victims a link like /login?redirectTo=https://evil.example/steal; after logging in they land on the attacker’s site. Phishing campaigns and OAuth token theft are built on exactly this.',
        fix: 'Allowlist redirect targets: only relative paths ("/dashboard"), or match redirectTo against a set of known hosts. Reject everything else with a default.',
      },
      {
        title: 'No rate limiting or lockout on credential verification',
        severity: 'major',
        explanation:
          'Unthrottled credential checks enable password spraying and brute force against this endpoint.',
        fix: 'Rate limit per IP and per account, add progressive delays or lockout, and monitor failure spikes.',
      },
      {
        title: 'Query params cast with String() and otherwise unvalidated',
        severity: 'minor',
        explanation:
          'String() hides undefined as "undefined" rather than rejecting the request, and the route silently accepts any shape.',
        fix: 'Validate with a schema (zod/valibot) and return 400 on malformed input.',
      },
    ],
    hints: [
      'Where does redirectTo end up, and who controls it?',
      'What could an attacker gain by choosing the post-login destination?',
    ],
    objectives: ['Spot open redirects in auth flows', 'Design redirect allowlists'],
  }),

  reviewChallenge({
    id: 'cr.sql-concat-review',
    category: 'code_review',
    challengeType: 'code_review',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['sql injection', 'parameterization'],
    tags: ['security', 'databases'],
    skills: ['Injection detection'],
    subcategories: ['security'],
    title: 'The Assembled Search',
    subtitle: 'A WHERE clause built by hand.',
    description: 'A search endpoint that concatenates user input into SQL.',
    language: 'javascript',
    code: `function searchUsers(conn, name, city) {
  let sql = "SELECT id, name, city FROM users WHERE 1=1";
  if (name) sql += " AND name LIKE '%" + name + "%'";
  if (city) sql += " AND city = '" + city + "'";
  return conn.query(sql);
}`,
    issues: [
      {
        title: 'SQL injection through both parameters',
        severity: 'critical',
        explanation:
          'name and city are concatenated into the query grammar. A city value containing a quote terminates the literal and injects arbitrary clauses — full-table reads or destructive statements.',
        fix: 'Use parameterized queries: conn.query("SELECT … WHERE city = ?", [city]) — placeholders keep data out of the grammar entirely.',
      },
      {
        title: 'LIKE pattern is also wildcard-injectable',
        severity: 'minor',
        explanation:
          'Even with parameterization, raw % and _ inside name change the match semantics (searching for "100%" matches everything).',
        fix: 'Escape LIKE metacharacters in the value, or use a parameterized pattern with explicit escapes.',
      },
      {
        title: 'string concatenation defeats query plan caching',
        severity: 'minor',
        explanation:
          'Every distinct input produces a distinct SQL string, so the server cannot reuse prepared statement plans.',
        fix: 'Parameterization again — one prepared statement, many executions.',
      },
    ],
    hints: [
      'Trace the quote characters through the assembled string.',
      'There are two separate problems with the LIKE clause.',
    ],
    objectives: ['Identify injection in assembled SQL', 'Know the LIKE-wildcard nuance'],
  }),

  reviewChallenge({
    id: 'cr.listener-leak',
    category: 'code_review',
    challengeType: 'code_review',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['memory leaks', 'event listeners'],
    tags: ['memory'],
    skills: ['Lifecycle review'],
    subcategories: ['correctness'],
    title: 'The Ever-Growing Bus',
    subtitle: 'A listener added on every render, never removed.',
    description: 'A React component that subscribes on every mount without cleanup.',
    language: 'tsx',
    code: `function WindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", update);
  }, []);

  return <p>{size.w}×{size.h}</p>;
}`,
    issues: [
      {
        title: 'Resize listener is never removed',
        severity: 'major',
        explanation:
          'Every mount adds another listener that closes over a component instance that can never be garbage-collected. Navigating to this route repeatedly accumulates listeners and stale setState calls.',
        fix: 'Return a cleanup from the effect: () => window.removeEventListener("resize", update).',
      },
      {
        title: 'Missing dependency discipline invites the same bug elsewhere',
        severity: 'minor',
        explanation:
          'The effect works only because it captures nothing reactive. The lint rule that enforces cleanup patterns should be treated as an error, not a suggestion.',
        fix: 'Enable eslint react-hooks/exhaustive-deps as an error and review effects for symmetric subscribe/unsubscribe.',
      },
    ],
    improvedCode: {
      language: 'tsx',
      code: `function WindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return <p>{size.w}×{size.h}</p>;
}`,
    },
    hints: [
      'What does the effect return in the broken version?',
      'How many listeners exist after five visits to this page?',
    ],
    objectives: ['Enforce subscribe/unsubscribe symmetry', 'Connect leaks to GC reachability'],
  }),

  reviewChallenge({
    id: 'cr.sync-io-loop',
    category: 'code_review',
    challengeType: 'code_review',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['blocking io', 'async'],
    tags: ['performance'],
    skills: ['Throughput review'],
    subcategories: ['performance'],
    title: 'The Freezing Importer',
    subtitle: 'Blocking reads inside a request loop.',
    description: 'A Node import script that reads files synchronously per row.',
    language: 'javascript',
    code: `async function importRows(file) {
  const rows = parseCsv(await fs.promises.readFile(file, "utf8"));
  for (const row of rows) {
    const meta = JSON.parse(fs.readFileSync(row.metaPath, "utf8"));
    await db.insert(row, meta);
  }
}`,
    issues: [
      {
        title: 'fs.readFileSync inside the event loop',
        severity: 'major',
        explanation:
          'Every synchronous read blocks the entire Node process — other requests, timers and health checks stall for the duration. Under load this manifests as mysterious latency spikes.',
        fix: 'await fs.promises.readFile(row.metaPath, "utf8") — the function is already async.',
      },
      {
        title: 'Sequential awaits when rows are independent',
        severity: 'minor',
        explanation:
          'Row imports do not depend on each other; serializing them multiplies wall-clock time by the row count.',
        fix: 'Batch with a bounded-concurrency map (e.g. p-limit) — unbounded Promise.all can overwhelm the DB.',
      },
    ],
    hints: [
      'What does the event loop do during readFileSync?',
      'Are the row operations order-dependent?',
    ],
    objectives: ['Spot blocking IO in async code', 'Apply bounded concurrency'],
  }),

  reviewChallenge({
    id: 'cr.hardcoded-secret',
    category: 'code_review',
    challengeType: 'security_analysis',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['secrets management'],
    tags: ['security'],
    skills: ['Secrets hygiene'],
    subcategories: ['security'],
    title: 'The Committed Key',
    subtitle: 'The credential that ships with the repo.',
    description: 'A client-side module with the API key inline.',
    language: 'typescript',
    code: `const API_KEY = "sk-live-9f3ab2c7d84e1f6a";

export async function fetchDashboard() {
  const res = await fetch("https://api.example.com/dashboard", {
    headers: { Authorization: \`Bearer \${API_KEY}\` },
  });
  if (!res.ok) throw new Error("Request failed: " + res.status);
  return res.json();
}`,
    issues: [
      {
        title: 'Live secret committed to source',
        severity: 'critical',
        explanation:
          'This file is bundled into client JavaScript — every visitor receives the key, and git history keeps it forever even after removal. It must be rotated immediately; deleting the line is not remediation.',
        fix: 'Rotate the key, purge nothing by hand — instead proxy privileged calls through your backend, which holds the secret in its environment.',
      },
      {
        title: 'Client-side code cannot hold secrets at all',
        severity: 'major',
        explanation:
          'Even "hidden" build-time injection (VITE_ vars) ships in the bundle. Any credential the browser uses is public.',
        fix: 'Treat client-facing APIs as public: authenticate users (session/token) and enforce scopes server-side.',
      },
    ],
    hints: ['Who can read the final bundle?', 'What does deleting the line actually accomplish?'],
    objectives: ['Handle leaked credentials correctly', 'Redesign client/server secret boundaries'],
  }),

  reviewChallenge({
    id: 'cr.assignment-condition',
    category: 'code_review',
    challengeType: 'code_review',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['correctness', 'static analysis'],
    tags: ['correctness'],
    skills: ['Detail-oriented reading'],
    subcategories: ['correctness'],
    title: 'The Condition That Wasn’t',
    subtitle: 'One missing equals sign.',
    description: 'A classic typo that turns a check into an assignment.',
    language: 'typescript',
    code: `function canCheckout(cart: Cart, user: User) {
  let discount = 0;
  if (user.isMember = true) {
    discount = 0.1;
  }
  if (cart.total = 0) {
    return { approved: false, reason: "empty cart" };
  }
  return { approved: true, total: cart.total * (1 - discount) };
}`,
    issues: [
      {
        title: 'Assignment inside the member condition',
        severity: 'critical',
        explanation:
          '`user.isMember = true` SETS the flag and evaluates to true — every caller receives the member discount, and the user object is mutated as a side effect.',
        fix: '`if (user.isMember)` or `=== true` if the value can be non-boolean.',
      },
      {
        title: 'cart.total is zeroed before the empty-cart check',
        severity: 'critical',
        explanation:
          '`cart.total = 0` assigns zero, making the following `if (cart.total === 0)` always true — checkout is impossible, and the caller’s cart object is corrupted.',
        fix: 'Compare, don’t assign: `if (cart.total === 0)`.',
      },
      {
        title: 'Nothing in CI catches assignment-in-condition',
        severity: 'minor',
        explanation:
          'TypeScript flags this only with exactOptionalPropertyTypes-style strictness in some shapes; the standard guard is a lint rule plus a no-parameters-reassignment style.',
        fix: 'Enable eslint no-cond-assign as an error.',
      },
    ],
    hints: [
      'What is the value of an assignment expression?',
      'Trace cart.total through the function line by line.',
    ],
    objectives: ['Catch assignment-in-condition typos', 'Wire lint rules as a safety net'],
  }),

  reviewChallenge({
    id: 'cr.partial-failure',
    category: 'code_review',
    challengeType: 'code_review',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['transactions', 'partial failure'],
    tags: ['reliability'],
    skills: ['Failure-mode review'],
    subcategories: ['reliability'],
    title: 'The Half-Paid Order',
    subtitle: 'Two writes, no transaction.',
    description: 'An order flow that can charge the card and lose the order — or the reverse.',
    language: 'typescript',
    code: `export async function placeOrder(order: Order) {
  const payment = await chargeCard(order.card, order.totalCents);
  await db.orders.insert({ ...order, paymentId: payment.id });
  await emailReceipt(order.email, payment.id);
  return { ok: true };
}`,
    issues: [
      {
        title: 'Charge and order insert are not atomic',
        severity: 'critical',
        explanation:
          'If the insert fails (crash, unique violation, deploy), the customer is charged with no order record — the worst support ticket class. If the DB write succeeds but the process dies before returning, a client retry double-charges.',
        fix: 'Wrap charge + insert in one transaction where the provider supports it; otherwise use an idempotency key on the charge and an outbox/reconciliation job that pairs orphan charges with orders.',
      },
      {
        title: 'Email in the critical path',
        severity: 'minor',
        explanation:
          'A slow or failing email provider fails the whole request after money moved; the customer sees an error but their order exists.',
        fix: 'Enqueue the email after commit (outbox or queue) and return success.',
      },
      {
        title: 'No idempotency surface for retries',
        severity: 'major',
        explanation:
          'placeOrder retried after a timeout charges twice: nothing in the payload names the operation.',
        fix: 'Accept a client-generated idempotency key and store it with the order.',
      },
    ],
    hints: [
      'List every line where the process could die. Which states are unrecoverable?',
      'Which operation does the client retry?',
    ],
    objectives: ['Reason about partial failure', 'Design transactional + idempotent flows'],
  }),
];
