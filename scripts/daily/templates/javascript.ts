import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * JavaScript pool — language semantics that surprise working developers:
 * the event loop, promises, scopes, prototypes and array methods.
 */

export const javascriptTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'js.event-loop-order',
    category: 'javascript',
    challengeType: 'output_prediction',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['event loop', 'microtasks'],
    tags: ['event-loop', 'async'],
    skills: ['Event loop ordering'],
    subcategories: ['async'],
    title: 'The Queue Order',
    subtitle: 'Sync, then microtasks, then macrotasks.',
    description: 'A classic scheduling puzzle: setTimeout, Promise.then and a synchronous log.',
    scenario: {
      language: 'javascript',
      code: `console.log('a');
setTimeout(() => console.log('b'), 0);
Promise.resolve().then(() => console.log('c'));
console.log('d');`,
    },
    question: 'In what order do the four letters print?',
    options: [
      'a, d, c, b',
      'a, b, c, d',
      'a, c, d, b',
      'b, a, d, c',
    ],
    optionExplanations: [
      'Correct: synchronous code first (a, d), then the microtask queue drains (c), then the macrotask timer fires (b).',
      'Timers never jump ahead of microtasks or the rest of the synchronous script.',
      'Promise callbacks are microtasks — they run after the synchronous stack clears, before timers.',
      'Nothing runs before the synchronous portion of the script.',
    ],
    reasoning: [
      "The call stack finishes first: 'a' then 'd'.",
      "The microtask queue (promise callbacks) drains completely next: 'c'.",
      "Only then does the event loop pick a macrotask — the timer: 'b'.",
    ],
    hints: ['Microtasks always drain before the next macrotask.', 'setTimeout(…, 0) is a macrotask, not an immediate call.'],
    objectives: ['Order sync, microtask, and macrotask work', 'Predict event loop interleavings'],
  }),

  quizChallenge({
    id: 'js.let-tdz',
    category: 'javascript',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['temporal dead zone', 'let vs var'],
    tags: ['javascript', 'scoping'],
    skills: ['TDZ reasoning'],
    subcategories: ['scoping'],
    title: 'The Dead Zone Entry',
    subtitle: 'let exists but cannot be touched.',
    description: 'Accessing a let variable before its declaration throws — why the TDZ exists.',
    scenario: {
      language: 'javascript',
      code: `function demo() {
  console.log(x); // line A
  let x = 5;
}

demo();`,
    },
    question: 'What happens when line A executes?',
    options: [
      'A ReferenceError is thrown',
      'undefined is printed',
      'null is printed',
      '5 is printed',
    ],
    optionExplanations: [
      'Correct: let/const bindings are hoisted to their block but stay uninitialized in the temporal dead zone until the declaration executes — reading them throws.',
      'That is var behaviour. let bindings are not initialized to undefined; they are uninitialized.',
      'No coercion or defaulting applies — the binding is simply not initialized yet.',
      'The declaration has not executed yet, so the value does not exist.',
    ],
    reasoning: [
      'All declarations are hoisted; the difference is initialization.',
      'var starts as undefined; let/const start uninitialized (TDZ).',
      'The TDZ turns read-before-declare into a loud error instead of a silent undefined — a deliberate safety feature.',
    ],
    hints: ['Hoisting moves the binding, not the value, for every declaration kind.', 'The temporal dead zone ends exactly at the declaration statement.'],
    objectives: ['Explain the temporal dead zone', 'Contrast var, let and const initialization'],
  }),

  openChallenge({
    id: 'js.prototype-chain',
    category: 'javascript',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['prototypes', 'property lookup'],
    tags: ['javascript', 'prototypes'],
    skills: ['Prototype chain tracing'],
    subcategories: ['objects'],
    title: 'The Lookup Ladder',
    subtitle: 'Where does JS stop climbing?',
    description: 'Explain exactly how JavaScript finds a property on an object, and what happens when it reaches the top.',
    question:
      'Given `const base = { greet() { return "hi"; } }; const obj = Object.create(base); obj.greet()`, trace the full property lookup. What roles do `[[Prototype]]`, `Object.prototype` and `null` play, and how do `__proto__`, `Object.getPrototypeOf` and `Object.create` relate to the chain?',
    guidance: [
      'Describe the lookup order step by step.',
      'State what the chain terminates at and why.',
      'Contrast the prototype chain with class inheritance in other languages.',
    ],
    solution: {
      summary:
        'Lookup starts on the object itself, then follows the internal [[Prototype]] link object by object until the property is found or the chain ends at null. obj has no own greet, base does; obj’s chain is obj → base → Object.prototype → null.',
      reasoning: [
        'Every object carries an internal [[Prototype]] slot; `Object.create(base)` sets obj’s slot to base.',
        'Own properties are checked first: obj has none called greet.',
        'The engine follows the chain: base has greet, so it is returned — `this` binds to obj, the receiver of the call.',
        'If base lacked it, Object.prototype (the root of most chains) would be searched, then null ends the search with undefined.',
        'Unlike classical inheritance, this is delegation of property access at runtime — the chain can be inspected with Object.getPrototypeOf and is not compiled into a vtable.',
      ],
      alternatives: [
        'Classes are syntax over this machinery: methods live on the constructor’s prototype object, instances delegate to it.',
      ],
      commonMistakes: [
        'Confusing `__proto__` (a getter/setter) with `prototype` (a property of constructor functions).',
        'Assuming copies are made — delegation shares the function, no copying occurs.',
      ],
    },
    hints: ['Follow the internal link one object at a time.', 'Every chain in practice ends at Object.prototype, then null.'],
    objectives: ['Trace prototype delegation precisely', 'Distinguish [[Prototype]] from constructor.prototype'],
  }),

  quizChallenge({
    id: 'js.array-method-mutation',
    category: 'javascript',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['array methods', 'mutation'],
    tags: ['javascript', 'arrays'],
    skills: ['Mutator vs accessor methods'],
    subcategories: ['arrays'],
    title: 'The Mutating Method',
    subtitle: 'Which one leaves the original alone?',
    description: 'Four array operations — only some return new arrays.',
    question: 'Which of these calls does NOT mutate the original array?',
    options: [
      'const copy = items.map((x) => x * 2)',
      'items.sort()',
      'items.splice(0, 1)',
      'items.reverse()',
    ],
    optionExplanations: [
      'Correct: map always returns a new array and never touches the source.',
      'sort sorts in place and returns the same array reference.',
      'splice removes elements in place — the classic mutator.',
      'reverse reverses in place (use toReversed for a copy on modern runtimes).',
    ],
    reasoning: [
      'The mutators are: push, pop, shift, unshift, splice, sort, reverse, fill, copyWithin.',
      'The accessors/iterators (map, filter, slice, concat, flat) return new arrays.',
      'ES2023 added non-mutating twins for the dangerous ones: toSorted, toReversed, toSpliced, with.',
    ],
    hints: ['Think about which method’s job is to BUILD a new array.', 'ES2023 introduced spelled-out "to" variants for a reason.'],
    objectives: ['Classify array methods by mutation', 'Reach for toSorted/toReversed when needed'],
  }),

  openChallenge({
    id: 'js.promise-states',
    category: 'javascript',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['promises', 'async semantics'],
    tags: ['javascript', 'async'],
    skills: ['Promise state machine'],
    subcategories: ['async'],
    title: 'The Settled Promise',
    subtitle: 'Why can a promise never change its mind?',
    description: 'Explain the promise lifecycle and what "settled" locks in.',
    question:
      'Describe the states a promise can be in, the transition rules between them, and the consequences for code that calls `resolve` twice or attaches `.then` after settlement.',
    guidance: [
      'Name the states and the legal transitions.',
      'Explain idempotent settling: what double resolve actually does.',
      'Explain late attachment of then/catch handlers.',
    ],
    solution: {
      summary:
        'A promise starts pending and settles exactly once: to fulfilled (with a value) or rejected (with a reason). Settling is final — further resolve/reject calls are ignored — and handlers attached after settlement still run, via the microtask queue.',
      reasoning: [
        'pending → fulfilled or pending → rejected are the only transitions; there is no un-settle.',
        'The first resolve/reject wins; subsequent calls are no-ops by specification.',
        'then registers callbacks that fire later regardless of whether the promise is settled already — if it is, the callback is queued immediately as a microtask.',
        'This one-way lifecycle is what makes async composition predictable: a value or error arrives exactly once.',
      ],
      commonMistakes: [
        'Assuming a second resolve throws — it silently does nothing.',
        'Thinking late .then handlers are dropped — they always fire.',
      ],
    },
    hints: ['"Settled" is the umbrella term — which two states does it cover?', 'What does `.then` on an already-resolved promise do?'],
    objectives: ['Model the promise state machine', 'Predict double-resolve and late-handler behaviour'],
  }),

  quizChallenge({
    id: 'js.strict-mode',
    category: 'javascript',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['strict mode'],
    tags: ['javascript', 'semantics'],
    skills: ['Strict mode rules'],
    subcategories: ['language'],
    title: 'The Slippery Slope Blocker',
    subtitle: 'What does "use strict" actually forbid?',
    description: 'Strict mode turns several silent failures into errors.',
    question: 'Which behaviour is changed by strict mode?',
    options: [
      'Assigning to an undeclared variable throws a ReferenceError',
      'Array indices become 1-based',
      'All asynchronous code becomes synchronous',
      'Loose equality (==) is disabled at parse time',
    ],
    optionExplanations: [
      'Correct: without strict mode, assignment to an undeclared name silently creates a global; strict mode throws instead.',
      'Indexing is unchanged everywhere — strict mode has nothing to do with arrays’ indexing.',
      'Strict mode changes error reporting and bindings, never the concurrency model.',
      '== keeps working; linters discourage it, but the language does not forbid it.',
    ],
    reasoning: [
      'Strict mode’s headline fixes: no implicit globals, this is undefined in bare calls, duplicate parameter names rejected, silent write failures throw.',
      'It is opt-in per script/module/function via the "use strict" directive; ES modules are always strict.',
    ],
    hints: ['Think about the "implicit global" footgun.', 'Modules are always strict — how often do you see the directive there?'],
    objectives: ['List the key strict-mode changes', 'Know where strict mode applies automatically'],
  }),

  openChallenge({
    id: 'js.event-loop-deep',
    category: 'javascript',
    challengeType: 'reasoning',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['event loop', 'microtasks', 'starvation'],
    tags: ['event-loop', 'performance'],
    skills: ['Event loop mastery'],
    subcategories: ['async'],
    title: 'The Starvation Scenario',
    subtitle: 'When microtasks never let the page breathe.',
    description: 'Explain how a self-perpetuating microtask can starve rendering, and how to break the cycle.',
    question:
      'A developer writes `Promise.resolve().then(function loop() { Promise.resolve().then(loop); })` and the UI freezes even though no timer is pending. Explain why, and describe the scheduling options that would let rendering happen between iterations.',
    guidance: [
      'Explain the microtask queue drain rule that causes the freeze.',
      'Name at least two scheduling mechanisms that yield to rendering.',
      'State when each mechanism is the right choice.',
    ],
    solution: {
      summary:
        'The event loop drains the ENTIRE microtask queue before rendering or timers run. A microtask that enqueues another microtask keeps that drain alive forever, so no paint ever happens. Scheduling with setTimeout/setInterval (macrotask), requestAnimationFrame (before paint) or requestIdleCallback breaks the cycle.',
      reasoning: [
        'Microtask drain is exhaustive: every microtask added during the drain is also processed in the same drain phase.',
        'Rendering sits between event loop iterations, after microtasks and before the next macrotask — so an infinite microtask chain starves paint.',
        'setTimeout(0) queues a macrotask, forcing the loop to complete an iteration (including rendering) first.',
        'requestAnimationFrame aligns work with the next paint; requestIdleCallback runs when the browser is idle.',
        'For chunked computation, yielding via `await new Promise(r => setTimeout(r))` every N items is the pragmatic fix.',
      ],
      commonMistakes: [
        'Believing `await` yields to rendering — awaiting an already-resolved promise adds a microtask and does NOT paint.',
        'Recommending setImmediate (Node-only) for browser code.',
      ],
    },
    hints: ['What is the exit condition for the microtask drain?', 'Which APIs schedule macrotasks?'],
    objectives: ['Explain microtask starvation precisely', 'Choose the right yielding primitive'],
  }),

  quizChallenge({
    id: 'js.optional-chaining',
    category: 'javascript',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 6,
    concepts: ['optional chaining', 'nullish coalescing'],
    tags: ['javascript', 'syntax'],
    skills: ['Modern syntax semantics'],
    subcategories: ['syntax'],
    title: 'The Short-Circuit Chain',
    subtitle: 'What does ?. return when it bails?',
    description: 'Optional chaining and nullish coalescing working together.',
    scenario: {
      language: 'javascript',
      code: `const user = null;
const city = user?.address?.city ?? 'unknown';
console.log(city);
console.log(user?.name?.length);`,
    },
    question: 'What does the snippet print?',
    options: [
      'unknown\nundefined',
      'unknown\nnull',
      "TypeError is thrown",
      "''\nundefined",
    ],
    optionExplanations: [
      'Correct: optional chaining short-circuits to undefined, and ?? replaces undefined (and null) with the fallback.',
      'Optional chaining produces undefined, never null — null only propagates from the data itself.',
      'The whole point of ?. is to avoid throwing on null/undefined in the chain.',
      "An empty string is not produced; the short-circuit value is exactly undefined.",
    ],
    reasoning: [
      'user is null → user?.address?.city short-circuits to undefined without evaluating further.',
      'undefined ?? "unknown" → "unknown" (?? triggers on both null and undefined).',
      'user?.name?.length likewise yields undefined.',
    ],
    hints: ['?. evaluates to undefined the moment the left side is null or undefined.', '?? and || differ on falsy-but-defined values.'],
    objectives: ['Predict ?. short-circuit values', 'Combine ?. with ?? correctly'],
  }),

  openChallenge({
    id: 'js.this-four-rules',
    category: 'javascript',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 18,
    concepts: ['this binding'],
    tags: ['javascript', 'this'],
    skills: ['Binding rules'],
    subcategories: ['objects'],
    title: 'The Four Faces of this',
    subtitle: 'Default, implicit, explicit, new.',
    description: 'Lay out the complete `this` decision procedure for regular functions and arrow functions.',
    question:
      'State the four binding rules for regular functions in priority order, explain how arrow functions differ, and predict `this` in a method extracted into a callback.',
    guidance: [
      'Order the rules: new > explicit (bind/call/apply) > implicit (receiver) > default.',
      'Explain arrow-function lexical this and its immunity to bind/call.',
      'Apply the rules to the classic extracted-method bug.',
    ],
    solution: {
      summary:
        'For a regular function call, `this` is decided by: (1) new — the freshly created object; (2) explicit binding via call/apply/bind; (3) implicit binding — the receiver left of the dot; (4) default — globalThis, or undefined in strict mode. Arrow functions skip all four and capture `this` lexically from their enclosing scope.',
      reasoning: [
        'Priority matters: `new` beats bind; bind beats the receiver.',
        'Arrow functions cannot be re-bound — calling .bind/.call on them changes nothing for `this`.',
        'Extracting `const m = obj.method; m()` drops the receiver → default binding → undefined under strict mode.',
        'The fixes: bind once, wrap in an arrow, or use a class field arrow method.',
      ],
      commonMistakes: [
        'Believing `this` is fixed at function definition for regular functions.',
        'Using an arrow function as an object method and losing the receiver entirely.',
      ],
    },
    hints: ['Who CALLS the function is the question — arrow functions are the exception.', 'Sort the rules by precedence before applying them.'],
    objectives: ['Recite the binding precedence', 'Fix extracted-method bugs deliberately'],
  }),
];
