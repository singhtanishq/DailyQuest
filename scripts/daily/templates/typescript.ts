import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * TypeScript pool — narrowing, generics, utility types and the discipline
 * that makes types carry their weight.
 */

export const typescriptTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'ts.narrowing-guard',
    category: 'typescript',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['narrowing', 'type guards'],
    tags: ['typescript', 'narrowing'],
    skills: ['Control-flow analysis'],
    subcategories: ['narrowing'],
    title: 'The Narrowing Checkpoint',
    subtitle: 'typeof in an if is a type-level fact.',
    description: 'How control-flow analysis turns a union into its members.',
    scenario: {
      language: 'typescript',
      code: `type Input = string | number;

function process(input: Input) {
  if (typeof input === 'string') {
    return input.toUpperCase(); // line A
  }
  return input + 1;             // line B
}`,
    },
    question: 'What types does `input` have at lines A and B?',
    options: [
      'string at A; number at B',
      'string at A; string | number at B',
      'any at A; number at B',
      'The code does not compile',
    ],
    optionExplanations: [
      'Correct: the typeof check narrows the union in the true branch, and the early return leaves number for the rest.',
      'The early `return` removes string from the remaining flow — the union does not survive past the if.',
      'TypeScript tracks real types here; no any appears.',
      'toUpperCase and +1 are both valid on the narrowed types.',
    ],
    reasoning: [
      'Narrowing is per code path: the true branch gets string, the false branch excludes string.',
      'An early return strengthens narrowing after the if — no else needed.',
      'Custom guards (input is Foo) extend the same principle to checks the compiler cannot express.',
    ],
    hints: ['The if both narrows and (via return) filters the fallthrough path.', 'What does the compiler know after `typeof input === "string"` is false?'],
    objectives: ['Predict narrowing through branches and returns', 'Write custom type guards'],
  }),

  quizChallenge({
    id: 'ts.unknown-vs-any',
    category: 'typescript',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 10,
    concepts: ['unknown', 'any', 'type safety'],
    tags: ['typescript', 'types'],
    skills: ['Choosing safe top types'],
    subcategories: ['types'],
    title: 'The Escaped Any',
    subtitle: 'unknown is a top type with manners.',
    description: 'The difference between any and unknown at the boundary.',
    question: 'Which statement about `any` and `unknown` is correct?',
    options: [
      'unknown accepts any value but must be narrowed before use; any disables checking and propagates',
      'unknown and any behave identically at runtime but unknown is faster',
      'any accepts fewer values than unknown',
      'unknown requires a type assertion on every property access',
    ],
    optionExplanations: [
      'Correct: both accept everything; unknown forces you to prove what it is before using it, while any turns off checking for everything it touches.',
      'Runtime behaviour is identical — the difference is entirely at compile time.',
      'It is the reverse: any accepts everything without ceremony; unknown accepts everything WITH ceremony.',
      'Narrowing (typeof, instanceof, guards) suffices — no assertion required.',
    ],
    reasoning: [
      'any is contagious: assigning an any to a typed variable silences the checker downstream.',
      'unknown stops the spread: you must narrow before operating.',
      'Rule of thumb: unknown at system boundaries (JSON.parse results, network payloads), concrete types after validation.',
    ],
    hints: ['Which one lets you call any method on it without checks?', 'What happens when an `any` value is assigned to a `string` variable?'],
    objectives: ['Prefer unknown at boundaries', 'Contain any propagation'],
  }),

  quizChallenge({
    id: 'ts.utility-types',
    category: 'typescript',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['utility types'],
    tags: ['typescript', 'types'],
    skills: ['Mapped type fluency'],
    subcategories: ['types'],
    title: 'The Shaped Subset',
    subtitle: 'Pick, Omit, Partial — know exactly what remains.',
    description: 'Reasoning about what utility types keep and drop.',
    question:
      'Given `interface User { id: string; name: string; email: string; passwordHash: string }`, which type produces a safe "public profile" object that also allows omitting email?',
    options: [
      'Omit<User, "passwordHash"> & { email?: string }',
      'Pick<User, "id" | "name" | "email" | "passwordHash">',
      'Partial<User>',
      'User & { passwordHash?: undefined }',
    ],
    optionExplanations: [
      'Correct: Omit drops the secret, and intersecting with an optional email makes it omittable while keeping id/name required.',
      'Pick keeps all four listed fields — including passwordHash — the exact leak to avoid.',
      'Partial makes EVERYTHING optional, including id and name: the shape loses its guarantees.',
      'This keeps every field and merely narrows one — passwordHash remains present and required-typed string.',
    ],
    reasoning: [
      'Deriving types from the source (Omit/Pick) keeps them in sync when User changes.',
      'Partial is for update payloads, not for public projections.',
      'The pattern generalizes: project out secrets at the boundary, make optionality explicit.',
    ],
    hints: ['Which utility removes keys by name?', 'How do you make a single field optional without touching the others?'],
    objectives: ['Compose utility types for safe projections', 'Keep secrets out of derived shapes'],
  }),

  openChallenge({
    id: 'ts.generics-vs-any',
    category: 'typescript',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['generics'],
    tags: ['typescript', 'generics'],
    skills: ['Generic design'],
    subcategories: ['generics'],
    title: 'The Identity Argument',
    subtitle: 'Why generics preserve what any forgets.',
    description: 'Explain what a generic parameter gives you that `any` cannot.',
    question:
      'Compare `function first<T>(items: T[]): T | undefined` with `function first(items: any[]): any`. What does the caller gain with the generic version, and where do generic constraints (`T extends ...`) enter the picture?',
    guidance: [
      'Describe the caller’s type information in both versions.',
      'Explain inference: who provides T.',
      'Show where a constraint prevents an invalid body.',
    ],
    solution: {
      summary:
        'The generic version keeps the element type: calling first(numbers) returns number | undefined, so the result stays checked everywhere it flows. any returns any — the information is destroyed and errors move to runtime. Constraints let the body USE the type parameter: `<T extends { id: string }>` permits `items[0].id` while remaining generic.',
      reasoning: [
        'T is inferred from the argument, so callers write no explicit types.',
        'The return type is computed from the input type — the linkage any severs.',
        'Inside the body, T is unknown by default; constraints grant known members.',
        'Generics document relationships ("in type relates to out type") that overloads or any cannot express.',
      ],
      commonMistakes: [
        'Writing <any> to silence an error instead of constraining T.',
        'Overusing generics for single concrete types — genericity needs variation to pay off.',
      ],
    },
    hints: ['Call first([1,2,3])[0] + 1 under both signatures — which compiles?', 'A constraint is how the body earns the right to use members.'],
    objectives: ['Articulate the value of type parameters', 'Use constraints to unlock operations'],
  }),

  quizChallenge({
    id: 'ts.as-vs-satisfies',
    category: 'typescript',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['type assertions', 'satisfies operator'],
    tags: ['typescript', 'types'],
    skills: ['Assertion discipline'],
    subcategories: ['types'],
    title: 'The Honest Annotation',
    subtitle: 'as widens; satisfies checks without widening.',
    description: 'Choosing between a type assertion and the satisfies operator for a config object.',
    question:
      'You declare a theme config that must match `type Theme = Record<string, { color: string }>`. Which declaration keeps literal key checking while guaranteeing conformance?',
    options: [
      'const theme = { dark: { color: "#111" } } satisfies Theme',
      'const theme = { dark: { color: "#111" } } as Theme',
      'const theme: Theme = { dark: { color: "#111" } }',
      'const theme = <Theme>{ dark: { color: "#111" } }',
    ],
    optionExplanations: [
      'Correct: satisfies checks the value against Theme while keeping the inferred literal type — conformance is verified AND `theme.dark` stays fully typed.',
      'as forces the Theme type and discards the literal information; it also silences mismatch errors (assertions are unchecked).',
      'Annotating does check the shape, but it widens the variable’s type to Theme — you lose the literal-narrowing benefits (like exact key preservation) that satisfies retains.',
      'The angle-bracket form is the same unchecked cast as `as`, and it is ambiguous inside .tsx files.',
    ],
    reasoning: [
      'Assertions are trust me casts — they neither check nor preserve.',
      'satisfies answers: is this value assignable, and can I keep the precise type?',
      'For config objects, satisfies catches typos on BOTH sides: unknown keys and missing required fields.',
    ],
    hints: ['What survives the expression type-wise in each variant?', 'Which operator was added in TS 4.9 precisely for this use case?'],
    objectives: ['Use satisfies for checked literals', 'Reserve `as` for genuinely provable casts'],
  }),
];
