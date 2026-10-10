import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Databases pool — engine-level behaviour that application code inherits:
 * indexes, isolation and transactions.
 */

export const databaseTemplates: QuestTemplate[] = [
  openChallenge({
    id: 'db.index-tradeoffs',
    category: 'databases',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['indexing', 'write amplification'],
    tags: ['indexes', 'performance'],
    skills: ['Index cost-benefit analysis'],
    subcategories: ['indexes'],
    title: 'The Index Everything Fallacy',
    subtitle: 'Every index is a tax on writes.',
    description: 'When an index helps, when it hurts, and why low-selectivity columns are poor candidates.',
    question:
      'A team adds indexes to every column "to make reads fast." Explain the real trade-off: what an index costs on writes and storage, why a boolean status column is usually a bad index candidate on its own, and how composite indexes change the calculus.',
    guidance: [
      'Describe what maintaining a B-tree index costs per INSERT/UPDATE/DELETE.',
      'Explain selectivity and why an index on a 2-value column rarely helps a large table.',
      'Show how a composite index (status, created_at) fixes a common query shape.',
    ],
    solution: {
      summary:
        'Each index is a second data structure updated in the same transaction: writes pay extra B-tree maintenance and storage doubles the data’s key footprint. An index pays off when queries SELECT a small fraction of rows — a boolean column on a 10M-row table still leaves ~5M matches, so the planner prefers a scan. Composite indexes earn their keep by serving multi-column predicates and range scans (status + created_at) in one lookup, following the leftmost-prefix rule.',
      reasoning: [
        'Write cost: every INSERT touches all indexes; hot indexes also fragment and bloat.',
        'Selectivity rule: index columns with high cardinality or strong query predicates.',
        'Leftmost prefix: index (status, created_at) serves WHERE status = ? ORDER BY created_at but not a bare created_at range.',
        'Covering indexes (including selected columns) can skip the table entirely — the strongest read win.',
      ],
      commonMistakes: [
        'Indexing columns that only ever appear in SELECT lists without predicates.',
        'Assuming the planner will always use the index — it estimates; small tables scan faster.',
      ],
    },
    hints: ['What happens to every index when one row is updated?', 'How many distinct values does a boolean have, and how many rows match each?'],
    objectives: ['Weigh read gains against write costs', 'Design composite indexes for query shapes'],
  }),

  quizChallenge({
    id: 'db.isolation-phenomena',
    category: 'databases',
    challengeType: 'reasoning',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['transactions', 'isolation levels'],
    tags: ['transactions', 'concurrency'],
    skills: ['Isolation level reasoning'],
    subcategories: ['transactions'],
    title: 'The Phantom Reader',
    subtitle: 'Which level stops which anomaly?',
    description: 'Map read phenomena to isolation levels precisely.',
    question:
      'Which isolation level is the LOWEST that prevents both non-repeatable reads AND phantoms in the SQL standard?',
    options: [
      'SERIALIZABLE',
      'REPEATABLE READ',
      'READ COMMITTED',
      'READ UNCOMMITTED',
    ],
    optionExplanations: [
      'Correct per the SQL standard: REPEATABLE READ forbids dirty and non-repeatable reads but still allows phantoms; only SERIALIZABLE forbids all listed anomalies.',
      'The standard says REPEATABLE READ still permits phantoms — new rows matching an earlier predicate may appear. (PostgreSQL’s implementation is stricter, but the standard answer stands.)',
      'READ COMMITTED allows both non-repeatable reads and phantoms; it only prevents dirty reads.',
      'READ UNCOMMITTED allows even dirty reads.',
    ],
    reasoning: [
      'Dirty read: seeing uncommitted data. Non-repeatable: a row CHANGES between your reads. Phantom: new ROWS appear matching your predicate.',
      'Each level up eliminates one more phenomenon; SERIALIZABLE makes concurrent executions equivalent to some serial order.',
      'Implementations differ: PostgreSQL’s REPEATABLE READ (MVCC snapshots) actually blocks phantoms too — know both the standard and your engine.',
    ],
    hints: ['Define the three phenomena in one line each.', 'Where does the standard draw the phantom line?'],
    objectives: ['Recite the phenomena-to-level mapping', 'Separate the SQL standard from engine implementations'],
  }),
];
