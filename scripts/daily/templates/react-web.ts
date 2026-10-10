import { openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * React + Web platform pools — the mental models behind hooks and rendering,
 * plus browser fundamentals: semantics, a11y, CSS and CORS.
 */

export const reactTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'react.keys-identity',
    category: 'react',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['keys', 'reconciliation'],
    tags: ['react', 'lists'],
    skills: ['Reconciliation model'],
    subcategories: ['rendering'],
    title: 'The Shuffling List',
    subtitle: 'Index keys lie when order changes.',
    description: 'Why array-index keys corrupt state when lists reorder.',
    question:
      'A todo list renders items with `key={index}`. Users can delete and reorder items, and each row holds local state (an open editor). What goes wrong?',
    options: [
      'React matches rows by position, so after a reorder the local state stays with the position, not the item — editors appear open on the wrong rows',
      'React throws an error because keys must be stable UUIDs from the server',
      'The list silently stops updating because index keys disable re-rendering',
      'Nothing: index keys are the recommended key strategy',
    ],
    optionExplanations: [
      'Correct: reconciliation pairs old and new children by key. With index keys, an item’s DOM node and hook state attach to whatever now sits at that index.',
      'React only warns about missing keys; string uniqueness is the requirement, not UUIDs.',
      'Re-rendering continues fine — the damage is subtle state/dom mispairing, not a freeze.',
      'The docs explicitly warn against index keys for lists that reorder or filter.',
    ],
    reasoning: [
      'Keys are identity for the reconciler: same key = same component instance, same hook state, same DOM node.',
      'Index keys make identity follow position, so state bleeds across items on delete/reorder.',
      'Use a stable, unique-per-item id; fall back to index keys only for static, never-reordered lists.',
    ],
    hints: [
      'What does React use keys for after a render?',
      'Which instance keeps the `useState` value when the list rotates?',
    ],
    objectives: ['Explain key-based reconciliation', 'Choose keys that encode item identity'],
  }),

  quizChallenge({
    id: 'react.stale-closure',
    category: 'react',
    challengeType: 'debugging',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['hooks', 'closures', 'effects'],
    tags: ['react', 'hooks'],
    skills: ['Dependency arrays'],
    subcategories: ['hooks'],
    title: 'The Frozen Counter',
    subtitle: 'An interval that never sees the new state.',
    description: 'A setInterval started in an effect reads state that never updates.',
    scenario: {
      language: 'jsx',
      code: `function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // ← the suspect

  return <p>{count}</p>;
}`,
    },
    question: 'What does the counter show after several seconds, and why?',
    options: [
      'It reaches 1 and sticks there: the callback closed over count = 0 forever, so every tick sets 0 + 1',
      'It counts correctly; the empty dependency array is fine here',
      'It never renders any number because setState inside setInterval is illegal',
      'It counts twice as fast because the effect re-runs on every render',
    ],
    optionExplanations: [
      'Correct: the effect runs once, capturing count = 0 in the closure. Every tick calls setCount(0 + 1).',
      'The empty array IS the bug paired with reading state from the closure.',
      'setState is perfectly legal from timers — the problem is the stale value.',
      'The effect runs exactly once because of the empty dependency array.',
    ],
    reasoning: [
      'Effects capture the render’s values; with [], the capture is from the first render only.',
      'The functional update setCount(c => c + 1) reads the LATEST state and fixes this without re-subscribing.',
      'Alternatively, listing [count] re-creates the interval each tick — correct but churny.',
    ],
    hints: [
      'Which value of `count` did the interval callback capture, and when?',
      'What does the setCount(c => c + 1) form receive as its argument?',
    ],
    objectives: ['Diagnose stale closures in effects', 'Reach for functional updates'],
  }),

  quizChallenge({
    id: 'react.hooks-rules',
    category: 'react',
    challengeType: 'reasoning',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['rules of hooks'],
    tags: ['react', 'hooks'],
    skills: ['Hook call discipline'],
    subcategories: ['hooks'],
    title: 'The Conditional Hook',
    subtitle: 'Why hooks must not branch.',
    description: 'The one rule that keeps hook state aligned with the fiber.',
    question: 'Why is calling a hook inside an `if` forbidden?',
    options: [
      'React relies on hook call ORDER being identical in every render to associate state with the right hook',
      'Hooks throw when called inside blocks for performance reasons',
      'Conditional hooks would run on the server but not the client',
      'It is only a linting style preference; runtime handles it fine',
    ],
    optionExplanations: [
      'Correct: each hook’s state is a slot on the fiber keyed by call order; a skipped call shifts every later slot onto the wrong hook.',
      'The restriction is semantic, not a performance guard — the mismatch is real state corruption.',
      'Server rendering follows the same order-based model.',
      'The linter encodes a hard runtime constraint; violating it corrupts state silently.',
    ],
    reasoning: [
      'useState(0) is not "the state named count" — it is "the first hook call’s slot".',
      'Early returns before later hooks have the same hazard as conditionals.',
      'Move conditionals INSIDE the hook usage (choose arguments), or split components.',
    ],
    hints: [
      'How does React know which useState call maps to which stored value?',
      'What happens to slot numbering when one call disappears?',
    ],
    objectives: ['Explain order-based hook slots', 'Refactor conditional hook misuse'],
  }),

  openChallenge({
    id: 'react.controlled-inputs',
    category: 'react',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['controlled components', 'forms'],
    tags: ['react', 'forms'],
    skills: ['Form state design'],
    subcategories: ['forms'],
    title: 'The Two Sources of Truth',
    subtitle: 'Controlled vs uncontrolled inputs.',
    description: 'Decide when form state should live in React and when it should stay in the DOM.',
    question:
      'Contrast controlled inputs (value + onChange) with uncontrolled inputs (defaultValue + refs). Which problems does each solve, and which would you pick for (a) live-validated search fields and (b) a huge rarely-touched settings form?',
    guidance: [
      'Define both patterns precisely.',
      'Name the trade-offs: re-render cost, validation, imperative APIs (reset, focus).',
      'Justify a choice for each of the two scenarios.',
    ],
    solution: {
      summary:
        'Controlled inputs make React the single source of truth: every keystroke re-renders, enabling instant validation, formatting and conditional UI — right for the search field. Uncontrolled inputs let the DOM own the value and React read it on demand — fewer re-renders, natural for large static forms, at the cost of imperative access for programmatic changes.',
      reasoning: [
        'Controlled: value={state} — React writes to the DOM each render; typing is a state update.',
        'Uncontrolled: the input keeps its own state; ref.current.value reads it on submit.',
        'Live validation needs the value in React → controlled. A 60-field form that users fill once gains little from 60 state updates per keystroke → uncontrolled (or controlled with a form library that batches).',
        'Programmatic reset is a render with controlled inputs, but an imperative .reset() with uncontrolled ones.',
      ],
      commonMistakes: [
        'Setting value without onChange — the input freezes read-only.',
        'Mixing both for one input and fighting the DOM over the value.',
      ],
    },
    hints: [
      'Who is the source of truth in each pattern?',
      'What does every keystroke cost in a controlled input?',
    ],
    objectives: [
      'Compare controlled and uncontrolled models',
      'Choose per scenario with justification',
    ],
  }),
];

export const webTemplates: QuestTemplate[] = [
  quizChallenge({
    id: 'web.button-semantics',
    category: 'web',
    challengeType: 'code_review',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['semantics', 'accessibility'],
    tags: ['html', 'a11y'],
    skills: ['Semantic HTML'],
    subcategories: ['a11y'],
    title: 'The Div That Couldn’t',
    subtitle: 'A clickable div fails four ways.',
    description: 'What a real <button> gives you that a div with onClick never will.',
    question:
      'A card uses `<div class="btn" onClick={submit}>Save</div>`. Which set of problems does switching to `<button type="button">` fix?',
    options: [
      'Keyboard activation, focusability, screen-reader role, and Enter/Space handling — all free',
      'Only visual styling improves; behaviour is identical',
      'It makes the click handler run faster',
      'It adds the text to the page title for SEO',
    ],
    optionExplanations: [
      'Correct: native buttons are focusable, announce their role, fire click on Enter and Space, and respect disabled state — none of which a div has by default.',
      'The behavioural gaps are exactly the problem; styling is incidental.',
      'Handler performance is unaffected.',
      'SEO is unrelated to button semantics here.',
    ],
    reasoning: [
      'Interactive elements must be reachable and operable by keyboard — a div requires manual tabIndex, role, and keydown handlers.',
      'A button also carries no navigation semantics (unlike <a href>), matching the "perform an action" intent.',
      'Rule: choose the element whose native behaviour matches the interaction, style it afterwards.',
    ],
    hints: [
      'Try submitting that div with the Tab key only.',
      'What does a screen reader announce for a div?',
    ],
    objectives: [
      'Prefer native semantics over rebuilt behaviour',
      'Name the four free guarantees of <button>',
    ],
  }),

  quizChallenge({
    id: 'web.css-specificity',
    category: 'web',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 10,
    concepts: ['css', 'specificity'],
    tags: ['css', 'cascading'],
    skills: ['Specificity calculation'],
    subcategories: ['css'],
    title: 'The Cascade Tiebreak',
    subtitle: 'IDs, classes, and order of appearance.',
    description: 'Which rule wins when selectors collide?',
    question:
      'Given `<p id="intro" class="note">` and the rules `#intro { color: blue }`, `.note { color: red }`, and `p { color: green }` — plus `p.note { color: purple }` — which color applies?',
    options: [
      'blue — the ID selector outranks every class-based selector regardless of order',
      'purple — the most specific compound selector wins',
      'red — classes beat element selectors',
      'green — element selectors apply last',
    ],
    optionExplanations: [
      'Correct: specificity compares (id, class, type) tuples lexicographically; (1,0,0) beats (0,2,1) no matter the source order.',
      'p.note is (0,1,1) — strong among class rules, but zero IDs still lose to one.',
      '.note alone is (0,1,0) and loses to p.note, let alone #intro.',
      'Element selectors are the weakest tier here.',
    ],
    reasoning: [
      'Specificity tuple: (ids, classes/attrs/pseudo-classes, types/pseudo-elements).',
      'p.note = (0,1,1); .note = (0,1,0); p = (0,0,1); #intro = (1,0,0).',
      'Only !important or inline styles outrank ID selectors — both are smells.',
    ],
    hints: [
      'Compare the three-column tuple before thinking about order.',
      'Order matters only between selectors of EQUAL specificity.',
    ],
    objectives: ['Compute specificity tuples', 'Untangle cascade conflicts'],
  }),

  openChallenge({
    id: 'web.cors-reality',
    category: 'web',
    challengeType: 'reasoning',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['cors', 'same-origin policy'],
    tags: ['http', 'browser', 'security'],
    skills: ['Browser security model'],
    subcategories: ['security'],
    title: 'The CORS Misconception',
    subtitle: 'CORS is the browser asking permission.',
    description:
      'What the Same-Origin Policy forbids, what CORS actually grants, and who enforces it.',
    question:
      'A teammate says "we enabled CORS on the server, so now attackers can’t call our API." Untangle the confusion: what does the Same-Origin Policy block, what does a CORS header actually do, and why is CORS not an attack-surface control?',
    guidance: [
      'Define same-origin and what SOP restricts (reads, not writes).',
      'Explain the preflight/Access-Control-Allow-Origin flow.',
      'State who enforces CORS and what it does NOT protect against.',
    ],
    solution: {
      summary:
        'SOP stops a page’s JavaScript from READING cross-origin responses; CORS is the server explicitly relaxing that read restriction for listed origins. It is enforced by the BROWSER only — curl, server-to-server calls and attackers’ scripts outside a browser ignore it entirely. CORS therefore protects your users from other sites, not your API from attackers; authentication and authorization do that.',
      reasoning: [
        'Origin = scheme + host + port; different = cross-origin.',
        'Simple requests still go through (the response is hidden if disallowed); non-simple ones trigger a preflight OPTIONS the server must answer.',
        'Attacker capabilities are unchanged by CORS: they never needed a browser to hit your API.',
        'CSRF is the flip side: browsers DO send cross-origin writes — which is why state-changing endpoints need CSRF tokens or SameSite cookies, not CORS.',
      ],
      commonMistakes: [
        'Setting Access-Control-Allow-Origin: * together with credentials — browsers reject that combination.',
        'Treating CORS failures as server errors — the request may have succeeded; the browser hid the response.',
      ],
    },
    hints: [
      'Try calling the API with curl — does CORS exist there?',
      'Who refuses to hand over the response: the server or the browser?',
    ],
    objectives: [
      'Place CORS correctly in the security model',
      'Separate read restrictions from write protections',
    ],
  }),

  openChallenge({
    id: 'web.layout-thrashing',
    category: 'web',
    challengeType: 'performance',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['reflow', 'performance', 'rendering pipeline'],
    tags: ['performance', 'browser'],
    skills: ['Render pipeline reasoning'],
    subcategories: ['performance'],
    title: 'The Thrashing Loop',
    subtitle: 'Read, write, read, write — the layout killer.',
    description: 'Diagnose and fix a loop that forces synchronous layout on every iteration.',
    question:
      'This code is slow: `for (const el of items) { heights.push(el.offsetHeight); el.style.height = (el.offsetHeight * 2) + "px"; }`. Explain what layout thrashing is, why this loop triggers it, and restructure it to be fast.',
    guidance: [
      'Describe the JS → style → layout → paint pipeline and the invalidation rule.',
      'Explain the read-write interleaving that forces reflow per item.',
      'Provide the batched (read-all, write-all) rewrite.',
    ],
    solution: {
      summary:
        'offsetHeight forces the browser to compute layout NOW if anything is dirty. Alternating reads and writes means each write invalidates layout and the next read flushes it — one synchronous reflow per item. Batch it: read every offsetHeight into an array first, then write all the new heights; layout flushes once.',
      reasoning: [
        'DOM writes mark the tree dirty; layout-dependent reads (offsetWidth, getBoundingClientRect) force a synchronous flush.',
        'N interleaved pairs → N forced reflows; batching → one.',
        'For extreme cases, FastDOM-style scheduling or requestAnimationFrame chunking spreads the work across frames.',
        'Transforms and opacity avoid layout entirely — prefer them when the effect allows.',
      ],
      commonMistakes: [
        'Caching `el.offsetHeight` in the loop condition but still reading AFTER the write in the same iteration.',
        'Blaming JavaScript speed — the cost is forced synchronous layout, not the JS itself.',
      ],
    },
    hints: [
      'Which property reads force layout, and which writes invalidate it?',
      'Split the loop into two passes: all reads, then all writes.',
    ],
    objectives: ['Explain forced synchronous layout', 'Apply read-write batching'],
  }),
];
