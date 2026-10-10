import { openChallenge, quizChallenge, shellChallenge, type QuestTemplate } from './framework.js';

/**
 * Linux pool — command-line reasoning. Command-output quests are executed in
 * a throwaway sandbox directory at generation time; conceptual quests cover
 * permissions, processes and shell semantics.
 */

export const linuxTemplates: QuestTemplate[] = [
  shellChallenge({
    id: 'linux.wc-newline-truth',
    category: 'linux',
    challengeType: 'linux',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['wc', 'text processing'],
    tags: ['pipes', 'text'],
    skills: ['Coreutils precision'],
    subcategories: ['text-processing'],
    title: 'The Line Count That Lies',
    subtitle: 'wc -l counts newlines, not lines.',
    description: 'A text file, a wc -l, and an off-by-one that surprises almost everyone.',
    files: {
      'notes.txt': 'alpha\nbeta\ngamma\ndelta',
    },
    command: 'cat notes.txt | wc -l',
    question:
      'The file notes.txt visibly contains four lines. What does the command print, and why?',
    expectedOutput: '3',
    explanation: [
      'wc -l counts NEWLINE CHARACTERS, not visual lines.',
      'The fixture’s last line ("delta") has no trailing newline, so only 3 newline characters exist.',
      'The fix is upstream: ensure files end with a newline (editors and linters enforce this for exactly this reason), or count with awk "END{NR}" which counts records.',
    ],
    mistakes: [
      'Counting the lines in your editor and expecting wc to agree.',
      'Blaming cat or the pipe — the counting rule belongs to wc alone.',
    ],
    hints: ['What byte does wc -l actually count?', 'Does the file end with a newline character?'],
    objectives: ['Know wc -l’s precise semantics', 'Trace text-processing output to bytes'],
  }),

  shellChallenge({
    id: 'linux.grep-count-errors',
    category: 'linux',
    challengeType: 'linux',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['grep'],
    tags: ['grep', 'logs'],
    skills: ['Log triage'],
    subcategories: ['text-processing'],
    title: 'The Error Tally',
    subtitle: 'Count, don’t dump.',
    description: 'Count ERROR occurrences in a log with a single flag.',
    files: {
      'app.log': [
        '2026-01-01 09:00 INFO service started',
        '2026-01-01 09:05 ERROR disk full on /var',
        '2026-01-01 09:06 INFO retrying write',
        '2026-01-01 09:07 ERROR disk full on /var',
        '2026-01-01 09:08 INFO cleanup done',
        '2026-01-01 09:09 ERROR disk full on /var',
        '2026-01-01 09:10 INFO monitoring resumed',
      ].join('\n'),
    },
    command: "grep -c 'ERROR' app.log",
    question: 'What does the command print?',
    expectedOutput: '3',
    explanation: [
      'grep -c prints the NUMBER OF MATCHING LINES, not the matching lines themselves.',
      'Three lines contain the substring ERROR; the INFO lines do not.',
      'Without -c you would pipe to wc -l for the same count — -c is the direct route.',
    ],
    mistakes: [
      'Confusing grep -c (count lines) with grep -o (each match on its own line).',
      'Using grep -v ERROR and counting — that gives the complement.',
    ],
    hints: [
      '-c changes the OUTPUT, not the matching.',
      'Count the ERROR lines in the fixture by hand first.',
    ],
    objectives: ['Use grep -c for counts', 'Distinguish -c from -o and -v'],
  }),

  shellChallenge({
    id: 'linux.sort-uniq',
    category: 'linux',
    challengeType: 'linux',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['sort', 'uniq'],
    tags: ['pipes', 'text'],
    skills: ['Pipeline composition'],
    subcategories: ['text-processing'],
    title: 'The Deduplicated Roster',
    subtitle: 'sort -u in one step.',
    description: 'A word list needs deduplication — predict the exact output.',
    files: {
      'words.txt': 'banana\napple\ncherry\napple\nbanana',
    },
    command: 'sort -u words.txt',
    question: 'What does the command print?',
    expectedOutput: 'apple\nbanana\ncherry',
    explanation: [
      'sort -u sorts and drops duplicates in one pass (equivalent to sort | uniq here).',
      'Lexicographic order puts apple before banana before cherry.',
      'uniq ALONE would not work: it only collapses ADJACENT duplicates, and the input is unsorted.',
    ],
    mistakes: [
      'Running uniq without sort — "apple\ncherry\napple\nbanana" would keep both apples.',
      'Forgetting that sort -u preserves only the first occurrence of each key.',
    ],
    hints: ['Why does uniq require sorted input?', 'What is the one-letter shortcut for "unique"?'],
    objectives: ['Compose sort and uniq correctly', 'Explain uniq’s adjacency requirement'],
  }),

  shellChallenge({
    id: 'linux.find-by-name',
    category: 'linux',
    challengeType: 'linux',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['find', 'globbing'],
    tags: ['find', 'filesystem'],
    skills: ['Filesystem search'],
    subcategories: ['filesystem'],
    title: 'The Log Hunt',
    subtitle: 'find walks the whole tree.',
    description: 'Find every .log file under a directory tree, including subdirectories.',
    files: {
      'a.log': '',
      'b.log': '',
      'c.txt': '',
      'nested/c.log': '',
      'nested/deep/d.log': '',
    },
    command: "find . -name '*.log' | sort",
    question:
      'The directory contains a.log, b.log, c.txt, nested/c.log and nested/deep/d.log. What does the command print? (The pipe to sort makes the order deterministic.)',
    expectedOutput: './a.log\n./b.log\n./nested/c.log\n./nested/deep/d.log',
    explanation: [
      'find . walks every entry under "." recursively — including nested and nested/deep.',
      "-name '*.log' matches files whose basename ends in .log; quoting prevents the SHELL from expanding the glob before find sees it.",
      'c.txt never matches; the sort normalizes find’s directory-walk order into lexicographic order.',
    ],
    mistakes: [
      'Leaving *.log unquoted: the shell expands it against the CURRENT directory before find runs.',
      'Expecting find to skip directories — it does not, unless you add -type f or -maxdepth.',
    ],
    hints: [
      'Does find descend into subdirectories by default?',
      'Who expands an unquoted * — find or the shell?',
    ],
    objectives: ['Search trees with find', 'Quote globs for tools that do their own matching'],
  }),

  quizChallenge({
    id: 'linux.chmod-numeric',
    category: 'linux',
    challengeType: 'linux',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['permissions', 'chmod'],
    tags: ['permissions'],
    skills: ['Permission arithmetic'],
    subcategories: ['permissions'],
    title: 'The Octal Ladder',
    subtitle: 'What exactly does 754 allow?',
    description: 'Decode an octal chmod and its rwx bits.',
    question: 'After `chmod 754 script.sh`, who can do what?',
    options: [
      'Owner: read+write+execute; group: read+execute; others: read only',
      'Owner: read+write; group: read+execute; others: read+execute',
      'Owner: all; group: all; others: none',
      'Owner: read+execute; group: write; others: read only',
    ],
    optionExplanations: [
      'Correct: 7 = rwx (4+2+1) for the owner, 5 = r-x (4+1) for the group, 4 = r-- for others.',
      '6 would be rw-, not 7; the first digit is 7, granting execute to the owner.',
      'That would be 777; 754 is deliberately asymmetric.',
      'The digits map owner, group, others in that order — 7 belongs to the owner.',
    ],
    reasoning: [
      'Each digit sums read(4), write(2), execute(1).',
      '7=4+2+1, 5=4+0+1, 4=4+0+0.',
      'A runnable script needs x for whoever executes it — which is why 754 lets the group run it.',
    ],
    hints: [
      'Write each digit in binary: 7=111, 5=101, 4=100.',
      'Which sum gives execute without write?',
    ],
    objectives: ['Decode octal permissions', 'Map rwx bits to numbers'],
  }),

  quizChallenge({
    id: 'linux.sigterm-vs-sigkill',
    category: 'linux',
    challengeType: 'linux',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['processes', 'signals'],
    tags: ['processes', 'signals'],
    skills: ['Process lifecycle'],
    subcategories: ['processes'],
    title: 'The Graceful Shutdown',
    subtitle: 'SIGKILL cannot be caught — that is the problem.',
    description: 'Why kill -9 is the last resort, not the default.',
    question:
      'A service must flush buffers and close connections before exiting. Why is `kill -9` the wrong first choice?',
    options: [
      'SIGKILL cannot be caught or handled, so the process gets no chance to clean up; SIGTERM is the graceful request',
      'SIGKILL is slower because it waits for the kernel',
      'kill -9 requires root privileges in all cases',
      'SIGTERM does not work on background processes',
    ],
    optionExplanations: [
      'Correct: SIGTERM is the polite "please shut down" signal that handlers can intercept; SIGKILL is enforced by the kernel with no delivery to the process.',
      'SIGKILL is immediate — the opposite of slow.',
      'You can kill -9 your own processes; root is only needed for other users’ processes.',
      'Background processes receive SIGTERM like any other signal.',
    ],
    reasoning: [
      'Termination order: SIGTERM → wait → SIGKILL as enforcement when a process ignores termination.',
      'SIGKILL leaves lock files, unwritten buffers, half-closed sockets — the classic post-mortem mess.',
      'Systemd and container runtimes send SIGTERM first for exactly this reason.',
    ],
    hints: [
      'Which signal can a process register a handler for?',
      'What happens to in-flight writes under SIGKILL?',
    ],
    objectives: ['Order the shutdown signal sequence', 'Explain uncatchable signals'],
  }),

  openChallenge({
    id: 'linux.shell-quoting',
    category: 'linux',
    challengeType: 'linux',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['quoting', 'expansion'],
    tags: ['shell'],
    skills: ['Expansion rules'],
    subcategories: ['shell'],
    title: 'The Three Kinds of Silence',
    subtitle: 'Double, single, and no quotes at all.',
    description: 'Predict expansion differences between quoting styles.',
    question:
      'Given `NAME="world"` in an interactive shell, explain precisely what each of these prints and why: `echo "Hello $NAME"`, `echo \'Hello $NAME\'`, and `echo Hello $NAME` (unquoted). Then state the rule that separates variable expansion from word splitting and globbing.',
    guidance: [
      'Give the exact output of each command.',
      'Explain which expansions single quotes suppress.',
      'State the word-splitting and globbing consequences of going unquoted.',
    ],
    solution: {
      summary:
        'Double quotes expand $NAME → "Hello world". Single quotes suppress ALL expansion → literally "Hello $NAME". Unquoted also expands, BUT the shell then word-splits and globs the result: a variable containing spaces or * would explode into multiple arguments. Rule: double quotes expand variables yet freeze splitting/globbing; single quotes freeze everything; unquoted exposes values to all expansions.',
      reasoning: [
        'Expansion order: parameter expansion happens inside double quotes; single quotes disable it entirely.',
        'Word splitting and pathname expansion never occur inside quotes — that is why "$VAR" is the safe default.',
        'Unquoted "$NAME" with value "* files" would become TWO arguments, and "*" would glob the directory.',
      ],
      commonMistakes: [
        'Thinking single quotes are a "stronger double quote" — they are a different mechanism (literal).',
        'Forgetting that unquoted empty variables disappear entirely from the argument list.',
      ],
    },
    hints: [
      'Which quote type is purely literal?',
      'What does an unquoted $NAME containing spaces do to the argument count?',
    ],
    objectives: ['Predict quoting behaviour exactly', 'Apply the "$VAR" safe-default habit'],
  }),
];
