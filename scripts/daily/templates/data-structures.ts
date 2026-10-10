import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Data structures pool — choosing and applying the right container, not
 * reciting definitions.
 */

export const dataStructureTemplates: QuestTemplate[] = [
  openChallenge({
    id: 'ds.lru-design',
    category: 'data_structures',
    challengeType: 'data_structure',
    difficulty: 'hard',
    minutes: 30,
    concepts: ['lru cache', 'hash maps', 'doubly linked lists'],
    tags: ['design', 'caching'],
    skills: ['Composite data structure design'],
    subcategories: ['caching'],
    title: 'The Evicting Shelf',
    subtitle: 'O(1) get and put, with taste.',
    description: 'Design an LRU cache and justify why it needs two structures fused together.',
    question:
      'Design an LRU cache with capacity C supporting get(key) and put(key, value) in O(1) worst case. Sketch the internal structure, walk through a get and a put, and explain why a plain hash map or a plain linked list alone cannot do it.',
    guidance: [
      'Name the two structures and the responsibility of each.',
      'Detail the pointer surgery for get and put.',
      'State the eviction rule and where the "recency" evidence lives.',
    ],
    solution: {
      summary:
        'Fuse a hash map (key → node) with a doubly linked list ordered by recency. get: look up, unlink the node, relink at the head. put: update or insert at the head; when over capacity, evict the tail. The map gives O(1) lookup; the list gives O(1) reordering and eviction — neither provides both alone.',
      reasoning: [
        'Hash map alone knows what exists but not the order of use.',
        'A plain list knows order but takes O(n) to find a key.',
        'The doubly linked list allows O(1) unlink because each node points both ways — a singly linked list would need the predecessor, an O(n) search.',
        'Sentinel head/tail nodes remove all empty-edge special cases.',
        'Complexity: O(1) time for both operations, O(C) space.',
      ],
      alternatives: [
        'A language-built LinkedHashMap (Java) or OrderedDict (Python) implements the recency bookkeeping for you.',
        'Approximate LRU with a clock/second-chance policy when strict recency is unnecessary.',
      ],
    },
    hints: ['What operation does the recency order need that a singly linked list makes expensive?', 'Which structure answers "is this key present" in O(1)?'],
    objectives: ['Combine structures to satisfy competing requirements', 'Justify O(1) claims operation by operation'],
  }),

  quizChallenge({
    id: 'ds.stack-queue-choice',
    category: 'data_structures',
    challengeType: 'data_structure',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['stacks', 'queues'],
    tags: ['fundamentals'],
    skills: ['LIFO/FIFO reasoning'],
    subcategories: ['fundamentals'],
    title: 'The Order of Service',
    subtitle: 'Match the structure to the workload.',
    description: 'Stack or queue — which fits which problem?',
    question: 'Which pairing of structure and use case is CORRECT?',
    options: [
      'Undo history → stack; print job scheduling → queue',
      'Undo history → queue; print job scheduling → stack',
      'Both → stack, since both need O(1) operations',
      'Both → queue, since both process items in arrival order',
    ],
    optionExplanations: [
      'Correct: undo reverses the most recent action (LIFO), while print jobs are served in arrival order (FIFO).',
      'Undo must reverse the LAST action first — a queue would undo the oldest action first.',
      'O(1) alone never decides the structure — the ACCESS ORDER is the requirement.',
      'Print jobs are FIFO, but undo is definitely not.',
    ],
    reasoning: [
      'Stack (LIFO): undo/redo, backtracking, call stacks, bracket matching.',
      'Queue (FIFO): schedulers, BFS, buffering producers and consumers.',
      'The deciding question is always: what must come out next?',
    ],
    hints: ['What does "undo" undo — the oldest or newest action?', 'BFS uses which of the two, and why?'],
    objectives: ['Match access order to structure', 'Recognize LIFO/FIFO in real systems'],
  }),

  openChallenge({
    id: 'ds.hashmap-internals',
    category: 'data_structures',
    challengeType: 'data_structure',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['hash maps', 'collisions', 'amortized analysis'],
    tags: ['hashing', 'fundamentals'],
    skills: ['Hash table reasoning'],
    subcategories: ['hashing'],
    title: 'Under the Bucket Lid',
    subtitle: 'What O(1) lookup actually costs.',
    description: 'Explain how hash maps handle collisions and why operations are "amortized" O(1).',
    question:
      'Walk through what happens on `map.set(key, value)`: hashing, bucket selection, collision handling, and resizing. Why is the cost called amortized O(1) instead of plain O(1), and what input pattern degrades it?',
    guidance: [
      'Describe bucket indexing via hash + modulo.',
      'Compare chaining and open addressing.',
      'Explain load factor and amortization of the resize.',
    ],
    solution: {
      summary:
        'The key is hashed to an integer and mapped to a bucket; collisions are resolved by chaining (a list per bucket) or open addressing (probe for the next free slot). When the load factor passes a threshold the table grows and every entry rehashes — that single operation costs O(n), but it happens once per doubling, so averaged over n insertions each is O(1). Adversarial keys that all hash to one bucket (or a weak hash) degrade to O(n) per operation.',
      reasoning: [
        'hash(key) must be stable and well-distributed; equality decides the final match within a bucket.',
        'Chaining tolerates load factors above 1; open addressing keeps better cache locality but needs tombstones for deletion.',
        'Resizing cost 2 + 4 + … + n sums to O(n) across n insertions → amortized O(1) each.',
        'Real engines (V8, CPython) randomize hash seeds to defend against collision DoS.',
      ],
      commonMistakes: [
        'Claiming worst-case O(1) — the guarantee is expected/amortized, not worst-case.',
        'Forgetting that keys need stable equality and immutability semantics.',
      ],
    },
    hints: ['What does the load factor measure?', 'Why does doubling make the rehash cost geometric?'],
    objectives: ['Explain collision strategies', 'Justify the amortized claim'],
  }),

  quizChallenge({
    id: 'ds.set-membership',
    category: 'data_structures',
    challengeType: 'data_structure',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['sets', 'complexity'],
    tags: ['fundamentals', 'sets'],
    skills: ['Structure selection'],
    subcategories: ['fundamentals'],
    title: 'The Membership Check',
    subtitle: 'Array.includes vs Set.has at scale.',
    description: 'One lookup pattern, two very different costs.',
    question:
      'A function checks `if (bannedIds.includes(id))` inside a loop over 100,000 records, with 1,000 banned ids. What is the cheapest correct fix?',
    options: [
      'Build `const banned = new Set(bannedIds)` once and use banned.has(id)',
      'Sort bannedIds and use includes anyway — sorting makes it faster',
      'Replace includes with find, which is optimized for membership',
      'Convert both lists to strings and use indexOf',
    ],
    optionExplanations: [
      'Correct: Set.has is O(1) average; the loop becomes O(n) overall instead of O(n·m).',
      'Sorting bannedIds does not change includes — includes does a linear scan regardless.',
      'find is also O(m); it is not a membership primitive.',
      'String conversion changes semantics and stays linear.',
    ],
    reasoning: [
      'includes/find scan linearly: O(m) per check → O(n·m) total, 10^8 comparisons here.',
      'Set construction is O(m) once; each has() is O(1) expected.',
      'The general rule: repeated membership tests over a static collection → hash-based set/map.',
    ],
    hints: ['Count the comparisons: 100,000 × 1,000.', 'What is the cost of building the Set compared with what it saves?'],
    objectives: ['Spot quadratic lookup patterns', 'Reach for sets instinctively'],
  }),

  openChallenge({
    id: 'ds.heap-priority',
    category: 'data_structures',
    challengeType: 'data_structure',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['heaps', 'priority queues'],
    tags: ['heaps', 'scheduling'],
    skills: ['Priority reasoning'],
    subcategories: ['heaps'],
    title: 'The Impatient Queue',
    subtitle: 'When arrival order is the wrong order.',
    description: 'Why a heap beats both sorting and a plain queue for priority scheduling.',
    question:
      'A task scheduler must always run the highest-priority task next, with tasks arriving continuously. Compare three approaches — sorting on every request, keeping a sorted list, and a binary heap — and give the complexity of insert and extract-min for each.',
    guidance: [
      'Analyze each approach for both operations.',
      'Explain the heap invariant and why sift operations are O(log n).',
      'Name the scenario where each approach is actually right.',
    ],
    solution: {
      summary:
        'Sort-per-request: O(n log n) per extraction — wasteful. Sorted list: O(n) insert (shift), O(1) extract. Binary heap: O(log n) insert and extract, O(1) peek. The heap keeps only the invariant "parent ≤ children", which is exactly enough to extract the minimum without maintaining full order. Sorting wins when you need everything ordered once; a sorted array wins when inserts are rare; the heap wins for interleaved insert/extract — schedulers, Dijkstra, top-k streams.',
      reasoning: [
        'A heap is an array-backed complete binary tree: children of i live at 2i+1 and 2i+2.',
        'Insert appends and sifts up; extract swaps the root with the last element and sifts down — both bounded by tree height log n.',
        'Heaps give no sorted iteration order — only repeated extraction is sorted.',
      ],
      alternatives: [
        'A balanced BST (or ordered map) also gives O(log n) with ordered traversal — heavier constants, more features.',
        'For bounded small integer priorities, bucket queues beat heaps entirely.',
      ],
    },
    hints: ['What does the heap invariant guarantee — full order, or just the root?', 'Where do children of array index i live?'],
    objectives: ['Choose structures by operation mix', 'Explain heap invariants and costs'],
  }),
];
