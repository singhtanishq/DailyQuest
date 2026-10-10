import { codingChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Algorithms pool — classic techniques applied to concrete problems, plus a
 * few conceptual checkpoints on asymptotics and greedy correctness.
 */

export const algorithmTemplates: QuestTemplate[] = [
  codingChallenge({
    id: 'algo.rotated-search',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'hard',
    minutes: 25,
    concepts: ['binary search', 'rotated arrays'],
    tags: ['binary-search', 'arrays'],
    skills: ['Modified binary search', 'Invariant reasoning'],
    subcategories: ['searching'],
    title: 'The Rotated Index',
    subtitle: 'Sorted, then spun halfway.',
    description:
      'Binary search in a rotated sorted array — decide which half is still sorted, and you can always discard the other half.',
    promptIntro:
      'A sorted array of distinct integers was rotated at an unknown pivot. Given the array and a target, return the target’s index or `-1`. Your algorithm must run in O(log n).',
    instructions: [
      'The first line contains the target.',
      'The second line contains the rotated array (distinct integers).',
      'Print the index of the target, or `-1` if absent.',
    ],
    constraints: ['1 ≤ n ≤ 10^5.', 'All values are distinct.', 'O(log n) time required.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const target = Number.parseInt(lines[0]!.trim(), 10);
      const nums = (lines[1] ?? '').trim().split(/\s+/).map(Number);
      let lo = 0;
      let hi = nums.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const value = nums[mid]!;
        if (value === target) {
          return String(mid);
        }
        if (nums[lo]! <= value) {
          if (target >= nums[lo]! && target < value) {
            hi = mid - 1;
          } else {
            lo = mid + 1;
          }
        } else if (target > value && target <= nums[hi]!) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return '-1';
    },
    tests: [
      { name: 'target in second run', input: '0\n4 5 6 7 0 1 2' },
      { name: 'absent', input: '3\n4 5 6 7 0 1 2' },
      { name: 'target at start', input: '4\n4 5 6 7 0 1 2' },
      { name: 'target at end', input: '2\n4 5 6 7 0 1 2' },
      { name: 'unrotated', input: '3\n1 2 3 4 5' },
      { name: 'pivot early', input: '3\n5 1 3' },
    ],
    examples: [
      { title: 'Example 1', input: '0\n4 5 6 7 0 1 2', explanation: 'The rotation splits the array into two sorted runs; 0 lives in the second.' },
      { title: 'Example 2', input: '3\n4 5 6 7 0 1 2', explanation: '3 is not present; the search space empties.' },
    ],
    solution: {
      summary:
        'Standard binary search with one extra question: which side of `mid` is sorted? Compare `nums[lo]` with `nums[mid]` — if the left half is sorted and the target lies inside it, search left; otherwise search right (and symmetrically for a sorted right half).',
      approach: [
        'Compute mid; equal values terminate immediately.',
        'If nums[lo] ≤ nums[mid], the left half is sorted. If target is in [nums[lo], nums[mid]), search there; else go right.',
        'Otherwise the right half is sorted. If target is in (nums[mid], nums[hi]], go right; else left.',
        'The loop keeps a strict half-open invariant, so it always discards half the space.',
      ],
      code: {
        language: 'javascript',
        code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (target >= nums[lo] && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (target > nums[mid] && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
      },
      complexity: 'O(log n) time, O(1) space.',
      mistakes: [
        'Comparing the target only against nums[mid] and treating the array as fully sorted.',
        'Using `nums[lo] < nums[mid]` without the equality case, which breaks one-element halves.',
      ],
    },
    hints: [
      'In a rotated sorted array, at least one half around mid is always properly sorted.',
      'A sorted range is recognizable by its endpoints — compare nums[lo] with nums[mid].',
    ],
    objectives: ['Adapt binary search to a shifted invariant', 'Always discard half the search space'],
    edgeCases: ['no rotation at all', 'target at either boundary', 'two-element arrays'],
  }),

  codingChallenge({
    id: 'algo.two-sum-sorted',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['two pointers', 'sorted arrays'],
    tags: ['two-pointers', 'arrays'],
    skills: ['Two-pointer technique', 'Loop invariants'],
    subcategories: ['two-pointers'],
    title: 'The Paired Sum',
    subtitle: 'Squeeze the pair from both ends.',
    description:
      'Find two numbers in a sorted array that add to a target, using two pointers instead of a hash map.',
    promptIntro:
      'You receive a target and a sorted array of integers. Exactly one pair of distinct positions sums to the target when it exists. Output their 1-based indices, or `-1 -1` if no pair exists.',
    instructions: [
      'The first line contains the target.',
      'The second line contains the sorted array.',
      'Print two 1-based indices in ascending order, or `-1 -1`.',
    ],
    constraints: ['2 ≤ n ≤ 10^5.', 'Use O(1) extra space — the array is already sorted.', 'O(n) time expected.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const target = Number.parseInt(lines[0]!.trim(), 10);
      const nums = (lines[1] ?? '').trim().split(/\s+/).map(Number);
      let lo = 0;
      let hi = nums.length - 1;
      while (lo < hi) {
        const sum = nums[lo]! + nums[hi]!;
        if (sum === target) {
          return `${lo + 1} ${hi + 1}`;
        }
        if (sum < target) {
          lo++;
        } else {
          hi--;
        }
      }
      return '-1 -1';
    },
    tests: [
      { name: 'classic', input: '9\n2 7 11 15' },
      { name: 'inner pair', input: '8\n1 2 4 6' },
      { name: 'spanning pair', input: '5\n1 2 4 6' },
      { name: 'no pair', input: '100\n1 2 3' },
      { name: 'negatives', input: '-4\n-7 -3 1 4' },
    ],
    examples: [
      { title: 'Example 1', input: '9\n2 7 11 15', explanation: '2 + 7 = 9 → indices 1 and 2.' },
      { title: 'Example 2', input: '5\n1 2 4 6', explanation: '1 + 4 = 5 → indices 1 and 3.' },
    ],
    solution: {
      summary:
        'Start with pointers at both ends. If the sum is too small, the only way to grow it is to advance the left pointer; if too large, retreat the right one. Each step safely discards one element.',
      approach: [
        'lo = 0, hi = n - 1.',
        'sum = nums[lo] + nums[hi]: equal → done; too small → lo++; too large → hi--.',
        'The sortedness guarantees no discarded element could ever complete a pair.',
      ],
      code: {
        language: 'javascript',
        code: `function twoSum(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const sum = nums[lo] + nums[hi];
    if (sum === target) return [lo + 1, hi + 1];
    if (sum < target) lo++;
    else hi--;
  }
  return null;
}`,
      },
      complexity: 'O(n) time, O(1) space.',
      mistakes: ['Using a hash map (works, but wastes the sortedness and O(1) space).', 'Advancing both pointers at once after a miss.'],
    },
    hints: ['If the current sum is too small, can the right pointer ever help?', 'Each comparison permanently eliminates exactly one candidate.'],
    objectives: ['Apply the two-pointer pattern', 'Trust and articulate the invariant'],
    edgeCases: ['pair at the outermost positions', 'negative values', 'no valid pair'],
  }),

  codingChallenge({
    id: 'algo.window-max-sum',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['sliding window', 'prefix sums'],
    tags: ['sliding-window', 'arrays'],
    skills: ['Window maintenance', 'Incremental updates'],
    subcategories: ['sliding-window'],
    title: 'The Widest View',
    subtitle: 'Slide the frame, keep the running total.',
    description:
      'Find the maximum sum of any contiguous window of size k — the friendliest introduction to sliding windows.',
    promptIntro:
      'Given an integer k and an array, find the maximum sum among all contiguous subarrays of exactly k elements.',
    instructions: [
      'The first line contains k.',
      'The second line contains the array.',
      'Print the maximum window sum.',
    ],
    constraints: ['1 ≤ k ≤ n ≤ 10^5.', 'O(n) time required — re-summing every window is too slow.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const k = Number.parseInt(lines[0]!.trim(), 10);
      const nums = (lines[1] ?? '').trim().split(/\s+/).map(Number);
      let window = 0;
      for (let i = 0; i < k; i++) {
        window += nums[i]!;
      }
      let best = window;
      for (let i = k; i < nums.length; i++) {
        window += nums[i]! - nums[i - k]!;
        if (window > best) {
          best = window;
        }
      }
      return String(best);
    },
    tests: [
      { name: 'peak in middle', input: '3\n1 4 2 10 2 3 1' },
      { name: 'window of two', input: '2\n5 1 3 2' },
      { name: 'window of one', input: '1\n-2 7 -1 4' },
      { name: 'whole array', input: '4\n1 2 3 4' },
      { name: 'negatives', input: '2\n-5 -3 -8 -1' },
    ],
    examples: [
      { title: 'Example 1', input: '3\n1 4 2 10 2 3 1', explanation: 'The window [4, 2, 10] sums to 16 and wins.' },
      { title: 'Example 2', input: '2\n-5 -3 -8 -1', explanation: 'All windows are negative; the best is (-5) + (-3) = -8.' },
    ],
    solution: {
      summary:
        'Compute the first window’s sum once. Then slide: add the entering element, subtract the leaving one. Track the maximum in a single pass.',
      approach: [
        'Sum indices 0..k-1 to seed the window.',
        'For each i from k onward: window += nums[i] - nums[i-k].',
        'best = max(best, window) after each slide.',
      ],
      code: {
        language: 'javascript',
        code: `function maxWindowSum(nums, k) {
  let window = 0;
  for (let i = 0; i < k; i++) window += nums[i];
  let best = window;
  for (let i = k; i < nums.length; i++) {
    window += nums[i] - nums[i - k];
    if (window > best) best = window;
  }
  return best;
}`,
      },
      complexity: 'O(n) time, O(1) space.',
      mistakes: ['Recomputing the window sum from scratch — O(n·k).', 'Off-by-one: subtracting nums[i-k] after adding nums[i] in the wrong order (harmless here, fatal with max-only windows).'],
    },
    hints: ['Two adjacent windows share k-1 elements.', 'What enters the window when it slides one step right, and what leaves?'],
    objectives: ['Maintain an aggregate incrementally', 'Recognize fixed-size window problems'],
    edgeCases: ['k equals the array length', 'k = 1 (pure maximum)', 'all-negative arrays'],
  }),

  codingChallenge({
    id: 'algo.unique-characters-window',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['sliding window', 'last-seen map'],
    tags: ['sliding-window', 'strings'],
    skills: ['Variable window control', 'Index bookkeeping'],
    subcategories: ['sliding-window'],
    title: 'The Memoryless Substring',
    subtitle: 'Longest stretch without a repeat.',
    description:
      'Find the length of the longest substring without repeating characters — a variable-size sliding window with a precise restart rule.',
    promptIntro:
      'Given a string, find the length of the longest contiguous substring in which no character appears more than once.',
    instructions: ['Read one string from input.', 'Print the length of the longest repeat-free substring.'],
    constraints: ['The string may be empty.', 'Length up to 10^5. O(n) expected.'],
    run: (input) => {
      const s = input.trim();
      const lastSeen = new Map<string, number>();
      let start = 0;
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i]!;
        const prev = lastSeen.get(ch);
        if (prev !== undefined && prev >= start) {
          start = prev + 1;
        }
        lastSeen.set(ch, i);
        if (i - start + 1 > best) {
          best = i - start + 1;
        }
      }
      return String(best);
    },
    tests: [
      { name: 'abcabcbb', input: 'abcabcbb' },
      { name: 'all same', input: 'bbbbb' },
      { name: 'pwwkew', input: 'pwwkew' },
      { name: 'empty', input: '' },
      { name: 'the abba trap', input: 'abba' },
      { name: 'dvdf', input: 'dvdf' },
    ],
    examples: [
      { title: 'Example 1', input: 'abcabcbb', explanation: 'The answer is 3: "abc".' },
      { title: 'Example 2', input: 'abba', explanation: 'The trap: after "ab", the second b restarts at index 2 — but the second a at index 3 must NOT restart before 2. Answer 2.' },
    ],
    solution: {
      summary:
        'Keep a window [start, i] with no repeats, plus a map of each character’s last index. When the current character was last seen inside the window, jump `start` to that index + 1. Update best as you go.',
      approach: [
        'Iterate i over the string; fetch the character’s previous index.',
        'If the previous index is ≥ start, the repeat is inside the window: move start past it.',
        'Record the current index, then measure i - start + 1 against best.',
        'The `prev >= start` guard is what makes "abba" work.',
      ],
      code: {
        language: 'javascript',
        code: `function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();
  let start = 0, best = 0;
  for (let i = 0; i < s.length; i++) {
    const prev = lastSeen.get(s[i]);
    if (prev !== undefined && prev >= start) start = prev + 1;
    lastSeen.set(s[i], i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}`,
      },
      complexity: 'O(n) time, O(min(n, alphabet)) space.',
      mistakes: [
        'Moving `start` backwards on stale duplicates — the classic "abba" bug when you forget `prev >= start`.',
        'Using a set and shrinking the window one character at a time (correct but slower to reason about).',
      ],
    },
    hints: ['The window only ever moves forward; start never decreases.', 'A character seen before the window began is not a repeat.'],
    objectives: ['Master variable-size sliding windows', 'Handle the stale-index trap correctly'],
    edgeCases: ['empty string', 'the abba restart trap', 'all unique', 'all identical'],
  }),

  codingChallenge({
    id: 'algo.max-subarray',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['kadane algorithm', 'dynamic programming'],
    tags: ['dp', 'arrays'],
    skills: ['Kadane’s algorithm', 'Running-extremum thinking'],
    subcategories: ['dp'],
    title: 'The Boldest Stretch',
    subtitle: 'Best contiguous sum, one decision per element.',
    description:
      'Maximum subarray sum via Kadane’s algorithm — the smallest dynamic program with the biggest payoff.',
    promptIntro:
      'Given an array of integers (at least one element), find the maximum sum of a non-empty contiguous subarray.',
    instructions: ['Read one line of space-separated integers.', 'Print the maximum subarray sum.'],
    constraints: ['1 ≤ n ≤ 10^5.', 'The subarray must be non-empty (all-negative arrays return the largest element).', 'O(n) time, O(1) space.'],
    run: (input) => {
      const nums = input.trim().split(/\s+/).map(Number);
      let best = nums[0]!;
      let current = nums[0]!;
      for (let i = 1; i < nums.length; i++) {
        current = Math.max(nums[i]!, current + nums[i]!);
        best = Math.max(best, current);
      }
      return String(best);
    },
    tests: [
      { name: 'mixed', input: '-2 1 -3 4 -1 2 1 -5 4' },
      { name: 'single', input: '1' },
      { name: 'all negative', input: '-3 -1 -2' },
      { name: 'all positive', input: '5 4 -1 7 8' },
      { name: 'alternating', input: '8 -19 5 -4 20' },
    ],
    examples: [
      { title: 'Example 1', input: '-2 1 -3 4 -1 2 1 -5 4', explanation: '[4, -1, 2, 1] sums to 6.' },
      { title: 'Example 2', input: '-3 -1 -2', explanation: 'All negative: the best subarray is the single element -1.' },
    ],
    solution: {
      summary:
        'Kadane: at each element decide — extend the previous best run, or start fresh here. current = max(x, current + x); best = max(best, current). Initializing with the first element handles all-negative arrays.',
      approach: [
        'current = best = nums[0].',
        'For each later x: current = max(x, current + x) — either the run continues or restarts.',
        'best tracks the global maximum.',
        'Restarting at x is always safe because a negative carry can only hurt.',
      ],
      code: {
        language: 'javascript',
        code: `function maxSubArray(nums) {
  let best = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}`,
      },
      complexity: 'O(n) time, O(1) space.',
      mistakes: ['Initializing current = 0, which returns 0 for all-negative arrays (an empty subarray).', 'Resetting current to 0 instead of to the current element.'],
    },
    hints: ['"Extend or restart" is one Math.max per element.', 'A negative running prefix can never help the elements after it.'],
    objectives: ['Implement Kadane’s algorithm', 'Understand why restart beats carry'],
    edgeCases: ['single element', 'all negative', 'best run at the very end'],
  }),

  codingChallenge({
    id: 'algo.coin-change',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'intermediate',
    minutes: 25,
    concepts: ['dynamic programming', 'unbounded knapsack'],
    tags: ['dp', 'coins'],
    skills: ['Bottom-up DP', 'Greedy fallibility'],
    subcategories: ['dp'],
    title: 'The Coin Collector',
    subtitle: 'Fewest coins — greed not guaranteed.',
    description:
      'Minimum number of coins to reach an amount with arbitrary denominations — the DP that proves greedy is not always right.',
    promptIntro:
      'You receive an amount and a list of coin denominations (unlimited supply of each). Print the minimum number of coins that sum exactly to the amount, or `-1` if impossible.',
    instructions: [
      'The first line contains the amount.',
      'The second line contains the distinct denominations.',
      'Print the minimum coin count, or `-1`.',
    ],
    constraints: ['0 ≤ amount ≤ 10^4.', 'Denominations are positive integers.', 'O(amount × coins) is the intended complexity.'],
    run: (input) => {
      const lines = input.trim().split('\n');
      const amount = Number.parseInt(lines[0]!.trim(), 10);
      const coins = (lines[1] ?? '').trim().split(/\s+/).filter(Boolean).map(Number);
      const INF = Number.POSITIVE_INFINITY;
      const dp: number[] = new Array(amount + 1).fill(INF);
      dp[0] = 0;
      for (let a = 1; a <= amount; a++) {
        for (const coin of coins) {
          if (coin <= a && dp[a - coin]! + 1 < dp[a]!) {
            dp[a] = dp[a - coin]! + 1;
          }
        }
      }
      return dp[amount] === INF ? '-1' : String(dp[amount]);
    },
    tests: [
      { name: 'canonical coins', input: '11\n1 2 5' },
      { name: 'impossible', input: '3\n2' },
      { name: 'zero amount', input: '0\n1 2 5' },
      { name: 'greedy fails here', input: '6\n1 3 4' },
      { name: 'large amount small coins', input: '7\n2 4' },
    ],
    examples: [
      { title: 'Example 1', input: '11\n1 2 5', explanation: '5 + 5 + 1 → 3 coins.' },
      { title: 'Example 2', input: '6\n1 3 4', explanation: 'Greedy picks 4+1+1 (3 coins); the optimum is 3+3 (2 coins).' },
    ],
    solution: {
      summary:
        'Bottom-up DP over amounts 0..amount: dp[a] = 1 + min(dp[a - coin]) over usable coins. dp[0] = 0; unreachable amounts stay at infinity. Greedy fails exactly when a locally-largest coin blocks a perfect fit.',
      approach: [
        'dp[0] = 0 — zero coins make zero.',
        'For each amount a, try every coin ≤ a and take the best predecessor + 1.',
        'The answer is dp[amount]; infinity means unreachable.',
      ],
      code: {
        language: 'javascript',
        code: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      },
      complexity: 'O(amount × number of coins) time, O(amount) space.',
      mistakes: ['Using greedy largest-first — correct for canonical systems (1,5,10), wrong in general.', 'Iterating coins in the outer loop but expecting order-independence (it is, for min-coins — but the reasoning differs from counting combinations).'],
    },
    hints: ['Every optimal amount is one coin on top of a smaller optimal amount.', 'dp[0] = 0 is the seed; infinity means "not yet reachable".'],
    objectives: ['Build a bottom-up unbounded-knapsack DP', 'Know when greedy fails and why'],
    edgeCases: ['amount 0', 'impossible amounts', 'denominations larger than the amount'],
  }),

  codingChallenge({
    id: 'algo.climb-stairs',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['dynamic programming', 'fibonacci'],
    tags: ['dp', 'counting'],
    skills: ['Recurrence derivation', 'Two-variable DP'],
    subcategories: ['dp'],
    title: 'The Staircase Counter',
    subtitle: 'One step or two — how many ways?',
    description:
      'Count the ways to climb n stairs taking 1 or 2 steps at a time — Fibonacci wearing a staircase costume.',
    promptIntro:
      'You are at the bottom of a staircase with `n` steps. Each move you climb exactly 1 or 2 steps. Print the number of distinct ways to reach the top.',
    instructions: ['Read n from input.', 'Print the number of distinct climbing sequences.'],
    constraints: ['1 ≤ n ≤ 60.', 'O(n) time, O(1) space.'],
    run: (input) => {
      const n = Number.parseInt(input.trim(), 10);
      let a = 1;
      let b = 1;
      for (let i = 2; i <= n; i++) {
        const next = a + b;
        a = b;
        b = next;
      }
      return String(b);
    },
    tests: [
      { name: 'one step', input: '1' },
      { name: 'two steps', input: '2' },
      { name: 'five steps', input: '5' },
      { name: 'ten steps', input: '10' },
      { name: 'twenty steps', input: '20' },
    ],
    examples: [
      { title: 'Example 1', input: '3', explanation: '1+1+1, 1+2, 2+1 → 3 ways.' },
      { title: 'Example 2', input: '5', explanation: 'The sequence 1, 2, 3, 5, 8 → 8 ways.' },
    ],
    solution: {
      summary:
        'ways(n) = ways(n-1) + ways(n-2): the last move is a 1-step or a 2-step. That recurrence is Fibonacci, so two rolling variables suffice — no array needed.',
      approach: [
        'Base cases: ways(1) = 1, and define ways(0) = 1 (empty climb).',
        'Iterate i from 2 to n: next = a + b, then shift the window.',
        'Return b.',
      ],
      code: {
        language: 'javascript',
        code: `function climbStairs(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}`,
      },
      complexity: 'O(n) time, O(1) space.',
      mistakes: ['Memoizing into an array when two variables do the job.', 'Off-by-one in the base cases producing 2·Fibonacci.'],
    },
    hints: ['Think backwards: what could your final move have been?', 'ways(n) counts sequences — the recurrence is additive, exactly like Fibonacci.'],
    objectives: ['Derive a recurrence from a counting problem', 'Compress DP state to two variables'],
    edgeCases: ['n = 1', 'n = 2', 'large n within 64-bit range'],
  }),

  codingChallenge({
    id: 'algo.unique-paths',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 15,
    concepts: ['dynamic programming', 'combinatorics'],
    tags: ['dp', 'grids'],
    skills: ['Grid DP', 'Space compression'],
    subcategories: ['dp'],
    title: 'The Grid Walker',
    subtitle: 'Right or down, never back.',
    description:
      'Count the paths across a grid moving only right or down — and compress the DP table to a single row.',
    promptIntro:
      'A robot starts at the top-left corner of an `m × n` grid and moves only right or down to reach the bottom-right corner. Print the number of distinct paths.',
    instructions: ['Read m and n from one line.', 'Print the number of distinct monotone paths.'],
    constraints: ['1 ≤ m, n ≤ 100.', 'O(m·n) time; O(n) space preferred.'],
    run: (input) => {
      const parts = input.trim().split(/\s+/).map(Number);
      const m = parts[0]!;
      const n = parts[1]!;
      const row: number[] = new Array(n).fill(1);
      for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
          row[j] = row[j]! + row[j - 1]!;
        }
      }
      return String(row[n - 1]!);
    },
    tests: [
      { name: 'three by seven', input: '3 7' },
      { name: 'three by two', input: '3 2' },
      { name: 'single cell', input: '1 1' },
      { name: 'single row', input: '1 10' },
      { name: 'seven by three', input: '7 3' },
    ],
    examples: [
      { title: 'Example 1', input: '3 7', explanation: '28 paths — this is the classic LeetCode example.' },
      { title: 'Example 2', input: '3 2', explanation: '3 paths: down-down-right, down-right-down, right-down-down.' },
    ],
    solution: {
      summary:
        'paths(i, j) = paths(i-1, j) + paths(i, j-1). Keep one row: after processing row i, row[j] already holds the count for that cell because row[j-1] was updated in the same pass.',
      approach: [
        'Initialize a row of ones (first row of the grid).',
        'For each subsequent row, row[j] += row[j-1]: the value above (old row[j]) plus the value to the left.',
        'The last cell of the final row is the answer.',
        'Closed form for the brave: C(m+n-2, m-1).',
      ],
      code: {
        language: 'javascript',
        code: `function uniquePaths(m, n) {
  const row = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      row[j] += row[j - 1];
    }
  }
  return row[n - 1];
}`,
      },
      complexity: 'O(m·n) time, O(n) space.',
      mistakes: ['Allocating the full 2-D table when one row carries everything.', 'Forgetting that row-major updates make row[j-1] the "left neighbor" of the current row.'],
    },
    hints: ['Every path into (i, j) arrives from above or from the left.', 'A single row can hold both "above" and "left" values if updated in the right order.'],
    objectives: ['Translate a 2-D recurrence into a rolling array', 'Connect DP counts to binomial coefficients'],
    edgeCases: ['1×1 grid', 'single row or column (answer 1)', 'square grids'],
  }),

  codingChallenge({
    id: 'algo.majority-vote',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['boyer-moore voting', 'streaming algorithms'],
    tags: ['counting', 'arrays'],
    skills: ['Boyer–Moore voting', 'Constant-space scanning'],
    subcategories: ['counting'],
    title: 'The Majority Vote',
    subtitle: 'One candidate survives the runoff.',
    description:
      'Find the majority element in O(1) space with Boyer–Moore voting — no hash map, no sorting.',
    promptIntro:
      'An array of n integers contains an element more than ⌊n/2⌋ times (guaranteed). Find it without extra data structures.',
    instructions: ['Read one line of space-separated integers.', 'Print the majority element.'],
    constraints: ['1 ≤ n ≤ 10^6.', 'O(n) time, O(1) space required.'],
    run: (input) => {
      const nums = input.trim().split(/\s+/).filter(Boolean).map(Number);
      let candidate: number | null = null;
      let count = 0;
      for (const n of nums) {
        if (count === 0) {
          candidate = n;
          count = 1;
        } else if (candidate === n) {
          count++;
        } else {
          count--;
        }
      }
      return String(candidate);
    },
    tests: [
      { name: 'simple majority', input: '3 2 3' },
      { name: 'alternating pairs', input: '2 2 1 1 1 2 2' },
      { name: 'single element', input: '1' },
      { name: 'majority at the end', input: '9 4 9 9' },
      { name: 'large majority', input: '5 5 5 5 1' },
    ],
    examples: [
      { title: 'Example 1', input: '2 2 1 1 1 2 2', explanation: '2 appears 4 of 7 times — the majority.' },
      { title: 'Example 2', input: '3 2 3', explanation: '3 appears twice of three.' },
    ],
    solution: {
      summary:
        'Keep a candidate and a counter. Equal → increment; different → decrement; zero → adopt the current element as the new candidate. The majority element cannot be fully cancelled, so it survives.',
      approach: [
        'count = 0; candidate = null.',
        'For each element: adopt it when count hits zero; otherwise increment on match, decrement on mismatch.',
        'Because the majority exceeds half, its surplus never cancels to zero by the end.',
      ],
      code: {
        language: 'javascript',
        code: `function majorityElement(nums) {
  let candidate = null, count = 0;
  for (const n of nums) {
    if (count === 0) candidate = n;
    count += n === candidate ? 1 : -1;
  }
  return candidate;
}`,
      },
      complexity: 'O(n) time, O(1) space.',
      mistakes: ['Assuming the final candidate is always right without the majority guarantee — without it you need a second verification pass.', 'Sorting "for simplicity" — O(n log n) and unnecessary.'],
    },
    hints: ['Pair off different elements: what survives unlimited pairing?', 'The counter measures the candidate’s surplus, not its total.'],
    objectives: ['Implement Boyer–Moore voting', 'Explain why cancellation preserves the majority'],
    edgeCases: ['majority at the array end', 'single element', 'exactly half plus one'],
  }),

  codingChallenge({
    id: 'algo.merge-intervals',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'intermediate',
    minutes: 20,
    concepts: ['interval merging', 'sorting'],
    tags: ['intervals', 'sorting'],
    skills: ['Sort-then-scan', 'Overlap detection'],
    subcategories: ['intervals'],
    title: 'The Overlapping Meetings',
    subtitle: 'Sort first, then merge in one sweep.',
    description:
      'Merge overlapping intervals — the pattern behind calendar apps, IP range tables and genomic regions.',
    promptIntro:
      'You receive a list of intervals, one per line (`start end`). Merge all overlapping or touching intervals and print the result as `start-end` tokens separated by spaces, in ascending order.',
    instructions: [
      'Each input line contains two integers: start and end.',
      'Intervals may arrive in any order.',
      'Print the merged intervals as `start-end` tokens, space-separated.',
    ],
    constraints: ['1 ≤ number of intervals ≤ 10^4.', 'start ≤ end for every interval.'],
    run: (input) => {
      const intervals = input
        .trim()
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => line.trim().split(/\s+/).map(Number));
      intervals.sort((a, b) => a[0]! - b[0]!);
      const merged: number[][] = [];
      for (const interval of intervals) {
        const last = merged[merged.length - 1];
        if (last && interval[0]! <= last[1]!) {
          last[1] = Math.max(last[1]!, interval[1]!);
        } else {
          merged.push([interval[0]!, interval[1]!]);
        }
      }
      return merged.map((m) => `${m[0]}-${m[1]}`).join(' ');
    },
    tests: [
      { name: 'classic merge', input: '1 3\n2 6\n8 10\n15 18' },
      { name: 'touching intervals', input: '1 4\n4 5' },
      { name: 'unsorted input', input: '8 10\n1 3\n15 18\n2 6' },
      { name: 'nested interval', input: '1 10\n2 3' },
      { name: 'single interval', input: '5 7' },
    ],
    examples: [
      { title: 'Example 1', input: '1 3\n2 6\n8 10\n15 18', explanation: '[1,3] and [2,6] overlap → [1,6]; the rest stand alone.' },
      { title: 'Example 2', input: '1 4\n4 5', explanation: 'Touching endpoints merge into [1,5].' },
    ],
    solution: {
      summary:
        'Sort by start, then sweep: if the next interval starts before the current merged one ends, extend its end to the max; otherwise start a new merged interval.',
      approach: [
        'Sort intervals by start ascending.',
        'Maintain a list of merged intervals; compare each new interval with the last merged one.',
        'Overlap (or touch, since `<=`) means extend; otherwise append.',
      ],
      code: {
        language: 'javascript',
        code: `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of intervals) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}`,
      },
      complexity: 'O(n log n) for the sort, O(n) for the sweep.',
      mistakes: ['Merging in input order without sorting.', 'Using `<` instead of `<=` and leaving touching intervals unmerged.'],
    },
    hints: ['After sorting, any interval that can overlap the current merged block must be its immediate successor.', 'Touching intervals ([1,4] and [4,5]) usually merge in calendars.'],
    objectives: ['Apply the sort-then-scan pattern', 'Handle boundary-touch semantics deliberately'],
    edgeCases: ['nested intervals', 'touching endpoints', 'unsorted input', 'single interval'],
  }),

  codingChallenge({
    id: 'algo.palindrome-number',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 15,
    concepts: ['math without strings', 'half reversal'],
    tags: ['math', 'palindrome'],
    skills: ['Digit arithmetic', 'Half-reversal trick'],
    subcategories: ['math'],
    title: 'The Mirror Number',
    subtitle: 'Reverse half, compare once.',
    description:
      'Check whether an integer is a palindrome without converting it to a string — reverse only half the digits.',
    promptIntro:
      'Determine whether a non-negative-integer-or-negative input reads the same forwards and backwards — without any string conversion. Print `yes` or `no`.',
    instructions: ['Read one integer from input.', 'Print `yes` if it is a palindrome, otherwise `no`.'],
    constraints: ['No string conversion of the number.', 'Negative numbers are never palindromes.'],
    run: (input) => {
      const n = Number.parseInt(input.trim(), 10);
      if (n < 0 || (n % 10 === 0 && n !== 0)) {
        return 'no';
      }
      let reversed = 0;
      let rest = n;
      while (rest > reversed) {
        reversed = reversed * 10 + (rest % 10);
        rest = Math.floor(rest / 10);
      }
      return reversed === rest || Math.floor(reversed / 10) === rest ? 'yes' : 'no';
    },
    tests: [
      { name: 'odd length', input: '121' },
      { name: 'negative', input: '-121' },
      { name: 'trailing zero', input: '10' },
      { name: 'zero', input: '0' },
      { name: 'five digits', input: '12321' },
      { name: 'not a palindrome', input: '123' },
    ],
    examples: [
      { title: 'Example 1', input: '12321', explanation: 'Reversed half (12…21) matches the rest (123 → 12 | 3). Yes.' },
      { title: 'Example 2', input: '10', explanation: 'Ends in zero but is not zero — cannot be a palindrome.' },
    ],
    solution: {
      summary:
        'Reject negatives and non-zero multiples of ten. Then reverse digits while the reversed half is still smaller than the rest; at the end compare equal (even length) or reversed/10 === rest (odd length).',
      approach: [
        'Early exits: n < 0 → no; n % 10 === 0 && n !== 0 → no.',
        'Loop while rest > reversed: peel a digit onto reversed.',
        'Compare reversed === rest (even digit count) or reversed/10 === rest (odd, drop the middle digit).',
      ],
      code: {
        language: 'javascript',
        code: `function isPalindrome(n) {
  if (n < 0 || (n % 10 === 0 && n !== 0)) return false;
  let reversed = 0, rest = n;
  while (rest > reversed) {
    reversed = reversed * 10 + rest % 10;
    rest = Math.floor(rest / 10);
  }
  return reversed === rest || Math.floor(reversed / 10) === rest;
}`,
      },
      complexity: 'O(log₁₀ n) time, O(1) space.',
      mistakes: ['Reversing the entire number and risking overflow in fixed-width languages.', 'Forgetting that 0 is a palindrome while 10, 100, 1000 never are.'],
    },
    hints: ['You never need more than half the digits.', 'Odd-length palindromes have a middle digit that matches anything — drop it.'],
    objectives: ['Manipulate digits arithmetically', 'Use half-reversal to avoid overflow'],
    edgeCases: ['negative input', 'trailing zeros', 'single digit', 'zero'],
  }),

  quizChallenge({
    id: 'algo.greedy-choice',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'intermediate',
    minutes: 10,
    concepts: ['greedy algorithms', 'interval scheduling'],
    tags: ['greedy', 'proofs'],
    skills: ['Exchange arguments', 'Greedy correctness'],
    subcategories: ['greedy'],
    title: 'The Earliest Farewell',
    subtitle: 'Which greedy choice actually works?',
    description:
      'Interval scheduling has four tempting greedy strategies — only one is provably optimal.',
    question:
      'You must schedule the maximum number of non-overlapping meetings in one room. Which greedy strategy is guaranteed to be optimal?',
    options: [
      'Always take the meeting that finishes earliest, then recurse on the rest',
      'Always take the meeting that starts earliest',
      'Always take the shortest meeting',
      'Always take the meeting that conflicts with the fewest others',
    ],
    optionExplanations: [
      'Correct: the exchange argument works — any optimal solution can swap its first meeting for the earliest-finishing one without losing room, so taking it first is always safe.',
      'An early starter may run all day (a 9-to-5 block) and block everything else.',
      'Short duration helps, but a short meeting placed at the wrong time can still displace two longer, better-positioned meetings.',
      '"Fewest conflicts" is intuitive but has constructed counterexamples where a low-conflict meeting sits in the only slot two disjoint meetings could use.',
    ],
    reasoning: [
      'Let f be the meeting that finishes earliest overall.',
      'Any optimal schedule’s first meeting can be replaced by f: f ends no later, so everything after still fits.',
      'Therefore an optimal solution exists that contains f — greedy choice is safe, and induction finishes the proof.',
    ],
    hints: ['The correct strategy’s optimality has a classic exchange-argument proof.', 'Ask: after making the choice, is there always an optimal solution that agrees with it?'],
    objectives: ['Distinguish plausible-but-wrong greedy rules', 'Understand exchange arguments'],
  }),

  quizChallenge({
    id: 'algo.complexity-dominance',
    category: 'algorithms',
    challengeType: 'algorithm',
    difficulty: 'easy',
    minutes: 8,
    concepts: ['asymptotic analysis', 'big-O'],
    tags: ['complexity'],
    skills: ['Asymptotic reasoning'],
    subcategories: ['complexity'],
    title: 'The Slowest Racer',
    subtitle: 'Which complexity dominates them all?',
    description: 'A quick asymptotic reality check: polynomial vs. exponential.',
    question:
      'For sufficiently large input size n, which of these running times grows fastest?',
    options: [
      'O(n! / 2ⁿ)',
      'O(2ⁿ)',
      'O(n¹⁰⁰)',
      'O(n²⁰ · log n)',
    ],
    optionExplanations: [
      'Correct. By Stirling’s approximation n! ≈ (n/e)ⁿ, so n!/2ⁿ ≈ (n/(2e))ⁿ — super-exponential growth that eventually beats plain 2ⁿ.',
      'O(2ⁿ) is exponential and dwarfs every polynomial — but it is still dominated by the factorial-based option.',
      'n¹⁰⁰ is a fixed polynomial; any exponential 2ᵏⁿ with k > 0 eventually overtakes it, no matter how large the exponent.',
      'n²⁰ · log n is polynomial (times a logarithm), so both exponentials dominate it.',
    ],
    reasoning: [
      'Both O(n!/2ⁿ) and O(2ⁿ) are exponential-flavored; the polynomials never compete.',
      'Stirling: n! ≈ (n/e)ⁿ · √(2πn), so n!/2ⁿ ≈ (n/(2e))ⁿ · √(2πn), whose base (n/(2e)) itself grows with n.',
      'Therefore n!/2ⁿ grows faster than any fixed-base exponential — it is the fastest of the four.',
    ],
    hints: ['Two options are exponential-flavored — compare those, not the polynomials.', 'Stirling: n! ≈ (n/e)ⁿ · √(2πn), so n!/2ⁿ ≈ (n/(2e))ⁿ · √(2πn).'],
    objectives: ['Compare growth rates precisely', 'Read asymptotic questions carefully before answering'],
  }),
];
