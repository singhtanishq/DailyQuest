import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Networking pool — TCP, DNS, TLS, CIDR and the latency arithmetic that
 * explains real-world performance.
 */

export const networkingTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'net.tcp-vs-udp',
    category: 'networking',
    challengeType: 'networking',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['tcp', 'udp'],
    tags: ['protocols'],
    skills: ['Transport selection'],
    subcategories: ['transport'],
    title: 'The Two Couriers',
    subtitle: 'Reliability versus latency, by design.',
    description: 'Which transport fits which workload, and what each guarantees.',
    question: 'Which pairing of transport and workload is the BEST fit?',
    options: [
      'TCP for a banking API; UDP for a live game’s per-frame position updates',
      'TCP for live game updates; UDP for the banking API',
      'UDP for both, since both benefit from low latency',
      'TCP for both, since TCP is strictly more modern',
    ],
    optionExplanations: [
      'Correct: correctness-critical ordered delivery for money; tolerable-loss, latency-critical datagrams for game frames (old positions are worthless anyway).',
      'Inverted: games drown in TCP head-of-line blocking and retransmits; banks cannot tolerate UDP’s loss.',
      'UDP alone provides no ordering, delivery or congestion control — unacceptable for payments.',
      'Neither is more modern; they optimize for different guarantees.',
    ],
    reasoning: [
      'TCP: connection setup, ordering, retransmission, flow and congestion control — cost is latency and head-of-line blocking.',
      'UDP: a thin datagram layer; reliability belongs to the application (QUIC builds TCP-like guarantees ON TOP of UDP).',
      'The decision axis: can your application tolerate loss or reordering better than it tolerates delay?',
    ],
    hints: [
      'What does a dropped position packet actually cost a game?',
      'Which protocol retransmits — and is retransmitting an old frame useful?',
    ],
    objectives: ['Match transports to workloads', 'Explain head-of-line blocking'],
  }),

  quizChallenge({
    id: 'net.cidr-26',
    category: 'networking',
    challengeType: 'networking',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['cidr', 'subnetting'],
    tags: ['cidr', 'ip'],
    skills: ['Subnet arithmetic'],
    subcategories: ['ip'],
    title: 'The /26 Subnet',
    subtitle: 'Sixty-four minus the endpoints.',
    description:
      'Compute addresses and usable hosts for a /26 — the arithmetic every operator needs.',
    question:
      'A subnet is announced as `10.0.0.64/26`. How many TOTAL addresses does the block contain, and how many are USABLE for hosts?',
    options: [
      '64 total, 62 usable',
      '26 total, 24 usable',
      '64 total, 64 usable',
      '128 total, 126 usable',
    ],
    optionExplanations: [
      'Correct: /26 leaves 32 − 26 = 6 host bits → 2⁶ = 64 addresses; subtract network and broadcast → 62 usable.',
      'The /26 prefix length is not the address count — host bits are 32 minus the prefix.',
      'Network and broadcast addresses are reserved, so two of the 64 are not assignable.',
      'That would be a /25 (7 host bits).',
    ],
    reasoning: [
      'Host bits = 32 − prefix length = 6; total = 2⁶ = 64.',
      'The first address (10.0.0.64) is the network id, the last (10.0.0.127) is broadcast.',
      'Usable range: 10.0.0.65 – 10.0.0.126 = 62 hosts.',
    ],
    hints: ['How many bits remain after the prefix?', 'Which two addresses are always reserved?'],
    objectives: ['Convert prefix length to host bits', 'Reserve network and broadcast correctly'],
  }),

  openChallenge({
    id: 'net.dns-resolution',
    category: 'networking',
    challengeType: 'networking',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['dns', 'caching'],
    tags: ['dns'],
    skills: ['Resolution path tracing'],
    subcategories: ['dns'],
    title: 'The Name Hunt',
    subtitle: 'From cache to authoritative, step by step.',
    description: 'Trace a DNS lookup end to end and explain where latency hides.',
    question:
      'A user’s browser resolves `api.example.com` for the first time. Walk the resolution path: stub resolver, recursion, root/TLD/authoritative servers. Where do TTLs control behaviour, why is a negative answer cached too, and what actually happens when a nameserver is down?',
    guidance: [
      'Order the participants and their queries.',
      'Explain TTL-driven caching at every layer.',
      'Describe negative caching (SOA minimum) and failure modes.',
    ],
    solution: {
      summary:
        'The stub resolver asks a recursive resolver (ISP or 8.8.8.8); if its cache misses, it walks root → .com → example.com nameservers → the authoritative server, caching each answer for its TTL. Negative answers (NXDOMAIN) are cached too, bounded by the SOA minimum. A dead nameserver causes retries and timeouts at that hop — resolution fails slowly rather than instantly, which is why low TTLs plus redundant NS records matter for migrations.',
      reasoning: [
        'The browser/OS cache is checked first, then the recursive resolver’s cache.',
        'Referrals: root answers "ask .com", .com answers "ask example.com’s NS".',
        'TTL is per-record: short TTLs speed migrations but raise query volume; long TTLs hide changes.',
        'Timeout behaviour at each hop (typically seconds of retry) is why DNS outages feel like hangs.',
      ],
      commonMistakes: [
        'Saying "the browser asks the root server directly" — end hosts delegate recursion.',
        'Forgetting negative caching: NXDOMAIN also has a TTL.',
      ],
    },
    hints: [
      'Who performs recursion on behalf of the client?',
      'What record type bounds a cached "does not exist"?',
    ],
    objectives: ['Trace recursive resolution', 'Reason about TTL and failure latency'],
  }),

  openChallenge({
    id: 'net.tls-handshake',
    category: 'networking',
    challengeType: 'networking',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['tls', 'handshake'],
    tags: ['tls', 'security'],
    skills: ['Handshake mechanics'],
    subcategories: ['tls'],
    title: 'The Keys Are Exchanged How?',
    subtitle: 'TLS 1.2 vs 1.3 round trips.',
    description: 'Explain what the TLS handshake establishes and how 1.3 shortened it.',
    question:
      'Compare the TLS 1.2 and TLS 1.3 handshakes: how many round trips before application data, how the symmetric key is derived, and what certificate validation actually proves. Where does session resumption fit?',
    guidance: [
      'Count round trips for each version.',
      'Explain the key schedule role of (EC)DHE and the certificate.',
      'Distinguish what the handshake proves (server identity) from what it does not (client trustworthiness).',
    ],
    solution: {
      summary:
        'TLS 1.2 needs two round trips (ClientHello/ServerHello + key exchange, then Finished) before data; 1.3 collapses to one by sending key shares in the first flight and encrypting most of the handshake. Both derive symmetric keys from (EC)DHE shared secrets mixed with transcript hashes; the certificate chain, validated against trust anchors, proves the server controls the domain. Resumption (session tickets / PSK) skips the public-key work for repeat visits.',
      reasoning: [
        'The server certificate authenticates the SERVER; without client certs, clients are anonymous until the application authenticates them.',
        'Forward secrecy comes from ephemeral DHE: a stolen long-term key cannot decrypt past sessions (TLS 1.3 enforces this).',
        '0-RTT in 1.3 allows replayable early data — a real risk for non-idempotent requests.',
      ],
      commonMistakes: [
        'Claiming TLS encrypts the SNI in 1.2 — plaintext SNI leaks the hostname (ECH addresses this).',
        'Confusing certificate trust with vulnerability-freedom — a valid cert says nothing about server software.',
      ],
    },
    hints: [
      'Count the flights in each version’s handshake.',
      'What exactly does a valid certificate chain prove?',
    ],
    objectives: [
      'Compare handshake round trips',
      'Separate authentication from confidentiality claims',
    ],
  }),

  quizChallenge({
    id: 'net.well-known-ports',
    category: 'networking',
    challengeType: 'networking',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['ports'],
    tags: ['ports'],
    skills: ['Service mapping'],
    subcategories: ['ports'],
    title: 'The Numbered Doors',
    subtitle: 'Which service lives on which port?',
    description: 'The port numbers that come up in every incident review.',
    question: 'Which port-to-service mapping is CORRECT?',
    options: [
      'SSH 22, HTTPS 443, PostgreSQL 5432',
      'SSH 443, HTTPS 22, PostgreSQL 5432',
      'SSH 22, HTTPS 8080, PostgreSQL 3306',
      'SSH 21, HTTPS 443, PostgreSQL 5432',
    ],
    optionExplanations: [
      'Correct: 22 SSH, 443 HTTPS, 5432 PostgreSQL — the everyday trio.',
      '22 and 443 are swapped; SSH on 443 is a common obfuscation trick, not the default.',
      '8080 is a common alternative HTTP port, not the default HTTPS; 3306 is MySQL, not PostgreSQL.',
      '21 is FTP, not SSH.',
    ],
    reasoning: [
      'Memorize the big five: 22 SSH, 80 HTTP, 443 HTTPS, 5432 PostgreSQL, 3306 MySQL.',
      'Ports are conventions enforced by nothing — but every default config, firewall rule and load balancer assumes them.',
    ],
    hints: [
      'Two of the distractors swap or misfile well-known numbers.',
      'Which database is 3306?',
    ],
    objectives: ['Recall standard service ports', 'Spot misconfigured listeners'],
  }),

  openChallenge({
    id: 'net.latency-budget',
    category: 'networking',
    challengeType: 'performance',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['latency', 'connection reuse'],
    tags: ['latency', 'performance'],
    skills: ['RTT arithmetic'],
    subcategories: ['latency'],
    title: 'The Round-Trip Budget',
    subtitle: 'Why connection reuse dominates performance.',
    description: 'Count the round trips behind a page load and make them cheap.',
    question:
      'A client with 50 ms RTT opens a fresh connection to an HTTPS API. Count the round trips needed before the first byte of request payload can be sent (TCP handshake, TLS 1.3, request/response), then explain how keep-alive, connection pooling and HTTP/2 multiplexing change the math.',
    guidance: [
      'Enumerate the round trips for a cold connection.',
      'Contrast with a warm, reused connection.',
      'Explain what multiplexing removes (and what it does not).',
    ],
    solution: {
      summary:
        'Cold: TCP SYN/ACK = 1 RTT, TLS 1.3 = 1 RTT, then request/response = 1 RTT → ~3 RTT = ~150 ms before payload arrives (plus server time). Warm reuse skips the first two. Pooling amortizes setup across requests; HTTP/2 lets one connection carry concurrent streams, but head-of-line blocking moves to the TCP layer until QUIC/HTTP-3.',
      reasoning: [
        'RTT arithmetic: every round trip costs the speed of light plus queueing — you cannot make them free, only fewer.',
        'TLS 1.3’s one-RTT handshake and 0-RTT resumption cut the cold path.',
        'H/2 multiplexing removes the browser’s per-host connection cap problem, not the per-stream head-of-line issue.',
      ],
      commonMistakes: [
        'Forgetting that DNS adds latency before the first SYN.',
        'Assuming HTTP/2 eliminates latency — it eliminates queueing-for-connections, not RTTs.',
      ],
    },
    hints: [
      'Three phases: transport setup, security setup, exchange.',
      'What does a reused connection skip entirely?',
    ],
    objectives: ['Count round trips per protocol phase', 'Justify keep-alive and pooling'],
  }),

  openChallenge({
    id: 'net.reverse-proxy',
    category: 'networking',
    challengeType: 'networking',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['proxies', 'load balancing'],
    tags: ['proxies', 'architecture'],
    skills: ['Traffic topology reasoning'],
    subcategories: ['proxies'],
    title: 'The Doorkeeper',
    subtitle: 'Forward proxy vs reverse proxy.',
    description: 'Two proxies, opposite clients.',
    question:
      'Distinguish a forward proxy from a reverse proxy: who configures each, who is hidden, and which typical responsibilities (TLS termination, caching, load balancing, egress control) belong to which.',
    guidance: [
      'Define both by which side they sit on.',
      'Assign the four responsibilities to the right proxy type.',
      'Explain X-Forwarded-For and why reverse proxies must not be blindly trusted.',
    ],
    solution: {
      summary:
        'A forward proxy sits in front of CLIENTS (configured by the client’s org) and hides clients from servers — used for egress control, filtering and caching. A reverse proxy sits in front of SERVERS (configured by the service owner) and hides servers from clients — terminating TLS, caching, load balancing and rate limiting. Reverse proxies add X-Forwarded-For/X-Forwarded-Proto, which apps must trust only from known proxy IPs.',
      reasoning: [
        'Direction decides everything: forward = client-side agent; reverse = server-side facade.',
        'TLS termination at the reverse proxy offloads certs but moves plaintext into your private network segment.',
        'Load balancing, health checks, and request shaping naturally live at the choke point all traffic crosses.',
      ],
      commonMistakes: [
        'Calling a CDN "a forward proxy" — CDNs are reverse proxies owned by a third party.',
        'Trusting client-supplied X-Forwarded-For headers on direct connections.',
      ],
    },
    hints: [
      'Who configures it: the client org or the service owner?',
      'Which proxy do end users usually NOT know exists?',
    ],
    objectives: ['Classify proxy types by direction', 'Assign operational responsibilities'],
  }),
];
