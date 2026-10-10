import { codingChallenge, type QuestTemplate } from './framework.js';

/**
 * Coding pool — hands-on implementation challenges.
 *
 * Every template carries a reference implementation (`run`) that the pipeline
 * executes at generation time to compute all expected test and example
 * outputs. If the reference implementation disagrees with hand-authored
 * prose, generation fails loudly instead of publishing a wrong quest.
 */

export const codingTemplates: QuestTemplate[] = [
  codingChallenge({
    id: 'coding.balanced-ledger',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['stacks', 'parsing'],
    tags: ['strings', 'stack', 'validation'],
    skills: ['Stack usage', 'Input parsing'],
    subcategories: ['strings', 'stacks'],
    title: 'The Balanced Ledger',
    subtitle: 'Every open brace needs a closing story.',
    description:
      'Determine whether a string of brackets is perfectly balanced — the classic stack exercise that still shows up in real parsers.',
    promptIntro:
      'A ledger entry is a string containing only the characters `(`, `)`, `[`, `]`, `{` and `}`. The entry is **balanced** when every opening bracket is closed by the matching type, and closing brackets never appear before their opening partner. Nested and sequential groups are both allowed.',
    instructions: [
      'Read one line of input: the bracket string.',
      'Print `balanced` if the string is balanced, otherwise print `unbalanced`.',
    ],
    constraints: [
      'The input contains at most 10,000 characters.',
      'Only the six bracket characters appear in the input.',
      'An empty string counts as balanced.',
    ],
    run: (input) => {
      const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
      const stack: string[] = [];
      for (const ch of input.trim()) {
        if (ch === '(' || ch === '[' || ch === '{') {
          stack.push(ch);
        } else if (ch === ')' || ch === ']' || ch === '}') {
          const open = stack.pop();
          if (open !== pairs[ch]) {
            return 'unbalanced';
          }
        }
      }
      return stack.length === 0 ? 'balanced' : 'unbalanced';
    },
    tests: [
      { name: 'nested groups', input: '{[()]}' },
      { name: 'sequential groups', input: '()[]{}' },
      { name: 'wrong closing type', input: '(]' },
      { name: 'closes too early', input: '([)]' },
      { name: 'unclosed open', input: '(((' },
      { name: 'stray close', input: ')' },
    ],
    examples: [
      { title: 'Example 1', input: '{[()]}', explanation: 'Three levels of nesting, all closed in order.' },
      { title: 'Example 2', input: '([)]', explanation: 'The `]` arrives while `(` is still open.' },
    ],
    starter: {
      language: 'javascript',
      code: 'function isBalanced(s) {\n  // your code\n}\n\nconsole.log(isBalanced(require("fs").readFileSync(0, "utf8").trim()));',
    },
    solution: {
      summary:
        'Push opening brackets onto a stack; on each closing bracket, the top of the stack must be its matching opener. A mismatch, a close on an empty stack, or leftovers at the end all mean unbalanced.',
      approach: [
        'Iterate over the characters once.',
        'Openers go onto a stack.',
        'A closer must match the stack top via a lookup table; pop it if it does, fail otherwise.',
        'At the end the stack must be empty.',
      ],
      code: {
        language: 'javascript',
        code: `function isBalanced(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
    else if (ch === ')' || ch === ']' || ch === '}') {
      if (stack.pop() !== pairs[ch]) return 'unbalanced';
    }
  }
  return stack.length === 0 ? 'balanced' : 'unbalanced';
}`,
      },
      complexity: 'O(n) time, O(n) space for the stack.',
      mistakes: [
        'Checking only counts (equal opens and closes) — `([)]` passes that check but is not balanced.',
        'Forgetting the empty-stack case when a closer arrives first.',
      ],
    },
    hints: [
      'Think about which closing bracket must be matched first — it is always the most recently opened one.',
      'A stack mirrors that "last opened, first closed" rule exactly.',
    ],
    objectives: ['Recognize when a problem is stack-shaped', 'Implement a single-pass validator'],
    edgeCases: ['empty input', 'opener with no closer', 'closer with no opener'],
  }),

  codingChallenge({
    id: 'coding.comma-that-lied',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['parsing', 'state machines'],
    tags: ['csv', 'parsing', 'strings'],
    skills: ['Character-level parsing', 'Quoting rules'],
    subcategories: ['parsing'],
    title: 'The Comma That Lied',
    subtitle: 'Not every comma is a separator.',
    description:
      'Parse a single CSV line where commas inside double quotes are data, not separators — the detail that breaks naive `split(",")` in production.',
    promptIntro:
      'You are given one line of CSV. Fields are separated by commas, but a field wrapped in double quotes may contain commas, and a quoted field escapes an embedded quote by doubling it (`""` renders a single `"`). Quotes only have special meaning at field boundaries.',
    instructions: [
      'Read one line of CSV from input.',
      'Split it into fields using the rules above.',
      'Print the fields joined by ` | `.',
    ],
    constraints: [
      'The line contains at most 1,000 characters.',
      'The line is well-formed: quotes are balanced and only wrap whole fields.',
    ],
    run: (input) => {
      const line = input.replace(/\r?\n$/, '');
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]!;
        if (inQuotes) {
          if (ch === '"') {
            if (line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            current += ch;
          }
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      fields.push(current);
      return fields.join(' | ');
    },
    tests: [
      { name: 'plain fields', input: 'a,b,c' },
      { name: 'quoted comma', input: '"hello, world",42,end' },
      { name: 'escaped quote', input: '"she said ""hi""",ok' },
      { name: 'empty field', input: 'one,,three' },
      { name: 'quote not at boundary is literal', input: 'a,b"c,d' },
      { name: 'trailing empty field', input: 'x,' },
    ],
    examples: [
      {
        title: 'Example 1',
        input: '"hello, world",42,end',
        explanation: 'The comma inside the quotes belongs to the first field.',
      },
      {
        title: 'Example 2',
        input: '"she said ""hi""",ok',
        explanation: 'The doubled quote collapses into a literal `"` inside the field.',
      },
    ],
    solution: {
      summary:
        'Scan character by character with an in-quotes flag. Commas only split fields while outside quotes; inside quotes, a doubled quote is a literal quote and a single quote ends the quoted section.',
      approach: [
        'Keep the current field in a buffer and a boolean for quote state.',
        'Outside quotes: a comma flushes the buffer as a field; a quote enters quoted mode.',
        'Inside quotes: `""` appends a literal quote; a lone `"` leaves quoted mode.',
        'After the loop, flush the final buffer — the line may end with an empty field.',
      ],
      code: {
        language: 'javascript',
        code: `function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else current += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { fields.push(current); current = ''; }
    else current += ch;
  }
  fields.push(current);
  return fields;
}`,
      },
      complexity: 'O(n) time, O(n) space.',
      mistakes: [
        'Using `line.split(",")` and hoping quotes never appear.',
        'Treating every `""` as an end-of-field marker without peeking at the next character.',
      ],
    },
    hints: [
      'A single boolean flag is enough to know whether a comma is a separator.',
      'When you see a quote inside quotes, look at the very next character before deciding.',
    ],
    objectives: ['Write a character-level parser with a mode flag', 'Internalize CSV quoting rules'],
    edgeCases: ['empty fields between commas', 'quote characters in unquoted fields', 'trailing comma'],
  }),

  codingChallenge({
    id: 'coding.vanishing-number',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['arithmetic series', 'overflow thinking'],
    tags: ['math', 'arrays'],
    skills: ['Summation identities', 'Edge-case thinking'],
    subcategories: ['math'],
    title: 'The Vanishing Number',
    subtitle: 'One number slipped out of the sequence.',
    description:
      'Given every number from 0 to n except one, find the missing one — in one pass, without sorting.',
    promptIntro:
      'The numbers `0..n` were written down, but exactly one of them was lost. You receive `n` on the first line and the remaining numbers (in arbitrary order) on the second line.',
    instructions: [
      'The first line contains `n`.',
      'The second line contains `n` distinct integers from the range `[0, n]` in arbitrary order.',
      'Print the single missing number.',
    ],
    constraints: ['0 ≤ n ≤ 10^6', 'Exactly one number is missing.', 'O(n) time, O(1) extra space preferred.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const n = Number.parseInt(lines[0]!.trim(), 10);
      const nums = (lines[1] ?? '').trim().split(/\s+/).filter(Boolean).map(Number);
      const expectedSum = (n * (n + 1)) / 2;
      return String(expectedSum - nums.reduce((sum, value) => sum + value, 0));
    },
    tests: [
      { name: 'middle missing', input: '5\n0 1 2 4 5' },
      { name: 'zero missing', input: '3\n1 2 3' },
      { name: 'n missing', input: '4\n0 1 2 3' },
      { name: 'single element', input: '1\n0' },
      { name: 'shuffled order', input: '9\n8 3 7 1 0 5 2 6 9' },
    ],
    examples: [
      { title: 'Example 1', input: '5\n0 1 2 4 5', explanation: 'The full range 0..5 sums to 15; the given numbers sum to 12.' },
      { title: 'Example 2', input: '3\n1 2 3', explanation: 'Zero is the missing value.' },
    ],
    solution: {
      summary:
        'The sum of 0..n is n(n+1)/2. Subtract the sum of the given numbers from that total; the difference is the missing number. No sorting, no set, one pass.',
      approach: [
        'Compute the expected sum with the Gauss formula.',
        'Sum the provided numbers in a single pass.',
        'The difference is the answer.',
      ],
      code: {
        language: 'javascript',
        code: `function findMissing(n, nums) {
  const expected = (n * (n + 1)) / 2;
  return expected - nums.reduce((sum, v) => sum + v, 0);
}`,
      },
      complexity: 'O(n) time, O(1) extra space.',
      alternatives: [
        'XOR every index and value together; the result is the missing number — useful when sums could overflow.',
      ],
      mistakes: ['Sorting first (O(n log n)) when a constant-space one-pass exists.', 'Forgetting the range starts at 0, not 1.'],
    },
    hints: ['There is a closed-form formula for the sum of 0..n.', 'What is the difference between what should be there and what is?'],
    objectives: ['Apply the Gauss summation identity', 'Reason about single-pass array problems'],
    edgeCases: ['missing value is 0', 'missing value is n', 'n = 0 with empty list — impossible per constraints but worth noticing'],
  }),

  codingChallenge({
    id: 'coding.roman-ledger',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['number systems', 'parsing'],
    tags: ['math', 'strings', 'parsing'],
    skills: ['Subtractive notation', 'Greedy scanning'],
    subcategories: ['math', 'parsing'],
    title: 'The Imperial Invoice',
    subtitle: 'Subtraction is written in, not computed.',
    description:
      'Convert a Roman numeral to its integer value, handling the subtractive pairs IV, IX, XL, XC, CD and CM correctly.',
    promptIntro:
      'Roman numerals are usually additive (VI = 6), except when a smaller symbol precedes a larger one: then it is subtracted (IV = 4, CM = 900). You receive one valid Roman numeral on a single line.',
    instructions: ['Read one Roman numeral (letters I, V, X, L, C, D, M).', 'Print its integer value.'],
    constraints: ['The numeral is valid and at most 15 characters.', 'The value fits in a 32-bit integer.'],
    run: (input) => {
      const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      const s = input.trim().toUpperCase();
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        const current = values[s[i]!] ?? 0;
        const next = i + 1 < s.length ? values[s[i + 1]!] ?? 0 : 0;
        total += current < next ? -current : current;
      }
      return String(total);
    },
    tests: [
      { name: 'simple additive', input: 'VII' },
      { name: 'subtractive pair', input: 'IV' },
      { name: 'nineteen ninety four', input: 'MCMXCIV' },
      { name: 'all subtractives', input: 'CDXLIV' },
      { name: 'large', input: 'MMXXVI' },
    ],
    examples: [
      { title: 'Example 1', input: 'MCMXCIV', explanation: 'M=1000, CM=900, XC=90, IV=4 → 1994.' },
      { title: 'Example 2', input: 'LVIII', explanation: '50 + 5 + 1 + 1 + 1 = 58.' },
    ],
    solution: {
      summary:
        'Scan left to right: add each symbol’s value, unless it is smaller than the symbol that follows — then subtract it. One pass, no special-casing of the six subtractive pairs.',
      approach: [
        'Map each letter to its value.',
        'For each position compare the current value with the next.',
        'Current < next means a subtractive pair: subtract current; otherwise add it.',
      ],
      code: {
        language: 'javascript',
        code: `function romanToInt(s) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = values[s[i]];
    const next = values[s[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}`,
      },
      complexity: 'O(n) time, O(1) space.',
      mistakes: ['Enumerating all six subtractive pairs as special cases instead of comparing neighbors.', 'Reading right-to-left but forgetting to flip the comparison.'],
    },
    hints: ['Only one comparison matters at each position: this symbol versus the next one.', 'CM is just C "before" M — subtraction falls out of a neighbor comparison.'],
    objectives: ['Model numeral systems as local rules', 'Avoid special-case sprawl'],
    edgeCases: ['numeral ends in I or X (no next symbol)', 'repeated subtractive context like XIX'],
  }),

  codingChallenge({
    id: 'coding.run-length',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['run-length encoding', 'two pointers'],
    tags: ['strings', 'encoding'],
    skills: ['Run counting', 'String building'],
    subcategories: ['strings'],
    title: 'The Longest Run',
    subtitle: 'Compress repetition without losing a character.',
    description:
      'Encode a string with run-length encoding: each run of identical characters becomes the character followed by the run length.',
    promptIntro:
      'Given a line of text, replace every maximal run of identical consecutive characters with the character followed by the run length. Case matters: `a` and `A` are different characters.',
    instructions: ['Read one line of input.', 'Print the run-length encoded result.'],
    constraints: ['The input is 1..1,000 characters of printable ASCII.', 'Every run is written explicitly, even runs of length 1.'],
    run: (input) => {
      const s = input.trim();
      if (s.length === 0) {
        return '';
      }
      let out = '';
      let count = 1;
      for (let i = 1; i <= s.length; i++) {
        if (i < s.length && s[i] === s[i - 1]) {
          count++;
        } else {
          out += s[i - 1]! + String(count);
          count = 1;
        }
      }
      return out;
    },
    tests: [
      { name: 'basic runs', input: 'aaabb' },
      { name: 'single characters', input: 'abc' },
      { name: 'long run', input: 'aaaaaaaaaa' },
      { name: 'case sensitive', input: 'aAaA' },
      { name: 'digits mixed', input: '11122z' },
    ],
    examples: [
      { title: 'Example 1', input: 'aaabb', explanation: 'Runs of 3 a’s and 2 b’s.' },
      { title: 'Example 2', input: 'abc', explanation: 'Every run has length 1, so each character is followed by 1.' },
    ],
    solution: {
      summary:
        'Walk the string once, counting the current run. When the character changes (or the string ends), append the character and its count, then reset the counter.',
      approach: [
        'Start with count = 1 at the second character.',
        'If the current character equals the previous one, increment the count.',
        'Otherwise flush `char + count` and reset to 1.',
        'Flush once more after the loop — the final run never sees a change.',
      ],
      code: {
        language: 'javascript',
        code: `function encode(s) {
  let out = '';
  let count = 1;
  for (let i = 1; i <= s.length; i++) {
    if (i < s.length && s[i] === s[i - 1]) count++;
    else { out += s[i - 1] + count; count = 1; }
  }
  return out;
}`,
      },
      complexity: 'O(n) time, O(n) space for the output.',
      mistakes: ['Forgetting the final flush after the loop.', 'Encoding with `i` compared against `s[i+1]` and dropping the last run.'],
    },
    hints: ['The loop ending at `s.length` (inclusive) lets you flush the last run inside the loop.', 'Count first, append when the run breaks.'],
    objectives: ['Implement a classic encoding by hand', 'Handle the final-run boundary correctly'],
    edgeCases: ['all identical characters', 'no repeats at all', 'single character input'],
  }),

  codingChallenge({
    id: 'coding.silent-bits',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['bit manipulation', 'binary representation'],
    tags: ['bits', 'math'],
    skills: ['Binary reasoning', 'State tracking'],
    subcategories: ['bits'],
    title: 'The Silent Bits',
    subtitle: 'Measure the quietest stretch between ones.',
    description:
      'Find the longest run of consecutive zero bits that is bounded by 1 bits on both sides in the binary representation of a number.',
    promptIntro:
      'Given a positive integer, write it in binary and find the length of the longest run of consecutive zeros that has a `1` on both sides. Zeros before the first `1` or after the last `1` do not count.',
    instructions: ['Read one positive integer from input.', 'Print the longest 1-bounded zero run length.'],
    constraints: ['1 ≤ n < 2^31.'],
    run: (input) => {
      const n = Number.parseInt(input.trim(), 10);
      const bits = n.toString(2);
      let max = 0;
      let current = -1;
      for (const bit of bits) {
        if (bit === '1') {
          if (current > max) {
            max = current;
          }
          current = 0;
        } else if (current >= 0) {
          current++;
        }
      }
      return String(max);
    },
    tests: [
      { name: 'two gaps', input: '529' },
      { name: 'simple gap', input: '9' },
      { name: 'all ones', input: '15' },
      { name: 'trailing zeros only', input: '32' },
      { name: 'leading zeros ignored', input: '1' },
    ],
    examples: [
      { title: 'Example 1', input: '529', explanation: '529 is 1000010001 in binary — gaps of 4 and 3.' },
      { title: 'Example 2', input: '32', explanation: '100000 has trailing zeros only; nothing is 1-bounded.' },
    ],
    solution: {
      summary:
        'Walk the binary digits once. Track the current zero count, but only start counting after the first 1. Every time a 1 appears, the running zero count is a candidate for the maximum, then resets.',
      approach: [
        'current = -1 means "no open run yet"; a 1 opens a run by setting current = 0.',
        'Zeros while a run is open increment it.',
        'On each 1, fold the open run into max, then reopen at 0.',
        'Trailing zeros never close, so they are never counted — exactly the rule we want.',
      ],
      code: {
        language: 'javascript',
        code: `function binaryGap(n) {
  let max = 0;
  let current = -1;
  for (const bit of n.toString(2)) {
    if (bit === '1') {
      if (current > max) max = current;
      current = 0;
    } else if (current >= 0) {
      current++;
    }
  }
  return max;
}`,
      },
      complexity: 'O(log n) time — one pass over the bits, O(log n) space for the string.',
      mistakes: ['Counting trailing zeros (use a sentinel like -1 so runs only exist after a 1).', 'Resetting the counter before folding it into the maximum.'],
    },
    hints: ['The run must be closed by a 1 — what does that suggest about where you update the maximum?', 'A -1 sentinel distinguishes "before the first 1" from "zero run of length 0".'],
    objectives: ['Convert between numbers and bit patterns fluently', 'Track bounded runs in a single pass'],
    edgeCases: ['n is a power of two (no closed gaps)', 'n has all bits set'],
  }),

  codingChallenge({
    id: 'coding.persisting-digit',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['digit manipulation', 'fixed points'],
    tags: ['math', 'digits'],
    skills: ['Loop invariants', 'Digital roots'],
    subcategories: ['math'],
    title: 'The Persisting Digit',
    subtitle: 'Sum the digits until one remains.',
    description:
      'Repeatedly sum the digits of a number until a single digit is left — the digital root, with a surprise closed form.',
    promptIntro:
      'Take a non-negative integer, sum its decimal digits, and repeat with the sum until only one digit remains. Print that final digit.',
    instructions: ['Read one non-negative integer from input.', 'Print the single digit that the process converges to.'],
    constraints: ['0 ≤ n ≤ 2^53 - 1.'],
    run: (input) => {
      let n = Number.parseInt(input.trim(), 10);
      while (n >= 10) {
        n = String(n)
          .split('')
          .reduce((sum, digit) => sum + Number(digit), 0);
      }
      return String(n);
    },
    tests: [
      { name: 'two rounds', input: '942' },
      { name: 'already single', input: '7' },
      { name: 'zero', input: '0' },
      { name: 'big number', input: '987654321' },
      { name: 'perfect nine multiple', input: '999999999' },
    ],
    examples: [
      { title: 'Example 1', input: '942', explanation: '9 + 4 + 2 = 15, then 1 + 5 = 6.' },
      { title: 'Example 2', input: '999999999', explanation: '81 → 9. Any multiple of 9 (above 0) ends at 9.' },
    ],
    solution: {
      summary:
        'Iteratively sum digits while the number has more than one digit. The elegant alternative: for n > 0 the answer is 1 + (n - 1) mod 9, because a number and its digit sum are congruent modulo 9.',
      approach: [
        'While n ≥ 10, replace n with the sum of its digits.',
        'Each round strictly shrinks the number, so the loop terminates.',
        'Optionally prove the O(1) formula: digit sums preserve the value mod 9.',
      ],
      code: {
        language: 'javascript',
        code: `function digitalRoot(n) {
  while (n >= 10) {
    n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

// O(1): n === 0 ? 0 : 1 + (n - 1) % 9`,
      },
      complexity: 'O(log* n) for the loop; O(1) with the modulo formula.',
      mistakes: ['Looping on `n > 0` instead of `n >= 10`, which never terminates for single-digit input… until you notice it loops forever on 5.', 'Forgetting that 0 is a valid input and a fixed point.'],
    },
    hints: ['Each pass makes the number strictly smaller — think about why.', 'Modulo 9 is deeply connected to digit sums.'],
    objectives: ['Implement digit manipulation loops', 'Discover the congruence shortcut'],
    edgeCases: ['n = 0', 'single-digit input', 'numbers divisible by 9'],
  }),

  codingChallenge({
    id: 'coding.common-ground',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['prefix matching', 'strings'],
    tags: ['strings', 'comparison'],
    skills: ['Character comparison', 'Early exit'],
    subcategories: ['strings'],
    title: 'Common Ground',
    subtitle: 'Where do these words agree?',
    description:
      'Find the longest common prefix shared by every word in a list — the small utility hiding inside autocomplete and path handling.',
    promptIntro:
      'You receive a list of lowercase words on one line. Find the longest string that is a prefix of every word. If the words share nothing, the answer is the empty string.',
    instructions: ['Read one line of space-separated words.', 'Print the longest common prefix (it may be empty).'],
    constraints: ['1..1,000 words, each 1..100 characters.', 'All characters are lowercase a-z.'],
    run: (input) => {
      const words = input.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        return '';
      }
      let prefix = words[0]!;
      for (const word of words.slice(1)) {
        let i = 0;
        while (i < prefix.length && i < word.length && prefix[i] === word[i]) {
          i++;
        }
        prefix = prefix.slice(0, i);
        if (prefix.length === 0) {
          break;
        }
      }
      return prefix;
    },
    tests: [
      { name: 'shared stem', input: 'interspecies interstellar interstate' },
      { name: 'two letters', input: 'flower flow flight' },
      { name: 'no common prefix', input: 'dog cat bird' },
      { name: 'single word', input: 'solo' },
      { name: 'duplicate words', input: 'echo echo echo' },
    ],
    examples: [
      { title: 'Example 1', input: 'interspecies interstellar interstate', explanation: 'All three share `inters`.' },
      { title: 'Example 2', input: 'dog cat bird', explanation: 'The first characters already differ, so the prefix is empty.' },
    ],
    solution: {
      summary:
        'Treat the first word as the candidate prefix, then shrink it against every other word. The prefix can only get shorter, so bail out early the moment it is empty.',
      approach: [
        'Start with prefix = first word.',
        'For each subsequent word, advance while characters agree, then cut the prefix to that length.',
        'An empty prefix ends the scan immediately.',
      ],
      code: {
        language: 'javascript',
        code: `function longestCommonPrefix(words) {
  let prefix = words[0] ?? '';
  for (const word of words.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < word.length && prefix[i] === word[i]) i++;
    prefix = prefix.slice(0, i);
    if (!prefix) break;
  }
  return prefix;
}`,
      },
      complexity: 'O(S) where S is the total number of characters; O(1) extra space besides the prefix.',
      alternatives: ['Sort the words and compare only the first and last — the common prefix of those two is the answer.'],
      mistakes: ['Comparing all words pairwise instead of shrinking one candidate.', 'Not handling a single-word list.'],
    },
    hints: ['The answer can never be longer than the shortest word.', 'The prefix only ever shrinks — never grows.'],
    objectives: ['Implement prefix shrinking correctly', 'Practice early termination'],
    edgeCases: ['one word', 'identical words', 'no shared characters'],
  }),

  codingChallenge({
    id: 'coding.shifted-dispatch',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['caesar cipher', 'character arithmetic'],
    tags: ['cryptography', 'strings'],
    skills: ['Character arithmetic', 'Modular wrap-around'],
    subcategories: ['ciphers'],
    title: 'Shifted Dispatch',
    subtitle: 'Rotate the alphabet, keep the case.',
    description:
      'Apply a Caesar shift to a message: letters rotate through the alphabet, case is preserved, and everything else passes through untouched.',
    promptIntro:
      'The first line holds a shift amount `k` (which may be zero or larger than 25). The remaining lines hold the message. Shift each letter forward by `k` positions, wrapping from `z` back to `a`. Uppercase stays uppercase, lowercase stays lowercase, digits and punctuation do not change.',
    instructions: [
      'The first line contains the integer shift `k`.',
      'The rest of the input is the message (preserve newlines).',
      'Print the shifted message.',
    ],
    constraints: ['0 ≤ k ≤ 10^9.', 'The message is at most 10,000 characters.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const shift = Number.parseInt(lines[0]!.trim(), 10);
      const text = lines.slice(1).join('\n');
      const k = ((shift % 26) + 26) % 26;
      return text.replace(/[a-zA-Z]/g, (ch) => {
        const base = ch <= 'Z' ? 65 : 97;
        return String.fromCharCode(((ch.charCodeAt(0) - base + k) % 26) + base);
      });
    },
    tests: [
      { name: 'classic shift three', input: '3\nAttack at Dawn' },
      { name: 'shift wraps to zero', input: '26\nSame Message' },
      { name: 'shift 25', input: '25\nZebra Crossing' },
      { name: 'huge shift', input: '1000000000\nHello, World!' },
      { name: 'punctuation untouched', input: '13\nWhy did the chicken cross the road?' },
    ],
    examples: [
      { title: 'Example 1', input: '3\nAttack at Dawn', explanation: 'A→D, t→w, …: `Dwwdfn dw Gdzq`.' },
      { title: 'Example 2', input: '25\nZebra Crossing', explanation: 'Z wraps to A; e shifts to d; uppercase C becomes B.' },
    ],
    solution: {
      summary:
        'Normalize the shift with modulo 26 (careful with negative values), then shift each letter within its own case range using character arithmetic. Non-letters pass through.',
      approach: [
        'Reduce k: k = ((k % 26) + 26) % 26 — the double-mod keeps negatives safe.',
        'For each letter, compute its distance from its case base (65 for A–Z, 97 for a–z).',
        'Add k modulo 26 and convert back.',
      ],
      code: {
        language: 'javascript',
        code: `function caesar(text, k) {
  const shift = ((k % 26) + 26) % 26;
  return text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
  });
}`,
      },
      complexity: 'O(n) time, O(n) space.',
      mistakes: ['Forgetting the double-mod and producing negative offsets for shift 0 after % 26.', 'Shifting uppercase letters through the lowercase range.'],
    },
    hints: ['(((k % 26) + 26) % 26) is always in [0, 25].', 'Uppercase A–Z lives at code points 65–90; lowercase at 97–122.'],
    objectives: ['Master modular character arithmetic', 'Preserve structure while transforming content'],
    edgeCases: ['k = 0 and k = 26 (identity)', 'k larger than the message length', 'message with no letters at all'],
  }),

  codingChallenge({
    id: 'coding.nested-cascade',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['recursion', 'json parsing'],
    tags: ['recursion', 'arrays', 'json'],
    skills: ['Recursive traversal', 'Type narrowing'],
    subcategories: ['recursion'],
    title: 'The Nested Cascade',
    subtitle: 'Flatten what nesting hid.',
    description:
      'Flatten an arbitrarily nested JSON array of numbers into a single flat sequence — recursion in its most practical costume.',
    promptIntro:
      'You receive one line of JSON representing an array that may contain numbers or further arrays, nested to any depth. Flatten it: output all numbers in left-to-right order, space-separated.',
    instructions: ['Read one line of JSON from input.', 'Print the flattened numbers space-separated (empty output for an empty array).'],
    constraints: ['Nesting depth ≤ 100.', 'The JSON contains only numbers and arrays.'],
    run: (input) => {
      const parsed: unknown = JSON.parse(input.trim());
      const out: number[] = [];
      const walk = (value: unknown): void => {
        if (Array.isArray(value)) {
          value.forEach(walk);
        } else if (typeof value === 'number') {
          out.push(value);
        }
      };
      walk(parsed);
      return out.join(' ');
    },
    tests: [
      { name: 'deep nesting', input: '[1,[2,3],[4,[5,[6]]]]' },
      { name: 'already flat', input: '[1,2,3]' },
      { name: 'empty', input: '[]' },
      { name: 'empty nested', input: '[[],[[]],[1,[]]]' },
      { name: 'negatives and floats', input: '[-1,[2.5,[0]]]' },
    ],
    examples: [
      { title: 'Example 1', input: '[1,[2,3],[4,[5,[6]]]]', explanation: 'Four levels deep, all folded into one sequence.' },
      { title: 'Example 2', input: '[[],[[]],[1,[]]]', explanation: 'Empty shells vanish; only the 1 survives.' },
    ],
    solution: {
      summary:
        'Recurse: arrays are walked element by element, numbers are appended to the output. Order is preserved naturally by walking children left to right.',
      approach: [
        'Parse the JSON with `JSON.parse`.',
        'Define walk(value): if value is an array, walk every element; if it is a number, push it.',
        'Collect into one output list and join with spaces.',
      ],
      code: {
        language: 'javascript',
        code: `function flatten(value) {
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'number') out.push(v);
  };
  walk(value);
  return out;
}`,
      },
      complexity: 'O(n) over all elements; recursion depth equals nesting depth.',
      alternatives: ['An explicit stack of (array, index) pairs avoids recursion limits at extreme depth.'],
      mistakes: ['Returning `[...value].flat()` — `Array.prototype.flat` only flattens one level by default (use `flat(Infinity)` knowingly).', 'Pushing arrays into the output instead of recursing.'],
    },
    hints: ['Base case: a number. Recursive case: an array of things to walk.', 'Left-to-right output falls out of visiting children in order.'],
    objectives: ['Write clean recursive traversals', 'Use JSON.parse with type-narrowing care'],
    edgeCases: ['empty top-level array', 'arrays containing only empty arrays', 'deeply nested single element'],
  }),

  codingChallenge({
    id: 'coding.order-in-the-ranks',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['multi-key sorting', 'stable sort'],
    tags: ['sorting', 'comparators'],
    skills: ['Comparator composition', 'Tie-breaking'],
    subcategories: ['sorting'],
    title: 'Order in the Ranks',
    subtitle: 'Two rules, applied in the right order.',
    description:
      'Sort words by length, breaking ties alphabetically — a small exercise in composing comparison rules that generalizes to real ranking systems.',
    promptIntro:
      'You receive a list of words on one line. Sort them: primarily by length (shorter first), and alphabetically among words of equal length.',
    instructions: ['Read one line of space-separated words.', 'Print the sorted words space-separated.'],
    constraints: ['1..1,000 words, each 1..100 characters.', 'The sort must be deterministic — equal words stay adjacent.'],
    run: (input) => {
      const words = input.trim().split(/\s+/).filter(Boolean);
      return words
        .slice()
        .sort((a, b) => {
          if (a.length !== b.length) {
            return a.length - b.length;
          }
          return a < b ? -1 : a > b ? 1 : 0;
        })
        .join(' ');
    },
    tests: [
      { name: 'mixed lengths', input: 'banana kiwi fig apple' },
      { name: 'tie broken alphabetically', input: 'pear plum pea' },
      { name: 'same length only', input: 'delta alpha charlie bravo' },
      { name: 'duplicates', input: 'dog dog cat dog' },
      { name: 'single word', input: 'solo' },
    ],
    examples: [
      { title: 'Example 1', input: 'banana kiwi fig apple', explanation: 'fig (3), kiwi (4), apple (5), banana (6).' },
      { title: 'Example 2', input: 'pear plum pea', explanation: 'pea (3) beats pear (4) and plum (4); among 4-letter words, pear < plum.' },
    ],
    solution: {
      summary:
        'One comparator with two clauses: compare lengths first; only when they are equal, compare lexicographically. `Array.prototype.sort` handles the rest.',
      approach: [
        'If lengths differ, the shorter word wins.',
        'Otherwise compare with `<`/`>` on the strings (locale-independent and deterministic).',
        'Copy the array before sorting if the original order matters elsewhere.',
      ],
      code: {
        language: 'javascript',
        code: `const sorted = words.slice().sort((a, b) => {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
});`,
      },
      complexity: 'O(n log n) comparisons.',
      mistakes: [
        'Sorting twice (by name, then by length with a stable sort) — it works but the single comparator is clearer.',
        'Using `localeCompare` and getting locale-dependent order.',
      ],
    },
    hints: ['A comparator returns negative/zero/positive — decide the primary key before the tie-breaker.', 'Think about what "deterministic" means when two words are identical.'],
    objectives: ['Compose multi-key comparators', 'Avoid locale-dependent ordering'],
    edgeCases: ['all words the same length', 'exact duplicates', 'one word'],
  }),

  codingChallenge({
    id: 'coding.params-of-chaos',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['url parsing', 'percent encoding'],
    tags: ['urls', 'parsing', 'encoding'],
    skills: ['Query string semantics', 'Decoding rules'],
    subcategories: ['parsing'],
    title: 'Params of Chaos',
    subtitle: 'Every `&` and `%` has a job.',
    description:
      'Parse a URL query string correctly: pairs split on `&`, values on the first `=`, `+` means space, and percent escapes decode to UTF-8.',
    promptIntro:
      'Given a query string (no leading `?`), split it into `key=value` pairs and decode both sides. Rules: pairs are separated by `&`; a pair may have no `=` (value is empty); `+` decodes to a space; `%XX` sequences decode as UTF-8.',
    instructions: ['Read one query string from input.', 'Print each decoded pair as `key=value` on its own line, in order.'],
    constraints: ['The input contains only valid pairs and well-formed escapes.'],
    run: (input) => {
      const decode = (s: string) => decodeURIComponent(s.replace(/\+/g, ' '));
      return input
        .trim()
        .split('&')
        .filter((pair) => pair.length > 0)
        .map((pair) => {
          const eq = pair.indexOf('=');
          const key = eq === -1 ? pair : pair.slice(0, eq);
          const value = eq === -1 ? '' : pair.slice(eq + 1);
          return `${decode(key)}=${decode(value)}`;
        })
        .join('\n');
    },
    tests: [
      { name: 'basic pairs', input: 'q=hello+world&lang=en' },
      { name: 'flag without value', input: 'debug&x=1' },
      { name: 'value contains equals', input: 'token=abc=def' },
      { name: 'percent encoded utf-8', input: 'name=Br%C3%BCno' },
      { name: 'plus is space', input: 'bio=hi+there' },
    ],
    examples: [
      { title: 'Example 1', input: 'q=hello+world&lang=en', explanation: 'The `+` in the value decodes to a space.' },
      { title: 'Example 2', input: 'token=abc=def', explanation: 'Only the FIRST `=` splits key from value; the rest is data.' },
    ],
    solution: {
      summary:
        'Split on `&`, then split each pair on its first `=` only. Decode `+` → space before percent-decoding, on both sides.',
      approach: [
        '`split("&")` is safe here because raw `&` cannot appear inside a properly encoded pair.',
        'Use `indexOf("=")` — never `split("=")` — so values may contain `=`.',
        'Replace `+` with a space, then apply `decodeURIComponent`.',
      ],
      code: {
        language: 'javascript',
        code: `function parseQuery(qs) {
  const decode = (s) => decodeURIComponent(s.replace(/\\+/g, ' '));
  return qs.split('&').filter(Boolean).map((pair) => {
    const eq = pair.indexOf('=');
    const key = eq === -1 ? pair : pair.slice(0, eq);
    const value = eq === -1 ? '' : pair.slice(eq + 1);
    return decode(key) + '=' + decode(value);
  });
}`,
      },
      complexity: 'O(n) time and space.',
      mistakes: ['`pair.split("=")` breaks on values containing `=`.', 'Decoding before splitting on `&` — an encoded `%26` would be corrupted.'],
    },
    hints: ['Split on `&` first, decode last.', 'Values may legitimately contain `=` — how would `indexOf` help?'],
    objectives: ['Parse query strings per the URL spec', 'Understand percent-encoding and `+`'],
    edgeCases: ['key with no `=`', 'empty value', 'encoded `%26` and `%3D` inside values'],
  }),

  codingChallenge({
    id: 'coding.unruly-line',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['greedy algorithms', 'text layout'],
    tags: ['strings', 'greedy'],
    skills: ['Greedy wrapping', 'Width accounting'],
    subcategories: ['greedy'],
    title: 'The Unruly Line',
    subtitle: 'Greedy filling, word by word.',
    description:
      'Wrap text to a maximum line width, greedily fitting as many words per line as possible — the algorithm behind every textarea.',
    promptIntro:
      'The first line contains the maximum line width `W`. The second line contains the text. Wrap the text so that each line contains as many words as fit within `W` characters (words separated by single spaces). No line may exceed `W` characters; words are never split.',
    instructions: ['The first line contains `W` (1 ≤ W ≤ 200).', 'The second line contains the text (words of 1..W characters).', 'Print the wrapped text.'],
    constraints: ['Every single word fits on a line by itself.', 'Trailing spaces are not allowed.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const width = Number.parseInt(lines[0]!.trim(), 10);
      const words = lines.slice(1).join(' ').trim().split(/\s+/).filter(Boolean);
      const out: string[] = [];
      let line = '';
      for (const word of words) {
        if (line.length === 0) {
          line = word;
        } else if (line.length + 1 + word.length <= width) {
          line += ' ' + word;
        } else {
          out.push(line);
          line = word;
        }
      }
      if (line.length > 0) {
        out.push(line);
      }
      return out.join('\n');
    },
    tests: [
      { name: 'classic wrap', input: '12\nThe quick brown fox jumps over the lazy dog' },
      { name: 'exact fit', input: '9\none two three' },
      { name: 'long words', input: '5\nhi喷雾 missing' },
      { name: 'single word longer than nothing', input: '10\nsupercalifragilistic' },
      { name: 'width one', input: '1\na b c' },
    ],
    examples: [
      {
        title: 'Example 1',
        input: '12\nThe quick brown fox jumps over the lazy dog',
        explanation: 'Lines fill greedily: "The quick", "brown fox", "jumps over", "the lazy dog" (exactly 12).',
      },
      { title: 'Example 2', input: '9\none two three', explanation: '"one two" is 7; adding "three" would make 13, so it wraps.' },
    ],
    solution: {
      summary:
        'Greedy: keep a current line; add the next word if it still fits (previous length + 1 space + word length ≤ W), otherwise flush and start a new line with the word.',
      approach: [
        'Track the current line as a string, starting empty.',
        'Empty line: the word starts it unconditionally.',
        'Non-empty: test `line.length + 1 + word.length <= width` before appending.',
        'Flush the final line after the loop.',
      ],
      code: {
        language: 'javascript',
        code: `function wrap(words, width) {
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line.length === 0) line = word;
    else if (line.length + 1 + word.length <= width) line += ' ' + word;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}`,
      },
      complexity: 'O(total characters) time.',
      mistakes: ['Measuring `word.length` before a space that may not exist yet.', 'Splitting words that do not fit — the spec forbids it.'],
    },
    hints: ['Only two cases exist per word: the line is empty, or it is not.', 'The fit check is `current + 1 + word ≤ W` — the +1 is the space.'],
    objectives: ['Implement greedy text layout', 'Get boundary arithmetic exactly right'],
    edgeCases: ['word exactly fills the remaining width', 'width 1', 'text with repeated spaces in input (collapse them)'],
  }),

  codingChallenge({
    id: 'coding.scattered-isles',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'hard',
    minutes: 30,
    concepts: ['flood fill', 'connected components'],
    tags: ['graphs', 'grid', 'dfs'],
    skills: ['Grid traversal', 'Connected components'],
    subcategories: ['graphs'],
    title: 'The Scattered Isles',
    subtitle: 'Count the landmasses, not the cells.',
    description:
      'Count the islands in a binary grid — the canonical connected-components exercise that maps directly onto real flood-fill problems.',
    promptIntro:
      'A sea map is a grid of `0` (water) and `1` (land). An **island** is a maximal group of land cells connected horizontally or vertically (not diagonally). Count the islands.',
    instructions: [
      'The first line contains `r` and `c` — grid dimensions.',
      'The next `r` lines each contain `c` characters, `0` or `1`.',
      'Print the number of islands.',
    ],
    constraints: ['1 ≤ r, c ≤ 100.', 'Recursion depth or an explicit stack — your choice, but stay within memory limits.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const dims = lines[0]!.trim().split(/\s+/).map(Number);
      const r = dims[0]!;
      const c = dims[1]!;
      const grid: string[][] = [];
      for (let i = 0; i < r; i++) {
        grid.push((lines[i + 1] ?? '').trim().split(''));
      }
      const seen: boolean[][] = grid.map((row) => row.map(() => false));
      let count = 0;
      const walk = (row: number, col: number): void => {
        if (row < 0 || col < 0 || row >= r || col >= c) {
          return;
        }
        const cell = seen[row]?.[col];
        if (cell || grid[row]?.[col] === '0') {
          return;
        }
        if (seen[row] === undefined || seen[row]![col] === undefined) {
          return;
        }
        seen[row]![col] = true;
        walk(row + 1, col);
        walk(row - 1, col);
        walk(row, col + 1);
        walk(row, col - 1);
      };
      for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
          if (grid[i]?.[j] === '1' && !seen[i]?.[j]) {
            count++;
            walk(i, j);
          }
        }
      }
      return String(count);
    },
    tests: [
      { name: 'two islands', input: '4 4\n1100\n1100\n0011\n0011' },
      { name: 'all water', input: '3 3\n000\n000\n000' },
      { name: 'diagonal is not connected', input: '3 3\n100\n010\n001' },
      { name: 'one big island', input: '3 3\n111\n101\n111' },
      { name: 'thin strips', input: '1 5\n10101' },
    ],
    examples: [
      { title: 'Example 1', input: '4 4\n1100\n1100\n0011\n0011', explanation: 'A 2×2 landmass top-left and another bottom-right.' },
      { title: 'Example 2', input: '3 3\n100\n010\n001', explanation: 'Diagonal cells do not connect: three separate isles.' },
    ],
    solution: {
      summary:
        'Scan every cell; each unvisited land cell starts a new island. Flood-fill (DFS or BFS) from it, marking the whole connected group as visited, so each island is counted exactly once.',
      approach: [
        'Iterate over all cells in row-major order.',
        'On the first unvisited land cell, increment the counter and flood-fill.',
        'The fill walks up/down/left/right, marking visited water-bounded cells.',
        'Diagonals are intentionally excluded.',
      ],
      code: {
        language: 'javascript',
        code: `function countIslands(grid) {
  const seen = grid.map((row) => row.map(() => false));
  let count = 0;
  const walk = (r, c) => {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return;
    if (seen[r][c] || grid[r][c] === '0') return;
    seen[r][c] = true;
    walk(r + 1, c); walk(r - 1, c); walk(r, c + 1); walk(r, c - 1);
  };
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (grid[r][c] === '1' && !seen[r][c]) { count++; walk(r, c); }
  return count;
}`,
      },
      complexity: 'O(r·c) time and space — every cell is visited a constant number of times.',
      alternatives: ['Union-Find: merge adjacent land cells into sets, then count distinct roots.'],
      mistakes: ['Including diagonal neighbors, which merges separate isles.', 'Flood-filling without a visited marker, recursing forever.'],
    },
    hints: ['Every island has exactly one cell that the row-major scan reaches first.', 'The fill must mark cells visited before recursing, not after.'],
    objectives: ['Implement flood fill on a grid', 'Understand connected components in disguise'],
    edgeCases: ['all water', 'all land', 'diagonal-only contact', 'single row or column'],
  }),

  codingChallenge({
    id: 'coding.case-rites',
    category: 'coding',
    challengeType: 'coding',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['string transformation', 'naming conventions'],
    tags: ['strings', 'naming'],
    skills: ['Regex substitution', 'Convention handling'],
    subcategories: ['strings'],
    title: 'Naming Rites',
    subtitle: 'snake_case becomes camelCase.',
    description:
      'Convert a snake_case identifier to camelCase — the tiny transformation every code generator and API client eventually needs.',
    promptIntro:
      'You receive a lowercase snake_case identifier (letters and digits, separated by single underscores, no leading or trailing underscore). Convert it to camelCase: the first segment stays lowercase; every following segment has its first character uppercased; underscores disappear.',
    instructions: ['Read one identifier from input.', 'Print the camelCase form.'],
    constraints: ['The input matches `[a-z0-9]+(_[a-z0-9]+)*`.', 'Segments may contain digits but never start with one after an underscore.'],
    run: (input) => {
      const s = input.trim();
      return s.replace(/_+([a-z0-9])/g, (_match, ch: string) => ch.toUpperCase());
    },
    tests: [
      { name: 'simple pair', input: 'user_id' },
      { name: 'three segments', input: 'http_response_code' },
      { name: 'single segment', input: 'name' },
      { name: 'digits inside', input: 'md5_hash_value' },
      { name: 'short segments', input: 'a_b_c' },
    ],
    examples: [
      { title: 'Example 1', input: 'http_response_code', explanation: 'Segments: http, response, code → httpHttpResponse? No — httpHttpResponseCode.' },
      { title: 'Example 2', input: 'md5_hash_value', explanation: 'Digits stay put: md5HashValue.' },
    ],
    solution: {
      summary:
        'A single regex substitution: match an underscore followed by a character, and replace with the uppercased character. The first segment is untouched, which is exactly the camelCase rule.',
      approach: [
        'Match `_x` where x is the first character of a segment.',
        'Replace with x.toUpperCase(), consuming the underscore.',
        'The first segment has no preceding underscore, so it is naturally preserved.',
      ],
      code: {
        language: 'javascript',
        code: `const camel = (s) => s.replace(/_+([a-z0-9])/g, (_, ch) => ch.toUpperCase());`,
      },
      complexity: 'O(n) time and space.',
      mistakes: [
        'Splitting on `_`, uppercasing every segment including the first, then joining.',
        'Handling digits incorrectly — `toUpperCase` leaves them unchanged, which is what we want.',
      ],
    },
    hints: ['The first segment should NOT be changed — how does the regex guarantee that?', 'One substitution pattern is enough; no loop required.'],
    objectives: ['Use regex replace with a function', 'Respect the first-segment rule of camelCase'],
    edgeCases: ['single-segment input', 'consecutive segments like a_b_c', 'digits at segment boundaries'],
  }),
];
