import { debuggingChallenge, type QuestTemplate } from './framework.js';

/**
 * Debugging pool — realistic bugs with expected vs. actual behaviour, a root
 * cause, and a corrected implementation.
 */

export const debuggingTemplates: QuestTemplate[] = [
  debuggingChallenge({
    id: 'debug.closure-loop',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['closures', 'var hoisting'],
    tags: ['javascript', 'closures'],
    skills: ['Closure capture semantics'],
    subcategories: ['javascript'],
    title: 'The Three Identical Logs',
    subtitle: 'Every callback remembers the same number.',
    description:
      'Three callbacks should each remember their own loop index — instead they all report the final value.',
    language: 'javascript',
    brokenCode: `function makeCounters() {
  const fns = [];
  for (var i = 0; i < 3; i++) {
    fns.push(() => i);
  }
  return fns.map((fn) => fn());
}

console.log(makeCounters()); // expected [0, 1, 2]`,
    expectedBehaviour: 'The three closures capture distinct loop values, printing `[0, 1, 2]`.',
    actualBehaviour: 'All three closures print the final loop value: `[3, 3, 3]`.',
    fixedCode: `function makeCounters() {
  const fns = [];
  for (let i = 0; i < 3; i++) {
    fns.push(() => i);
  }
  return fns.map((fn) => fn());
}

console.log(makeCounters()); // [0, 1, 2]`,
    rootCause:
      '`var` declares one function-scoped binding shared by every iteration. Each closure captures a reference to that single binding, and by the time the callbacks run, the loop has finished and `i` is 3.',
    reasoning: [
      '`var i` creates a single binding whose scope is the whole function, not the iteration.',
      'Arrow functions capture variables by reference, not by value.',
      'All three closures point at the same `i`, which ends the loop at 3.',
      '`let` declares a fresh binding per iteration (the spec defines it that way), giving each closure its own `i`.',
    ],
    mistakes: [
      'Wrapping the callback in an IIFE `(function(j){ ... })(i)` fixes it too, but `let` is the modern fix.',
      'Blaming the arrow function — the culprit is the `var`.',
    ],
    hints: [
      'What is the scope of a variable declared with `var`?',
      'When do the closures read `i`, and what is its value by then?',
    ],
    objectives: [
      'Explain function-scoped vs. block-scoped bindings',
      'Fix closure-capture bugs with `let`',
    ],
  }),

  debuggingChallenge({
    id: 'debug.mutable-default',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['default arguments', 'mutability'],
    tags: ['python', 'gotchas'],
    skills: ['Python function semantics'],
    subcategories: ['python'],
    title: 'The Basket That Never Empties',
    subtitle: 'One list, remembered between calls.',
    description:
      'A Python helper accumulates items across calls — the mutable default argument, Python’s most famous trap.',
    language: 'python',
    brokenCode: `def add_item(item, basket=[]):
    basket.append(item)
    return basket

print(add_item("apple"))   # ['apple']
print(add_item("pear"))    # expected ['pear']`,
    expectedBehaviour:
      'Each call with no basket starts from an empty list: `["apple"]` then `["pear"]`.',
    actualBehaviour:
      'The second call returns `["apple", "pear"]` — the default list persists between calls.',
    fixedCode: `def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket`,
    rootCause:
      'Python evaluates default argument values once, at function definition time. The same list object is reused for every call that omits `basket`, so mutations accumulate.',
    reasoning: [
      'Defaults live on the function object (`add_item.__defaults__`) and are created once.',
      'A mutable default is therefore shared state across all calls.',
      'The `None` sentinel pattern creates a fresh list per call, which is the idiomatic fix.',
    ],
    mistakes: [
      'Using `basket=basket or []` — it also mutates callers who pass a falsy-but-real list.',
      'Blaming `append` — the shared object is the problem, not the mutation API.',
    ],
    hints: [
      'When is a default argument value evaluated in Python?',
      'Try inspecting `add_item.__defaults__` after each call.',
    ],
    objectives: [
      'Understand Python’s one-time default evaluation',
      'Apply the `None` sentinel idiom',
    ],
  }),

  debuggingChallenge({
    id: 'debug.sort-mutates',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['mutation vs copy', 'array methods'],
    tags: ['javascript', 'arrays'],
    skills: ['Distinguishing mutators from non-mutators'],
    subcategories: ['javascript'],
    title: 'The Original Order Vanishes',
    subtitle: 'Sorting for display destroyed the source.',
    description: 'Sorting a copy of the leaderboard accidentally sorted the leaderboard itself.',
    language: 'javascript',
    brokenCode: `const scores = [42, 7, 19];
const display = scores.sort();
console.log(scores);   // expected [42, 7, 19]
console.log(display);  // expected [7, 19, 42]`,
    expectedBehaviour: 'The original array stays `[42, 7, 19]` while `display` is sorted.',
    actualBehaviour: 'Both arrays print `[7, 19, 42]` — `scores` was mutated in place.',
    fixedCode: `const scores = [42, 7, 19];
const display = scores.toSorted();
console.log(scores);   // [42, 7, 19]
console.log(display);  // [7, 19, 42]`,
    rootCause:
      '`Array.prototype.sort` sorts in place and returns the same array reference. Assigning its result to `display` creates no copy — both names point at one mutated array.',
    reasoning: [
      '`.sort()` mutates and returns `this`; `.reverse()` and `.splice()` behave the same way.',
      'The variable assignment copies the reference, never the contents.',
      'ES2023 added non-mutating twins: `toSorted`, `toReversed`, `toSpliced`, and `with`.',
    ],
    mistakes: [
      'Assuming the returned value is a new array because it is assigned to a new variable.',
      'Using `[...scores].sort()` — also correct, and clearer on older runtimes.',
    ],
    hints: [
      'Which array methods return new arrays, and which return the same reference?',
      'Check whether `display === scores` in the broken version.',
    ],
    objectives: ['Know which array methods mutate', 'Choose between spread-copy and `toSorted`'],
  }),

  debuggingChallenge({
    id: 'debug.foreach-async',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['async/await', 'callback semantics'],
    tags: ['javascript', 'async'],
    skills: ['Asynchronous control flow'],
    subcategories: ['async'],
    title: 'The Impatient Fetcher',
    subtitle: 'forEach does not wait for anyone.',
    description: 'A function that awaits inside `forEach` returns before any fetch has finished.',
    language: 'javascript',
    brokenCode: `async function loadNames(ids) {
  const names = [];
  ids.forEach(async (id) => {
    const res = await fetchName(id);
    names.push(res);
  });
  return names;
}

// caller:
const names = await loadNames([1, 2, 3]);
console.log(names.length); // expected 3`,
    expectedBehaviour: '`loadNames` resolves with all three fetched names, so the length is 3.',
    actualBehaviour:
      'The length is 0 — the function returns the empty array long before the fetches resolve.',
    fixedCode: `async function loadNames(ids) {
  const names = await Promise.all(
    ids.map((id) => fetchName(id))
  );
  return names;
}`,
    rootCause:
      '`forEach` ignores the promises its callback returns. The `async` callback starts each fetch but nothing joins them; `loadNames` returns `names` synchronously after scheduling the work.',
    reasoning: [
      '`async` functions return promises; `forEach` neither awaits nor collects them.',
      'The pushes happen later, after the caller has already received the empty array.',
      '`Promise.all` (or a `for...of` loop with `await`) is the correct join point; `map` + `Promise.all` also runs the fetches concurrently.',
    ],
    mistakes: [
      'Using `for...of` with `await` when concurrency is desired — correct but sequential.',
      'Adding `.then` inside `forEach` and still not joining the promises.',
    ],
    hints: [
      'What does `forEach` do with the return value of its callback?',
      'You need a place where all three promises are collected and awaited.',
    ],
    objectives: [
      'Explain why `await` inside `forEach` does not serialize',
      'Join concurrent work with `Promise.all`',
    ],
  }),

  debuggingChallenge({
    id: 'debug.slice-off-by-one',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['off-by-one', 'slice semantics'],
    tags: ['javascript', 'arrays'],
    skills: ['Boundary analysis'],
    subcategories: ['javascript'],
    title: 'The Head That Ate the Tail',
    subtitle: 'One character too many.',
    description: 'A filename extension stripper that leaves the dot behind.',
    language: 'javascript',
    brokenCode: `function stripExtension(filename) {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return filename;
  return filename.slice(0, dot + 1);
}

console.log(stripExtension("report.pdf")); // expected "report"`,
    expectedBehaviour: '`stripExtension("report.pdf")` returns `"report"`.',
    actualBehaviour: 'It returns `"report."` — the dot survives.',
    fixedCode: `function stripExtension(filename) {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return filename;
  return filename.slice(0, dot);
}`,
    rootCause:
      '`slice(0, end)` excludes the index `end`. Using `dot + 1` as the end keeps the character AT `dot` — the dot itself. The second argument is an exclusive bound, not a length.',
    reasoning: [
      '`lastIndexOf` returns the index OF the dot (0-based).',
      '`slice` is end-exclusive: `slice(0, dot)` keeps characters 0..dot-1.',
      'Adding 1 re-includes the dot — a textbook inclusive/exclusive mix-up.',
    ],
    mistakes: [
      'Confusing `slice` (end-exclusive) with `substr` (length).',
      'Not handling the `-1` no-dot case, which this code luckily gets right.',
    ],
    hints: [
      'Write out the indices of "report.pdf" and mark where the dot sits.',
      'Is `slice`’s second argument inclusive or exclusive?',
    ],
    objectives: [
      'Internalize end-exclusive slicing',
      'Trace boundary arithmetic on concrete indices',
    ],
  }),

  debuggingChallenge({
    id: 'debug.float-money',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['floating point', 'ieee 754'],
    tags: ['javascript', 'floating-point'],
    skills: ['IEEE-754 awareness', 'Money handling'],
    subcategories: ['floating-point'],
    title: 'The Penny That Wasn’t There',
    subtitle: '0.1 + 0.2 has opinions.',
    description: 'A shopping cart total that drifts by a fraction of a cent.',
    language: 'javascript',
    brokenCode: `function total(cents) {
  let sum = 0;
  for (const c of cents) {
    sum += c / 100;
  }
  return sum;
}

console.log(total([19, 99, 49, 33])); // expected 2.00`,
    expectedBehaviour: 'The four prices sum to exactly `2.0`.',
    actualBehaviour:
      'It prints `1.9999999999999998` — binary floating point cannot represent the decimal intermediates exactly.',
    fixedCode: `function total(cents) {
  let sum = 0;
  for (const c of cents) {
    sum += c;
  }
  return sum / 100;
}`,
    rootCause:
      'Dividing each price by 100 produces non-representable binary fractions whose errors accumulate across four additions. Keeping integer cents and dividing once confines the rounding to a single, display-level step.',
    reasoning: [
      '0.19, 0.99, 0.49, 0.33 are all repeating values in base 2.',
      'Each division and addition rounds to the nearest double; errors compound.',
      'Integer arithmetic in cents is exact up to 2^53, and one final division bounds the error.',
    ],
    mistakes: [
      'Reaching for `toFixed(2)` mid-loop — it returns strings and hides the problem.',
      'Storing money as floats at all; integers or a decimal type are the real fix.',
    ],
    hints: [
      'Which of the four numbers can be represented exactly in binary?',
      'Delay the division: compute in the unit the input already gives you.',
    ],
    objectives: ['Recognize binary-representation drift', 'Structure money math to stay exact'],
  }),

  debuggingChallenge({
    id: 'debug.this-timeout',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['this binding', 'callbacks'],
    tags: ['javascript', 'this'],
    skills: ['Understanding `this` binding rules'],
    subcategories: ['javascript'],
    title: 'The Nameless Reporter',
    subtitle: 'A method loses its owner on the way to the timer.',
    description: '`setTimeout` calls a method later — and the method forgets who it belongs to.',
    language: 'javascript',
    brokenCode: `const reporter = {
  name: "dailyquest",
  greet() {
    setTimeout(function () {
      console.log("Hello from " + this.name);
    }, 100);
  },
};

reporter.greet(); // expected: Hello from dailyquest`,
    expectedBehaviour: 'After 100 ms the timer prints `Hello from dailyquest`.',
    actualBehaviour:
      'It prints `Hello from undefined` — `this` is not the reporter inside the callback.',
    fixedCode: `const reporter = {
  name: "dailyquest",
  greet() {
    setTimeout(() => {
      console.log("Hello from " + this.name);
    }, 100);
  },
};`,
    rootCause:
      'Regular functions get their `this` from how they are CALLED. `setTimeout` invokes the callback as a plain function, so `this` falls back to the global object (or undefined in strict mode). Arrow functions have no `this` of their own — they inherit it lexically from `greet`.',
    reasoning: [
      'The callback is passed as a bare function reference; the timer calls it without a receiver.',
      'Default binding sends `this` to globalThis (or undefined under strict mode).',
      'An arrow function closes over the `this` of `greet`, which is `reporter`.',
      '`.bind(reporter)` achieves the same result with a regular function.',
    ],
    mistakes: [
      'Using an arrow method DEFINITION (`greet: () => {...}`) — that would lose `reporter` at the outer level instead.',
      'Storing `const self = this` — works, but is the pre-ES6 workaround.',
    ],
    hints: [
      '`this` is decided at call time for regular functions — who calls this one?',
      'Arrow functions resolve `this` where they are WRITTEN, not where they run.',
    ],
    objectives: [
      'Predict `this` under the four binding rules',
      'Fix lost bindings with arrows or bind',
    ],
  }),

  debuggingChallenge({
    id: 'debug.missing-await',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['promises', 'async/await'],
    tags: ['javascript', 'async'],
    skills: ['Spotting floating promises'],
    subcategories: ['async'],
    title: 'The Promise That Ran Ahead',
    subtitle: 'One missing `await` changes the story.',
    description: 'A stats function returns before its expensive computation has finished.',
    language: 'javascript',
    brokenCode: `async function buildStats(rows) {
  const summary = computeHeavy(rows); // async
  return { count: rows.length, summary };
}

// caller:
const stats = await buildStats(rows);
console.log(typeof stats.summary.then); // expected "undefined"`,
    expectedBehaviour: '`stats.summary` is the finished object, not a thenable.',
    actualBehaviour:
      '`stats.summary` is a Promise — the caller inspects `.then` because the result was never awaited.',
    fixedCode: `async function buildStats(rows) {
  const summary = await computeHeavy(rows);
  return { count: rows.length, summary };
}`,
    rootCause:
      'Calling an async function returns a promise immediately; without `await`, that promise is stored in `summary` and returned as-is. The work still completes eventually, but the caller receives a promise instead of a value.',
    reasoning: [
      '`computeHeavy` is async, so the call resolves to a Promise object.',
      'Nothing in `buildStats` awaits it — a "floating promise".',
      'The returned object embeds the promise; TypeScript would flag the type, plain JS hides it until runtime.',
    ],
    mistakes: [
      'Assuming `async` callers auto-await sub-calls.',
      'Fixing with `.then(summary => ...)` and forgetting to await THAT too.',
    ],
    hints: [
      'What is the return type of calling an `async` function?',
      'Trace the type of `summary` line by line.',
    ],
    objectives: ['Recognize floating promises', 'Use `await` at the point of composition'],
  }),

  debuggingChallenge({
    id: 'debug.parseint-garbage',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['parseInt semantics', 'input validation'],
    tags: ['javascript', 'parsing'],
    skills: ['Strict validation'],
    subcategories: ['javascript'],
    title: 'The Lenient Port Number',
    subtitle: 'parseInt stops at the first lie.',
    description: 'A port validator accepts "8080abc" as a valid port.',
    language: 'javascript',
    brokenCode: `function isValidPort(input) {
  const port = parseInt(input, 10);
  return port >= 0 && port <= 65535;
}

console.log(isValidPort("8080abc")); // expected false`,
    expectedBehaviour: '"8080abc" is rejected: `false`.',
    actualBehaviour:
      'It returns `true` — `parseInt` parsed the leading `8080` and silently ignored the rest.',
    fixedCode: `function isValidPort(input) {
  return /^\\d+$/.test(input) && Number(input) >= 0 && Number(input) <= 65535;
}`,
    rootCause:
      '`parseInt` performs a prefix parse: it consumes as many numeric characters as it can and discards trailing garbage, returning a number even when the string as a whole is invalid.',
    reasoning: [
      '`parseInt("8080abc", 10)` → 8080, which passes the range check.',
      'The range check was applied to a number that does not correspond to the full input.',
      'Validating the SHAPE first (regex) and converting second rejects garbage outright.',
    ],
    mistakes: [
      'Fixing with `String(port) === input` — it fails for "0080" and similar forms.',
      'Using `Number()` alone: it returns NaN for garbage (fine) but also accepts hex "0x1F" and whitespace-padded strings.',
    ],
    hints: [
      'Does `parseInt` tell you whether it consumed the whole string?',
      'Two-step validation: shape first, value second.',
    ],
    objectives: ['Understand prefix parsing behaviour', 'Validate input shape before converting'],
  }),

  debuggingChallenge({
    id: 'debug.list-aliasing',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['references', 'aliasing'],
    tags: ['python', 'references'],
    skills: ['Reference vs value semantics'],
    subcategories: ['python'],
    title: 'The Doubly-Edited Draft',
    subtitle: 'Two names, one list.',
    description: 'Creating a "backup" of a list in Python backs up a reference, not the data.',
    language: 'python',
    brokenCode: `draft = ["intro", "body"]
backup = draft
draft.append("conclusion")

print(backup)  # expected ['intro', 'body']`,
    expectedBehaviour: '`backup` still holds the original two items.',
    actualBehaviour:
      '`backup` prints `["intro", "body", "conclusion"]` — both names reference the same list.',
    fixedCode: `draft = ["intro", "body"]
backup = draft.copy()  # or list(draft), or draft[:]
draft.append("conclusion")

print(backup)  # ['intro', 'body']`,
    rootCause:
      'Assignment in Python binds a name to an object; it never copies. `backup = draft` makes both names point at one list, so mutations through either name are visible through both.',
    reasoning: [
      'Python variables are references to objects on the heap.',
      '`.copy()`, `list(x)` and slicing produce shallow copies suitable for flat lists.',
      'Nested structures need `copy.deepcopy` to avoid the same trap one level deeper.',
    ],
    mistakes: [
      'Using `copy.copy` on nested lists and still sharing inner lists.',
      'Assuming assignment copies because it looks like `b = a` copying in value languages.',
    ],
    hints: [
      'What does the assignment operator copy in Python — objects, or references?',
      'Try `draft is backup` in the broken version.',
    ],
    objectives: ['Distinguish binding from copying', 'Choose the right copy depth'],
  }),

  debuggingChallenge({
    id: 'debug.splice-while-iterating',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['mutation during iteration', 'array methods'],
    tags: ['javascript', 'arrays'],
    skills: ['Safe removal patterns'],
    subcategories: ['javascript'],
    title: 'The Skipping Janitor',
    subtitle: 'Remove elements while walking the list, miss half of them.',
    description:
      'A cleanup loop that splices as it goes skips the element right after each removal.',
    language: 'javascript',
    brokenCode: `const queue = ["a", "junk", "junk", "b", "junk", "c"];
queue.forEach((item, index) => {
  if (item === "junk") queue.splice(index, 1);
});
console.log(queue); // expected ["a", "b", "c"]`,
    expectedBehaviour: 'All three "junk" entries are removed: `["a", "b", "c"]`.',
    actualBehaviour:
      'One "junk" survives — `["a", "junk", "b", "c"]` — because forEach visits indexes 0,1,2,… while the array shrinks underneath it.',
    fixedCode: `const queue = ["a", "junk", "junk", "b", "junk", "c"];
const kept = queue.filter((item) => item !== "junk");
console.log(kept); // ["a", "b", "c"]`,
    rootCause:
      'Removing an element shifts every later element down one index, but `forEach` keeps incrementing its internal index. The element that slid into the removed slot is never visited.',
    reasoning: [
      'splice(i, 1) moves element i+1 into position i.',
      'forEach’s next iteration looks at i+1 — skipping the element that just moved into i.',
      '`filter` builds the result without touching the source, which is the idiomatic fix.',
    ],
    mistakes: [
      'Iterating backwards with a for-loop also works, but `filter` states the intent directly.',
      'Deleting during iteration of ANY live collection (DOM nodes included) hits the same shift problem.',
    ],
    hints: [
      'After a removal, which element falls into the current index?',
      'Which array method is designed exactly for "keep some, drop some"?',
    ],
    objectives: ['Diagnose mutation-during-iteration bugs', 'Prefer `filter` for removals'],
  }),

  debuggingChallenge({
    id: 'debug.empty-max',
    category: 'debugging',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['edge cases', 'spread semantics'],
    tags: ['javascript', 'edge-cases'],
    skills: ['Empty-input defensiveness'],
    subcategories: ['javascript'],
    title: 'The Impossible Maximum',
    subtitle: 'An empty cart reports −Infinity.',
    description:
      'A "featured price" helper returns −Infinity when the catalogue is empty, and the UI happily renders it.',
    language: 'javascript',
    brokenCode: `function featuredPrice(prices) {
  return Math.max(...prices);
}

console.log(featuredPrice([])); // expected null`,
    expectedBehaviour: 'An empty list yields `null` so the caller can show "no featured price".',
    actualBehaviour:
      'It returns `-Infinity`, which is truthy and renders as "−Infinity" in the UI.',
    fixedCode: `function featuredPrice(prices) {
  if (prices.length === 0) return null;
  return Math.max(...prices);
}`,
    rootCause:
      'Spreading an empty array calls `Math.max()` with no arguments, which is defined to return −Infinity. The function then leaks that sentinel value into UI logic that expects a real price or null.',
    reasoning: [
      '`Math.max()` with zero arguments is −Infinity by specification (the identity for max).',
      '−Infinity is truthy, so `if (featuredPrice(list))` guards do not catch it.',
      'Explicit empty-input handling at the boundary is cheaper than sanitizing downstream.',
    ],
    mistakes: [
      'Guarding with a falsy check — `-Infinity` is truthy.',
      'Using `reduce(Math.max)` without an initial value, which THROWS on empty arrays (a different failure mode).',
    ],
    hints: [
      'What does `Math.max()` print when called with no arguments at all?',
      'Decide the contract for empty input before computing anything.',
    ],
    objectives: [
      'Know the no-argument identity of Math.max',
      'Design explicit empty-input contracts',
    ],
  }),
];
