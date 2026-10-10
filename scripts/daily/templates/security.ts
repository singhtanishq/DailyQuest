import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Cybersecurity + security analysis pools.
 *
 * Strictly defensive framing: identify, explain, detect, mitigate. Controlled
 * examples only — nothing here targets real systems, and no quest contains
 * working exploit payloads.
 */

export const securityTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'sec.xss-classes',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['xss', 'output encoding'],
    tags: ['xss', 'web'],
    skills: ['Vulnerability classification'],
    subcategories: ['web-security'],
    title: 'The Three XSS Doors',
    subtitle: 'Reflected, stored, DOM — same fix family.',
    description: 'Classify XSS variants and apply the layered defenses.',
    question:
      'A search page renders the query back in the HTML (`<h1>Results for {query}</h1>`), a comment field is stored and shown to every visitor, and a client-side script builds HTML from location.hash. Which attack classes do these enable, and which defenses apply to ALL of them?',
    options: [
      'Reflected, stored, and DOM-based XSS respectively; context-aware output encoding plus a CSP defend all three',
      'All three are stored XSS since they involve HTML',
      'Only the stored one matters; reflected and DOM XSS are theoretical',
      'Reflected XSS only; the other two are injection but not XSS',
    ],
    optionExplanations: [
      'Correct: the three classes differ by where the payload enters; the defense — encode for the output context (HTML entity, attribute, JS, URL) and add CSP as a backstop — is shared.',
      'Stored means persisted server-side; the reflected and hash-based cases never touch the database.',
      'All three are fully exploitable; reflected XSS is behind only a crafted link.',
      'Building HTML from untrusted input is textbook DOM-based XSS.',
    ],
    reasoning: [
      'The unified mental model: untrusted data reaches an HTML execution context without encoding.',
      'Framework auto-escaping (React text nodes) covers the common path; dangerouslySetInnerHTML and innerHTML are the manual hatches.',
      'CSP (script-src nonces) limits blast radius; HttpOnly cookies limit what a successful XSS can steal.',
    ],
    hints: [
      'Classify by WHERE the payload travels: link → server → response, database, or client-only.',
      'Which defense is context-dependent and which is a safety net?',
    ],
    objectives: ['Classify XSS by entry point', 'Layer encoding, CSP and cookie hardening'],
  }),

  openChallenge({
    id: 'sec.sql-injection-defense',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['sql injection', 'parameterized queries'],
    tags: ['injection', 'databases'],
    skills: ['Secure query construction'],
    subcategories: ['injection'],
    title: 'The String-Built Query',
    subtitle: 'One quote character, full table read.',
    description: 'Explain the injection mechanism and the defense that actually works.',
    question:
      'A login query is built as `"SELECT * FROM users WHERE name = \'" + name + "\'"`. Explain how a crafted name bypasses the login or dumps data, why parameterized queries eliminate the entire class, and why the popular "sanitize quotes" workaround fails.',
    guidance: [
      'Walk the string concatenation with a concrete crafted input (describe its EFFECT, keep it generic).',
      'Explain parse-time vs data-time separation for parameters.',
      'Address escaping-based defenses and their gaps.',
    ],
    solution: {
      summary:
        'Concatenation makes user data part of the SQL GRAMMAR: a value containing a quote can terminate the string literal and append new clauses — reading arbitrary rows or bypassing conditions. Parameterized queries send SQL and data separately; the driver guarantees data can never be parsed as code, which eliminates the class regardless of input content. Hand-rolled escaping (doubling quotes) fails on second-order injection, encoding mismatches and forgotten call sites; parameterization has no such holes.',
      reasoning: [
        'The vulnerability is structural (code/data mixing), not a matter of filtering specific characters.',
        'ORMs use parameterization under the hood — string interpolation into .raw() reintroduces the hole.',
        'Least-privilege DB accounts and query logging are defense-in-depth, not the fix.',
      ],
      commonMistakes: [
        'Believing ORMs make you immune while interpolating into raw fragments.',
        'Trying to blocklist words like SELECT — data legitimately contains such words.',
      ],
    },
    hints: [
      'Where does user data become part of the SQL grammar?',
      'What does the driver do differently with a placeholder?',
    ],
    objectives: ['Explain injection structurally', 'Standardize on parameterization'],
  }),

  quizChallenge({
    id: 'sec.password-storage',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['password hashing', 'key derivation'],
    tags: ['hashing', 'auth'],
    skills: ['Credential storage'],
    subcategories: ['auth'],
    title: 'The Fast Hash Mistake',
    subtitle: 'SHA-256 is too fast for passwords.',
    description: 'Choose the right password storage primitive.',
    question: 'Which password storage approach is correct?',
    options: [
      'Argon2id (or bcrypt/scrypt) with a per-user salt and tuned cost parameters',
      'SHA-256 with a per-user salt',
      'MD5 for speed, since passwords are checked often',
      'AES encryption with a server-side key, so passwords are recoverable',
    ],
    optionExplanations: [
      'Correct: password hashing needs memory-hard, tunable KDFs designed to be slow on GPUs; per-user salts defeat precomputation.',
      'SHA-256 is a general hash: GPUs compute billions per second, making offline cracking cheap even salted.',
      'MD5 is both broken as a hash AND fast — the worst of both worlds.',
      'Recoverable passwords are a liability: you must be able to decrypt them, so an attacker with the key can too.',
    ],
    reasoning: [
      'The threat model is OFFLINE cracking after a database leak — speed is the enemy.',
      'Salts kill rainbow tables; cost parameters buy margin as hardware improves.',
      'Never log, transmit (outside TLS), or encrypt passwords — one-way derivations only.',
    ],
    hints: [
      'After a leak, what limits the attacker’s guess rate?',
      'Why does encryption differ categorically from hashing here?',
    ],
    objectives: ['Pick memory-hard KDFs', 'Argue the offline-crack threat model'],
  }),

  openChallenge({
    id: 'sec.jwt-pitfalls',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['jwt', 'token validation'],
    tags: ['jwt', 'auth'],
    skills: ['Token handling'],
    subcategories: ['auth'],
    title: 'The Trusting Verifier',
    subtitle: 'alg: none, key confusion, and forever tokens.',
    description: 'The classic JWT validation mistakes and their remedies.',
    question:
      'List the classic JWT implementation mistakes — accepting unsigned tokens, algorithm confusion between HS and RS families, trusting unvalidated claims, and missing expiry — and specify the validation checklist a verifier must follow before believing ANY claim.',
    guidance: [
      'Explain each mistake and its concrete consequence.',
      'Write the ordered checklist: algorithm allowlist, signature, iss/aud/exp/nbf, then claims.',
      'Address token lifetime and revocation trade-offs.',
    ],
    solution: {
      summary:
        'The mistakes: (1) libraries that honor "alg": none when asked to verify; (2) verifying an RS256 token with HS256 using the PUBLIC key as the HMAC secret; (3) reading claims before validation; (4) accepting tokens without exp/aud checks. The checklist: pin the expected algorithm (never read it from the token), verify signature with the correct key type, then validate iss, aud, exp, nbf — only then use claims. Keep access tokens short-lived (minutes), rely on refresh tokens for sessions, and treat revocation as a server-side denylist problem.',
      reasoning: [
        'JWTs are signed, not encrypted — anyone can read them; confidentiality needs JWE or transport security.',
        'The header is attacker-controlled input; trusting alg is trusting the adversary.',
        'Stateless expiry means "valid until exp" — logout and bans require server-side state, which is the fundamental trade-off.',
      ],
      commonMistakes: [
        'Storing session state in localStorage with long-lived tokens — XSS steals them irrecoverably.',
        'Assuming signature validity implies claim validity — they are separate checks.',
      ],
    },
    hints: [
      'Which parts of a JWT are attacker-controlled?',
      'Where does revocation actually live in a stateless design?',
    ],
    objectives: [
      'Write a complete JWT validation checklist',
      'Argue lifetimes and revocation trade-offs',
    ],
  }),

  quizChallenge({
    id: 'sec.csrf-vs-samesite',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['csrf', 'sameSite cookies'],
    tags: ['csrf'],
    skills: ['Request forgery defense'],
    subcategories: ['web-security'],
    title: 'The Forged Transfer',
    subtitle: 'The browser attaches the cookie for the attacker.',
    description: 'Why CSRF works and which layers stop it.',
    question:
      'A victim logged into bank.com visits evil.com, which contains `<img src="https://bank.com/transfer?to=attacker&amount=100">`. Why might the transfer execute, and which defense combination is considered complete?',
    options: [
      'The browser attaches bank.com cookies to the cross-site request; SameSite cookies plus a CSRF token on state-changing requests stop it',
      'CORS blocks the image request, so nothing else is needed',
      'The attacker needs the victim’s cookie value to forge requests',
      'HTTPS prevents CSRF entirely',
    ],
    optionExplanations: [
      'Correct: cookies ride along automatically on cross-site requests (same origin rules do not apply to cookie ATTACHMENT). SameSite=Lax/Strict stops most attachment; tokens prove request intent.',
      'CORS governs reading responses, not sending requests — the image request fires regardless; the response is merely unreadable.',
      'CSRF never needs the cookie VALUE — the browser attaches it; that is the whole trick.',
      'HTTPS encrypts and authenticates transport; it changes nothing about which cookies ride along.',
    ],
    reasoning: [
      'CSRF abuses ambient authority: credentials the browser attaches without the page reading them.',
      'SameSite=Lax blocks cross-site POST cookie attachment in modern browsers; tokens add explicit intent proof.',
      'GET requests must be side-effect-free — the img-tag trick only works against APIs that violate that rule.',
    ],
    hints: [
      'Does the browser need permission to ATTACH cookies to a request?',
      'Which cookie attribute controls cross-site attachment?',
    ],
    objectives: ['Explain ambient authority', 'Layer SameSite with tokens'],
  }),

  openChallenge({
    id: 'sec.ssrf-analysis',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['ssrf', 'egress control'],
    tags: ['ssrf', 'web'],
    skills: ['Server-side request analysis'],
    subcategories: ['web-security'],
    title: 'The URL Parameter That Reaches Inside',
    subtitle: 'When your server fetches attacker-chosen addresses.',
    description: 'Analyse the SSRF class: mechanism, impact, and layered mitigation.',
    question:
      'A service offers "fetch a preview for any URL you paste". Analyse why this is dangerous even though it only performs GET requests: which internal targets become reachable, how redirects and DNS rebinding complicate naive defenses, and design the layered mitigation (allowlists, egress rules, metadata-service hardening).',
    guidance: [
      'Explain the privilege position: the server’s network, not the attacker’s.',
      'Cover redirect-following and DNS-rebinding bypasses of naive URL checks.',
      'Design defenses in layers: scheme/host allowlists, egress firewall, IMDS protection.',
    ],
    solution: {
      summary:
        'The request originates from YOUR server — inside the perimeter — so attacker-chosen URLs can reach internal-only services: cloud metadata endpoints (169.254.169.254), admin panels, databases. Naive URL checks are bypassed by HTTP redirects (validate the START URL, get redirected to localhost) and DNS rebinding (resolve once to a public IP, again to an internal one). Mitigations in layers: scheme+host allowlist; resolve and connect only to approved IPs with the connection pinned to that resolution; block link-local/private ranges at the egress firewall; IMDSv2-style token requirements on the metadata service; disable redirect following or re-validate every hop.',
      reasoning: [
        'SSRF is an authorization problem (network reachability), not an injection problem.',
        'Response data may also leak (fetch-and-return turns intranet pages into exfiltration).',
        'Timeouts and response-size caps limit blind-probing side channels.',
      ],
      commonMistakes: [
        'Validating the URL string but following redirects unvalidated.',
        'Blocking 127.0.0.1 literally while ignoring 0x7f000001, decimal encodings and IPv6 equivalents.',
      ],
    },
    hints: [
      'Whose network position does the request come from?',
      'Name the cloud service that MUST never be reachable from user-triggered fetches.',
    ],
    objectives: ['Analyse SSRF impact paths', 'Layer allowlist, egress and metadata defenses'],
  }),

  quizChallenge({
    id: 'sec.security-headers',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['security headers'],
    tags: ['headers', 'hardening'],
    skills: ['Response hardening'],
    subcategories: ['web-security'],
    title: 'The Response Checklist',
    subtitle: 'Four headers, four attacks blunted.',
    description: 'Match security headers to the risks they mitigate.',
    question: 'Which mapping of HTTP response header to primary benefit is CORRECT?',
    options: [
      'Content-Security-Policy → limits script sources; X-Content-Type-Options → stops MIME sniffing; Strict-Transport-Security → forces HTTPS; X-Frame-Options/frame-ancestors → blocks framing/clickjacking',
      'CORS → blocks all cross-site attacks; CSP → blocks cookie theft; HSTS → blocks XSS',
      'X-Frame-Options → prevents SQL injection; CSP → prevents DNS attacks',
      'Cache-Control → prevents all caching attacks; CSP → compresses responses',
    ],
    optionExplanations: [
      'Correct: each header targets a distinct browser behaviour that attackers abuse.',
      'CORS is a read-permission mechanism for legitimate cross-origin clients, not a defense perimeter.',
      'Neither mapping matches any real header behaviour.',
      'Cache-Control manages freshness; CSP is a script/style source policy — unrelated to compression.',
    ],
    reasoning: [
      'CSP is the strongest single header (nonce-based script-src) but is a mitigation layer, not a substitute for output encoding.',
      'HSTS only helps after the FIRST HTTPS visit — preload lists close that gap.',
      'Headers harden the browser’s defaults; they never fix vulnerable code by themselves.',
    ],
    hints: [
      'Which header tells browsers "never interpret this response as another type"?',
      'Which one is about WHO may embed your page?',
    ],
    objectives: ['Deploy the core header set', 'Place headers correctly in the defense stack'],
  }),

  openChallenge({
    id: 'sec.dependency-risk',
    category: 'cybersecurity',
    challengeType: 'cybersecurity',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['supply chain', 'dependency management'],
    tags: ['supply-chain'],
    skills: ['Dependency hygiene'],
    subcategories: ['supply-chain'],
    title: 'The Left-Pad Blind Spot',
    subtitle: 'Your dependencies are your code.',
    description: 'Manage third-party risk without paralyzing development.',
    question:
      'Your app has 800 transitive npm dependencies. Design a dependency-risk program: how to know what you ship (lockfile, SBOM basics), how to learn about vulnerabilities (advisory feeds, automated PRs), which signals justify pinning or vendoring a critical package, and what review process a new dependency deserves.',
    guidance: [
      'Inventory: lockfile discipline and audit basics.',
      'Monitoring: advisories, update automation, severity triage.',
      'Gatekeeping: vetting new dependencies (maintenance, scope, permissions).',
    ],
    solution: {
      summary:
        'Commit the lockfile and install with npm ci so builds are reproducible; generate an SBOM (CycloneDX) so "what do we ship" has an answer. Wire advisory feeds (GitHub Dependabot / npm audit) into CI with severity-based triage — automate patch-version updates, review minor/major by risk. Vet new dependencies before adoption: maintenance activity, download evidence, install scripts (postinstall = code execution), transitive weight, and whether a smaller dependency or platform API replaces it. For build-critical packages, pin exact versions and consider vendoring with review.',
      reasoning: [
        'Most supply-chain incidents arrive through NEW versions of existing dependencies — update automation with review beats frozen risk.',
        'Install scripts and postinstall hooks are the classic initial-execution vector.',
        'The npm ci + lockfile pair makes "works on my machine" and "what was running" answerable.',
      ],
      commonMistakes: [
        'Disabling audit tooling because of noise instead of triaging by severity and reachability.',
        'Adding a 200-package chain to solve a 10-line problem.',
      ],
    },
    hints: [
      'Which file answers "exactly which versions ran in production"?',
      'What does a postinstall script mean in trust terms?',
    ],
    objectives: ['Design dependency governance', 'Vet packages before adoption'],
  }),

  openChallenge({
    id: 'sec.secure-code-review-checklist',
    category: 'security_analysis',
    challengeType: 'security_analysis',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['secure code review'],
    tags: ['review', 'process'],
    skills: ['Systematic review'],
    subcategories: ['analysis'],
    title: 'The Reviewer’s Radar',
    subtitle: 'A checklist that finds the classes, not just the bugs.',
    description: 'Build a personal secure-review checklist for pull requests.',
    question:
      'You are asked to review a new feature: an endpoint that accepts a username, fetches their profile from an internal service, and renders a page with data from the request. Draft your security review checklist for this diff — the vulnerability CLASSES you check for at each layer (input handling, authz, data flow to output, error handling, logging), and what evidence convinces you each is handled.',
    guidance: [
      'Organize by layer: input, authorization, output context, errors, logging.',
      'For each class, name the evidence you want to see in the diff.',
      'Note what you would flag for a follow-up ticket instead of blocking.',
    ],
    solution: {
      summary:
        'Input: validation and normalization of the username (type, length, charset) before any use. Authorization: is fetching another user’s profile ALLOWED for this caller, checked server-side (IDOR class)? Output: every rendered field encoded for its context; no raw HTML from the internal service. Errors: internal failures return generic messages — no stack traces or internal URLs. Logging: log the actor, target and outcome with request ids, never tokens or PII beyond need. Blocking issues: missing authz check and raw HTML rendering; advisory: verbose error detail, missing rate limiting.',
      reasoning: [
        'Checklists work because vulnerability CLASSES are finite; novelty is rare in incident data.',
        'IDOR deserves first position: it is the most common authorized-user vulnerability class.',
        'Evidence over assertion: "we sanitize" needs a call site, not a claim.',
      ],
      commonMistakes: [
        'Reviewing only the diff hunk — data flow into shared helpers escapes the hunk.',
        'Blocking on style-level security theater while missing the authz hole.',
      ],
    },
    hints: [
      'Start from the actor: who may fetch whom?',
      'Which single missing check turns profile pages into data exfiltration?',
    ],
    objectives: [
      'Operate a class-based review checklist',
      'Separate blocking from advisory findings',
    ],
  }),
];
