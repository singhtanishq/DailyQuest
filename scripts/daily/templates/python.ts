import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Python pool — semantics and idioms: mutability, comparison, exceptions,
 * comprehensions and the standard library habits that prevent real bugs.
 */

export const pythonTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'py.mutability-error',
    category: 'python',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['mutability', 'tuples'],
    tags: ['python', 'mutability'],
    skills: ['Mutable vs immutable types'],
    subcategories: ['types'],
    title: 'The Immutable Refusal',
    subtitle: 'Which line explodes, and why?',
    description: 'Tuples refuse item assignment — lists accept it.',
    scenario: {
      language: 'python',
      code: `point = (3, 4)
items = [3, 4]

items[0] = 10        # line A
point[0] = 10        # line B`,
    },
    question: 'What is the result of running this script?',
    options: [
      'Line A succeeds; line B raises a TypeError',
      'Line A raises a TypeError; line B succeeds',
      'Both lines succeed',
      'Both lines raise a TypeError',
    ],
    optionExplanations: [
      'Correct: lists are mutable — item assignment works. Tuples are immutable; `point[0] = 10` raises `TypeError: object does not support item assignment`.',
      'It is the opposite: the list accepts the write, the tuple refuses it.',
      'Tuple immutability is enforced at runtime by the type itself.',
      'List mutation is a core feature of lists.',
    ],
    reasoning: [
      'Mutability is a property of the TYPE, not the variable binding.',
      'Tuples support indexing and iteration but not item assignment.',
      'To "modify" a tuple you build a new one: point = (10,) + point[1:].',
    ],
    hints: ['Which of the two types is hashable and can be a dict key?', 'Immutability means the object cannot change — not that the name cannot be rebound.'],
    objectives: ['Distinguish mutable and immutable built-ins', 'Predict TypeError sources'],
  }),

  quizChallenge({
    id: 'py.is-vs-equals',
    category: 'python',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['identity vs equality'],
    tags: ['python', 'comparison'],
    skills: ['Correct comparison operators'],
    subcategories: ['semantics'],
    title: 'The Identity Trap',
    subtitle: 'is or ==? One of them is almost always wrong.',
    description: 'Choosing between `is` and `==` is a correctness decision, not a style one.',
    question: 'Which statement about `is` and `==` in Python is correct?',
    options: [
      'Use == to compare values; use is only for identity checks such as `x is None`',
      'Use is to compare values; it is faster than ==',
      'is and == are interchangeable for strings',
      'is compares values for small integers only',
    ],
    optionExplanations: [
      'Correct: == invokes __eq__ (value equality); is compares object identity. The canonical identity checks are `is None` and `is not None`.',
      'is does not compare values at all — two equal objects can be different objects.',
      'String interning makes some equal strings identical, but that is an implementation detail you must never rely on.',
      'Small-integer caching is a CPython implementation detail, not a semantic guarantee.',
    ],
    reasoning: [
      'is checks: are these the same object in memory (same id).',
      '== asks the object: are you equal to that (via __eq__).',
      'Interning and small-int caching are optimization details; code that depends on them is broken by design.',
    ],
    hints: ['What does id(x) measure?', 'Why does PEP 8 explicitly tell you to use `is None`?'],
    objectives: ['Choose is vs == correctly', 'Recognize implementation-detail reliance'],
  }),

  quizChallenge({
    id: 'py.shallow-copy',
    category: 'python',
    challengeType: 'output_prediction',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['shallow copy', 'nested lists'],
    tags: ['python', 'references'],
    skills: ['Copy depth reasoning'],
    subcategories: ['references'],
    title: 'The Copied Surface',
    subtitle: 'copy() copies exactly one level.',
    description: 'A copied nested list still shares its inner lists.',
    scenario: {
      language: 'python',
      code: `a = [[1, 2], [3, 4]]
b = a.copy()
b[0].append(9)

print(a)`,
    },
    question: 'What does the final print(a) display?',
    options: [
      '[[1, 2, 9], [3, 4]]',
      '[[1, 2], [3, 4]]',
      '[[1, 2, 9], [3, 4, 9]]',
      '[[9, 1, 2], [3, 4]]',
    ],
    optionExplanations: [
      'Correct: b[0] and a[0] are the SAME inner list object — append(9) is visible through both names.',
      'That would require a deep copy; list.copy() is shallow.',
      'append(9) touches only b[0]; there is no code path that appends to a[1] or b[1].',
      'append adds to the end; nothing reverses or prepends.',
    ],
    reasoning: [
      'a.copy() creates a new OUTER list whose elements are references to the same inner lists.',
      'b[0] is a[0] — the append mutates the shared object.',
      'To fully isolate, use copy.deepcopy(a) or rebuild the inner lists.',
    ],
    hints: ['How many objects does a.copy() actually create?', 'Try `a[0] is b[0]` — what does it return?'],
    objectives: ['Explain one-level copy semantics', 'Choose deepcopy deliberately'],
  }),

  quizChallenge({
    id: 'py.dict-access',
    category: 'python',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['dict semantics'],
    tags: ['python', 'dicts'],
    skills: ['Safe key access'],
    subcategories: ['dicts'],
    title: 'The Missing Key',
    subtitle: 'Three ways to read a dict, one of them throws.',
    description: 'Indexing vs get() vs get() with a default.',
    scenario: {
      language: 'python',
      code: `counts = {"apples": 3}

print(counts.get("pears", 0))
print(counts.get("pears"))
print(counts["pears"])`,
    },
    question: 'What happens when the script runs?',
    options: [
      'Prints 0, then None, then raises KeyError',
      'Prints 0, then 0, then raises KeyError',
      'Prints None three times',
      'Raises KeyError on the first line',
    ],
    optionExplanations: [
      'Correct: get(key, default) returns the default; get(key) returns None when missing; square brackets always raise KeyError for missing keys.',
      'get(key) without a second argument defaults to None, not 0.',
      'The third line is the one that raises — the first two never do.',
      'get() never raises for missing keys; only indexing does.',
    ],
    reasoning: [
      'dict.get exists precisely to avoid the KeyError dance.',
      'None is a valid return value, which is why an explicit default (0) is usually clearer for counters.',
      'collections.defaultdict(int) or Counter are the idiomatic tools for counting patterns.',
    ],
    hints: ['What is the signature of dict.get?', 'Which access form guarantees an exception on a missing key?'],
    objectives: ['Use get() with explicit defaults', 'Know when KeyError is actually helpful'],
  }),

  quizChallenge({
    id: 'py.comprehension-filter',
    category: 'python',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 6,
    concepts: ['comprehensions'],
    tags: ['python', 'comprehensions'],
    skills: ['Reading comprehensions'],
    subcategories: ['idioms'],
    title: 'The Filtered Doubling',
    subtitle: 'Map, filter, one line.',
    description: 'A comprehension with a conditional filter.',
    scenario: {
      language: 'python',
      code: `result = [x * 2 for x in range(5) if x % 2 == 0]
print(result)`,
    },
    question: 'What does the script print?',
    options: [
      '[0, 4, 8]',
      '[0, 2, 4, 6, 8]',
      '[2, 6]',
      '[0, 4, 8, 12, 16]',
    ],
    optionExplanations: [
      'Correct: x takes 0..4; the filter keeps 0, 2, 4; doubling yields 0, 4, 8.',
      'That is doubling without the filter — the `if` drops odd x.',
      'That doubles the odd values only — the condition selects even x.',
      'That doubles 0..8 — the range stops at 5.',
    ],
    reasoning: [
      'range(5) yields 0, 1, 2, 3, 4.',
      'x % 2 == 0 keeps 0, 2, 4.',
      'x * 2 maps them to 0, 4, 8 — filter runs before the map expression.',
    ],
    hints: ['Which values of range(5) satisfy x % 2 == 0?', 'The `if` clause filters input, not output.'],
    objectives: ['Read comprehensions as filter+map', 'Order the clauses correctly when writing them'],
  }),

  quizChallenge({
    id: 'py.exception-order',
    category: 'python',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 10,
    concepts: ['exceptions', 'error handling'],
    tags: ['python', 'exceptions'],
    skills: ['Exception hierarchy ordering'],
    subcategories: ['exceptions'],
    title: 'The Swallowed Detail',
    subtitle: 'A broad except hid the real bug.',
    description: 'Exception handler order determines which handler runs.',
    question:
      'A function may raise FileNotFoundError, PermissionError, or OSError. Both handlers appear in one try: `except OSError:` first, then `except FileNotFoundError:`. What is wrong, and what is the correct ordering principle?',
    options: [
      'Specific exceptions must come first; FileNotFoundError is a subclass of OSError, so the current order makes the second handler unreachable',
      'The order does not matter; Python matches the most specific handler regardless of position',
      'You cannot catch subclasses; OSError must be split into separate try blocks',
      'Only one except clause is allowed per try statement',
    ],
    optionExplanations: [
      'Correct: Python tests handlers top-down; the first whose class matches (including superclasses) wins, so the broad OSError swallows FileNotFoundError.',
      'Handler order is positional — Python does not reorder or search for the best match.',
      'Subclasses are caught by superclass handlers — that is exactly the problem here, not a limitation.',
      'A try may have any number of except clauses.',
    ],
    reasoning: [
      'PermissionError and FileNotFoundError both inherit from OSError.',
      'Match order is source order: broad-first ordering makes later specific handlers dead code.',
      'Order narrow subclasses first; use the broad class last as a fallback, ideally logging it.',
    ],
    hints: ['Check the inheritance chain: FileNotFoundError → OSError.', 'Handlers are evaluated like a chain of ifs.'],
    objectives: ['Order handlers narrow-first', 'Recognize unreachable handlers'],
  }),

  openChallenge({
    id: 'py.context-managers',
    category: 'python',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['context managers', 'resource safety'],
    tags: ['python', 'idioms'],
    skills: ['Resource management'],
    subcategories: ['idioms'],
    title: 'The Unclosed File',
    subtitle: 'Why `with` is not a style preference.',
    description: 'Explain what `with open(...)` guarantees that a manual close does not.',
    question:
      'Compare `f = open(path); data = f.read(); f.close()` with `with open(path) as f: data = f.read()`. What exactly does the with statement guarantee, what happens to the first version when read() raises, and how would you write your own context manager?',
    guidance: [
      'Name the protocol (__enter__/__exit__) and its guarantees.',
      'Trace the exception path in the manual version.',
      'Show the contextlib.decorator or generator-based way to define one.',
    ],
    solution: {
      summary:
        'with guarantees __exit__ runs when the block ends — normally or via exception — releasing the resource in every path. In the manual version an exception inside read() skips f.close(), leaking the file descriptor until GC. Own context managers are a __enter__/__exit__ class or a @contextmanager generator that try/finallys the cleanup.',
      reasoning: [
        'The with statement wraps the block in try/finally semantics: __exit__ receives the exception details if one propagated.',
        'Manual cleanup depends on reaching the close() line — any raise between open and close leaks.',
        'Generator-based context managers place the yield between setup and cleanup inside try/finally, giving the same guarantee with less boilerplate.',
      ],
      commonMistakes: [
        'Relying on CPython refcounting to close files "eventually" — timing is unspecified and other interpreters differ.',
        'Using contextlib.suppress broadly and hiding real errors.',
      ],
    },
    hints: ['What happens to the file descriptor if f.read() raises mid-parse?', 'contextlib.contextmanager turns a generator into the whole protocol.'],
    objectives: ['State the context-manager guarantee', 'Implement one from scratch'],
  }),

  openChallenge({
    id: 'py.gil-reality',
    category: 'python',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['concurrency', 'the GIL'],
    tags: ['python', 'concurrency'],
    skills: ['Concurrency model reasoning'],
    subcategories: ['concurrency'],
    title: 'The GIL Question',
    subtitle: 'Threads for IO, processes for CPU.',
    description: 'What the Global Interpreter Lock does and does not serialize.',
    question:
      'A teammate says "Python threads are useless because of the GIL." Give the accurate picture: what the GIL actually restricts, which workloads still benefit from threading, and which need multiprocessing or async.',
    guidance: [
      'Define the GIL precisely.',
      'Classify workloads: IO-bound, CPU-bound in Python, CPU-bound in C extensions.',
      'Name the standard library tools for each case.',
    ],
    solution: {
      summary:
        'The GIL serializes BYTECODE execution per process, not all work: IO-bound tasks release the GIL while waiting, so threading scales them well. CPU-bound pure-Python work gains nothing from threads — use multiprocessing (separate interpreters) or native extensions that release the GIL. Async (asyncio) suits massive IO concurrency in one thread.',
      reasoning: [
        'The GIL guards interpreter internals (refcounting); it is dropped during blocking syscalls and by NumPy/hashlib-style extensions.',
        'threads: IO-bound (requests, disk, DB). multiprocessing: CPU-bound Python code. asyncio: thousands of cooperative IO tasks.',
        'Free-threaded CPython (PEP 703) is changing this picture as an optional build — the classic model still applies to mainstream CPython.',
      ],
      commonMistakes: [
        'Claiming the GIL makes threads run one at a time for ALL work — IO overlaps fine.',
        'Using multiprocessing for IO-bound tasks and paying IPC costs for nothing.',
      ],
    },
    hints: ['When does a thread give the GIL back?', 'Match the tool to where the waiting happens.'],
    objectives: ['Describe the GIL accurately', 'Pick threading vs processes vs asyncio'],
  }),

  quizChallenge({
    id: 'py.dataclass-choice',
    category: 'python',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['dataclasses', 'modeling'],
    tags: ['python', 'design'],
    skills: ['Data modeling'],
    subcategories: ['idioms'],
    title: 'The Anemic Dict',
    subtitle: 'When a dict stops being enough.',
    description: 'Choosing between dicts, namedtuples and dataclasses for a domain record.',
    question:
      'A service passes order records between five functions: `{"id": ..., "items": [...], "total": ...}`. Typos in keys keep causing bugs. What is the strongest argument for switching to a dataclass?',
    options: [
      'Attribute access plus a declared field list gives typo-proof access, defaults, validation hooks and type checking — errors surface at the boundary, not deep in call five',
      'Dataclasses are always faster than dicts',
      'Dicts cannot be passed to functions',
      'Dataclasses automatically validate that total matches items',
    ],
    optionExplanations: [
      'Correct: the class declares the shape once; static checkers and IDEs verify every use; construction is the single validation point.',
      'Performance is not the argument — dicts are highly optimized and often faster for dynamic keys.',
      'Dicts pass fine; the problem is untyped shape, not passability.',
      'Nothing validates automatically — @dataclass adds fields, __init__ and repr; invariants still need explicit code.',
    ],
    reasoning: [
      'The failure mode (typo keys) is exactly what named shapes prevent.',
      'dataclass slots=True even reduces memory versus dicts.',
      'For fixed-shape records the dataclass documents the contract in code.',
    ],
    hints: ['Where do the typo bugs get caught today?', 'What does a static type checker do with `order.ttoal` on each type?'],
    objectives: ['Justify typed records over stringly dicts', 'Know what dataclasses do and do not give you'],
  }),
];
