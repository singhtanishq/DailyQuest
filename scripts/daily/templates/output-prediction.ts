import { predictionChallenge, type QuestTemplate } from './framework.js';

/**
 * Output prediction pool.
 *
 * Every snippet is executed in a Node `vm` sandbox during generation and the
 * stored expected output is whatever the snippet actually printed. A snippet
 * whose claimed output disagrees with its real behaviour fails generation.
 *
 * Ground rules for snippets: pure, deterministic, no timers, no randomness,
 * no locale-dependent formatting, primitives printed via console.log.
 */

export const predictionTemplates: QuestTemplate[] = [
  predictionChallenge({
    id: 'pred.plus-vs-minus',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 5,
    concepts: ['type coercion', 'operator overloading'],
    tags: ['javascript', 'coercion'],
    skills: ['Coercion rules'],
    subcategories: ['coercion'],
    title: 'The Two-Faced Operator',
    subtitle: 'Same values, opposite operators.',
    description: 'Addition and subtraction treat the string "5" very differently.',
    snippet: `console.log('5' + 3);
console.log('5' - 3);`,
    output: '53\n2',
    reasoning: [
      'The `+` operator prefers string concatenation when either operand is a string: "5" + 3 → "53".',
      'The `-` operator has no string mode: both operands are coerced to numbers, so "5" - 3 → 2.',
      'One operator overloads for strings, the other never does — that is the whole trick.',
    ],
    hints: ['`+` is the only arithmetic operator with a string mode.', 'What happens when a string must become a number for subtraction?'],
    objectives: ['State the `+` concatenation rule', 'Explain numeric-only coercion for `-`, `*`, `/`'],
  }),

  predictionChallenge({
    id: 'pred.hoisted-var',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 5,
    concepts: ['hoisting', 'temporal dead zone'],
    tags: ['javascript', 'hoisting'],
    skills: ['Declaration hoisting'],
    subcategories: ['hoisting'],
    title: 'The Declaration Time Machine',
    subtitle: 'Read before write — with var.',
    description: 'A variable is logged before its declaration line inside a function.',
    snippet: `function announce() {
  console.log(name);
  var name = 'dailyquest';
  console.log(name);
}

announce();`,
    output: 'undefined\ndailyquest',
    reasoning: [
      '`var` declarations are hoisted to the top of the function scope, so `name` exists from the first line.',
      'Hoisting moves the DECLARATION, not the assignment — the value is `undefined` at the first log.',
      'After the assignment line runs, the second log sees "dailyquest".',
      'With `let` the same code would throw a ReferenceError (temporal dead zone) instead.',
    ],
    hints: ['What exactly does hoisting move — the declaration, the initialization, or both?', 'Contrast this with what `let` would do in the same spot.'],
    objectives: ['Distinguish declaration hoisting from initialization', 'Know the TDZ behaviour of let/const'],
  }),

  predictionChallenge({
    id: 'pred.shared-binding',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'intermediate',
    minutes: 10,
    concepts: ['closures', 'var scoping'],
    tags: ['javascript', 'closures'],
    skills: ['Closure capture'],
    subcategories: ['closures'],
    title: 'The Shared Souvenir',
    subtitle: 'Three closures, one variable.',
    description: 'Three closures created in a loop all call themselves and report what they captured.',
    snippet: `const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns[0]());
console.log(fns[1]());
console.log(fns[2]());`,
    output: '3\n3\n3',
    reasoning: [
      '`var i` creates ONE function-scoped binding for the entire loop.',
      'Each arrow function captures a reference to that binding — not a snapshot of its value.',
      'The closures run after the loop, when `i` is 3, so all three print 3.',
      'Changing `var` to `let` gives each iteration a fresh binding and prints 0, 1, 2.',
    ],
    hints: ['How many bindings does `var i` create across three iterations?', 'The closures are called after the loop ends — what is `i` by then?'],
    objectives: ['Predict closure capture with `var`', 'Fix the pattern with block-scoped `let`'],
  }),

  predictionChallenge({
    id: 'pred.typeof-quirks',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 5,
    concepts: ['typeof', 'historical bugs'],
    tags: ['javascript', 'types'],
    skills: ['Type inspection'],
    subcategories: ['types'],
    title: 'The Fossil Bug',
    subtitle: 'typeof null, frozen in the spec.',
    description: 'Three type checks, one of which reports a value that no longer makes sense.',
    snippet: `console.log(typeof null);
console.log(typeof []);
console.log(Array.isArray([]));`,
    output: 'object\nobject\ntrue',
    reasoning: [
      '`typeof null` returns "object" — a bug from the first JS engine, kept forever for backward compatibility.',
      'Arrays are objects, so `typeof []` is also "object"; typeof cannot distinguish them.',
      '`Array.isArray` exists precisely because typeof cannot detect arrays.',
    ],
    hints: ['One of these results is officially documented as a historical bug.', 'How would you reliably distinguish an array from a plain object?'],
    objectives: ['Know the typeof null quirk', 'Use Array.isArray for array detection'],
  }),

  predictionChallenge({
    id: 'pred.loose-equality',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'intermediate',
    minutes: 8,
    concepts: ['loose equality', 'coercion rules'],
    tags: ['javascript', 'equality'],
    skills: ['Abstract equality table'],
    subcategories: ['equality'],
    title: 'The Equality Triangle',
    subtitle: 'null, undefined and an array walk into ==.',
    description: 'Three loose-equality checks with results that rarely match intuition.',
    snippet: `console.log([1, 2, 3] == '1,2,3');
console.log(null == undefined);
console.log(null == 0);`,
    output: 'true\ntrue\nfalse',
    reasoning: [
      'The array is converted to a primitive via toString → "1,2,3", which equals the string.',
      'null and undefined are loosely equal to each other and to nothing else.',
      'null only coerces to a number under `>=`/`<=`; `==` treats null as equal only to undefined, so null == 0 is false.',
    ],
    hints: ['What does String([1,2,3]) return?', 'null and undefined form their own special pair in the abstract equality algorithm.'],
    objectives: ['Recall the null/undefined equality special case', 'Explain array-to-primitive coercion'],
  }),

  predictionChallenge({
    id: 'pred.truthy-table',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 5,
    concepts: ['truthiness', 'boolean coercion'],
    tags: ['javascript', 'booleans'],
    skills: ['Falsy value list'],
    subcategories: ['coercion'],
    title: 'The Falsy Borderline',
    subtitle: 'Which of these is false?',
    description: 'Four Boolean() conversions, including one string that reads as false.',
    snippet: `console.log(Boolean('false'));
console.log(Boolean(0));
console.log(Boolean([]));
console.log(Boolean(''));`,
    output: 'true\nfalse\ntrue\nfalse',
    reasoning: [
      'Any non-empty string is truthy — including the literal text "false".',
      'The falsy values are exactly: false, 0, -0, 0n, "", null, undefined, NaN.',
      'An empty array is an OBJECT, and every object is truthy — even [] and {}.',
      'The empty string "" is one of the eight falsy values.',
    ],
    hints: ['There are exactly eight falsy values in JavaScript.', 'An empty array is not a string — what type does it coerce from?'],
    objectives: ['Recite the falsy list', 'Explain why objects are always truthy'],
  }),

  predictionChallenge({
    id: 'pred.addition-cascade',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'intermediate',
    minutes: 8,
    concepts: ['operator precedence', 'unary plus'],
    tags: ['javascript', 'coercion'],
    skills: ['Left-to-right evaluation'],
    subcategories: ['coercion'],
    title: 'The Cascading Plus',
    subtitle: 'Three additions, three different rules.',
    description: 'Unary plus sneaks into a chain of additions and changes everything.',
    snippet: `console.log(1 + '2' + '2');
console.log(1 + +'2' + '2');
console.log('A' - 1);`,
    output: '122\n32\nNaN',
    reasoning: [
      'Addition is left-associative: 1 + "2" is "12" (string mode), then "12" + "2" is "122".',
      'The unary `+` converts "2" to the number 2 first; 1 + 2 = 3, then 3 + "2" concatenates to "32".',
      'Subtraction has no string mode: "A" becomes NaN, and NaN - 1 stays NaN.',
    ],
    hints: ['Evaluate each line strictly left to right.', 'Unary + is the fastest string-to-number conversion in JS.'],
    objectives: ['Track coercion step by step', 'Predict NaN propagation'],
  }),

  predictionChallenge({
    id: 'pred.default-sort',
    category: 'output_prediction',
    challengeType: 'output_prediction',
    difficulty: 'easy',
    minutes: 5,
    concepts: ['default sort', 'lexicographic order'],
    tags: ['javascript', 'arrays'],
    skills: ['Comparator necessity'],
    subcategories: ['arrays'],
    title: 'The Alphabetical Numbers',
    subtitle: 'sort() reads digits as text.',
    description: 'Sorting numbers without a comparator produces a lexicographic surprise.',
    snippet: `console.log([10, 1, 3].sort().join(','));`,
    output: '1,10,3',
    reasoning: [
      'With no comparator, sort() converts every element to a string and compares UTF-16 code units.',
      '"1" < "10" < "3" lexicographically: "1" is a prefix of "10", and "3" > "1" as a character.',
      'Numeric sorting requires a comparator: sort((a, b) => a - b).',
    ],
    hints: ['What type are the elements when the comparator is missing?', 'Compare "10" and "3" as strings, character by character.'],
    objectives: ['Explain the default sort order', 'Always supply a comparator for numbers'],
  }),
];
