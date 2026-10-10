import { gitChallenge, openChallenge, quizChallenge, type QuestTemplate } from './framework.js';

/**
 * Git pool — history interpretation and recovery. State-verification quests
 * run a real command sequence in a throwaway repository at generation time;
 * conceptual quests cover the mental model.
 */

export const gitTemplates: QuestTemplate[] = [
  gitChallenge({
    id: 'git.reset-mixed',
    category: 'git',
    challengeType: 'git',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['reset modes', 'staging area'],
    tags: ['reset'],
    skills: ['Reset semantics'],
    subcategories: ['history'],
    title: 'The Unwound Commit',
    subtitle: 'reset --mixed: history yes, files no.',
    description: 'Predict the exact state after git reset --mixed HEAD~1.',
    scenario:
      'A repository has two commits: "first" adds f.txt containing `one`, "second" appends `two` to it. The developer then runs `git reset --mixed HEAD~1`.',
    commands: [
      'echo one > f.txt',
      'git add .',
      'git commit -m "first"',
      'echo two >> f.txt',
      'git add .',
      'git commit -m "second"',
      'git reset --mixed HEAD~1',
    ],
    question:
      'After the reset: how many commits are on main, what does the log’s subject list look like, and what does f.txt contain in the working tree?',
    expect: {
      logSubjects: ['first'],
      revCount: 1,
      fileContents: { 'f.txt': 'one\ntwo' },
    },
    explanation: [
      '--mixed moves the BRANCH pointer back one commit and resets the index, but leaves the working tree untouched.',
      'Result: one commit ("first"), the "second" change is unstaged, and f.txt still contains both lines on disk.',
      '--soft would keep the change STAGED; --hard would discard it from the working tree as well.',
    ],
    mistakes: [
      'Believing reset deletes your file changes — only --hard touches the working tree.',
      'Confusing what happens to the index: --mixed unstages, --soft does not.',
    ],
    hints: [
      'The three reset modes differ in how many of the three trees (HEAD, index, worktree) they rewind.',
      'Which mode is the default?',
    ],
    objectives: ['Differentiate soft, mixed and hard resets', 'Reason in the three-trees model'],
  }),

  gitChallenge({
    id: 'git.revert-commit',
    category: 'git',
    challengeType: 'git',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['revert', 'history preservation'],
    tags: ['revert'],
    skills: ['Revert semantics'],
    subcategories: ['history'],
    title: 'The Polished Undo',
    subtitle: 'revert adds history instead of rewriting it.',
    description: 'Predict repository state after reverting the latest commit.',
    scenario:
      'Same setup as before: "first" adds f.txt with `one`, "second" appends `two`. This time the developer runs `git revert HEAD` (accepting the default commit message).',
    commands: [
      'echo one > f.txt',
      'git add .',
      'git commit -m "first"',
      'echo two >> f.txt',
      'git add .',
      'git commit -m "second"',
      'git revert --no-edit HEAD',
    ],
    question:
      'After the revert: what is the commit count, the log subject list (newest first), and the content of f.txt?',
    expect: {
      logSubjects: ['Revert "second"', 'second', 'first'],
      revCount: 3,
      fileContents: { 'f.txt': 'one' },
    },
    explanation: [
      'revert creates a NEW commit whose diff is the inverse of the target — history grows, nothing is rewritten.',
      'The log now shows Revert "second", second, first (newest first) — three commits.',
      'f.txt is back to `one` in the working tree, because the inverse diff removes the appended line.',
      'This is the safe undo for SHARED branches: teammates who already pulled see an ordinary new commit.',
    ],
    mistakes: [
      'Expecting the log to shrink — revert never removes commits.',
      'Using revert to undo a merge without -m 1, which fails on purpose.',
    ],
    hints: [
      'Count the commits after an inverse patch is committed.',
      'What does the default revert message look like?',
    ],
    objectives: ['Choose revert for shared history', 'Predict inverse-patch results'],
  }),

  gitChallenge({
    id: 'git.cherry-pick',
    category: 'git',
    challengeType: 'git',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['cherry-pick', 'branches'],
    tags: ['cherry-pick'],
    skills: ['Commit grafting'],
    subcategories: ['history'],
    title: 'The Borrowed Commit',
    subtitle: 'Steal one commit across branches.',
    description: 'Cherry-pick a feature commit onto main and predict the resulting state.',
    scenario:
      'On main: commit "first" adds f.txt with `one`. A branch `feature` is created there, commits "feature work" (adds g.txt with `two`). Back on main, "main work" adds h.txt with `three`. Finally, main runs `git cherry-pick feature`.',
    commands: [
      'echo one > f.txt',
      'git add .',
      'git commit -m "first"',
      'git checkout -b feature',
      'echo two > g.txt',
      'git add .',
      'git commit -m "feature work"',
      'git checkout main',
      'echo three > h.txt',
      'git add .',
      'git commit -m "main work"',
      'git cherry-pick feature',
    ],
    question:
      'On main, after the cherry-pick: how many commits, which subjects does the log list (newest first), and which files exist with what content?',
    expect: {
      logSubjects: ['feature work', 'main work', 'first'],
      revCount: 3,
      fileContents: { 'f.txt': 'one', 'g.txt': 'two', 'h.txt': 'three' },
    },
    explanation: [
      'cherry-pick copies the DIFF of the feature commit and applies it on main as a new commit — same message, new hash.',
      'The log order (newest first) is: feature work (the graft), main work, first.',
      'All three files exist: f.txt and h.txt from the parallel histories, g.txt delivered by the cherry-pick.',
      'The feature branch still exists and still has its own copy — cherry-pick duplicates, it does not move.',
    ],
    mistakes: [
      'Expecting the commit HASH to survive — a new parent means a new hash.',
      'Assuming g.txt arrives only if the branch is merged — cherry-pick carries the diff alone.',
    ],
    hints: [
      'Cherry-pick is apply-by-commit: same change, new identity.',
      'Which files did main have before the pick?',
    ],
    objectives: ['Explain what cherry-pick copies', 'Predict merged-free integration results'],
  }),

  quizChallenge({
    id: 'git.detached-head',
    category: 'git',
    challengeType: 'git',
    difficulty: 'intermediate',
    minutes: 12,
    concepts: ['detached HEAD'],
    tags: ['checkout'],
    skills: ['HEAD semantics'],
    subcategories: ['state'],
    title: 'The Detached Tourist',
    subtitle: 'Commits made with no branch to hold them.',
    description: 'What actually happens when you commit in detached HEAD state?',
    question:
      'You check out an old commit by hash, make a change, and commit. Git says "You are in detached HEAD state". Where does that commit live, and what are the two standard ways to keep it?',
    options: [
      'It exists but no branch points to it — it will be garbage-collected eventually; rescue it with `git branch rescue-branch` or `git checkout -b rescue-branch`',
      'It is automatically committed to the current branch once you check one out',
      'It is stored on a special HEAD branch permanently',
      'Git deletes it immediately because detached commits are invalid',
    ],
    optionExplanations: [
      'Correct: HEAD points at the commit directly; without a branch ref, the commit is reachable only via HEAD/reflog until GC prunes it.',
      'Checking out a branch later does not retroactively attach orphaned commits.',
      'HEAD is a pointer, not a branch that stores anything.',
      'The commit is perfectly valid — only unreferenced.',
    ],
    reasoning: [
      'Branches are just refs that hold commits; detached HEAD simply skips the ref layer.',
      'The reflog keeps the commit reachable for the default retention window (~30 days for unreachable objects).',
      'Naming it with a branch (or tagging) makes the reachability permanent.',
    ],
    hints: [
      'What does a branch actually contain?',
      'What keeps unreferenced objects alive for a while?',
    ],
    objectives: [
      'Explain reachability and reflog rescue',
      'Recover detached-HEAD work deliberately',
    ],
  }),

  quizChallenge({
    id: 'git.rebase-vs-merge-shape',
    category: 'git',
    challengeType: 'git',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['rebase', 'merge'],
    tags: ['rebase', 'merge'],
    skills: ['History topology'],
    subcategories: ['history'],
    title: 'The Linear Preference',
    subtitle: 'Two integrations, two histories.',
    description: 'How rebase and merge differ in the resulting graph — and in safety.',
    question:
      'Which statement about `git merge feature` versus `git rebase main` (run on feature) is correct?',
    options: [
      'Merge creates a merge commit joining both lines of history; rebase replays feature’s commits as new commits on top of main, producing a linear history',
      'Both produce identical graphs; only the messages differ',
      'Rebase rewrites main’s commits; merge rewrites feature’s',
      'Rebase is always safe because it never changes commit hashes',
    ],
    optionExplanations: [
      'Correct: merge preserves both timelines plus a merge commit; rebase replays your commits onto the new base — new hashes, linear log.',
      'The topologies differ fundamentally: one has a diamond, one is a straight line.',
      'Backwards: rebase (run on feature) rewrites FEATURE’s commits; merge rewrites nothing.',
      'Rebasing changes hashes precisely because parents change — that is why rebasing SHARED branches is forbidden by convention.',
    ],
    reasoning: [
      'A commit’s hash covers its content, parents, message and timestamps — any parent change cascades.',
      'The golden rule: never rebase branches others may have based work on.',
      'Merge commits are honest about integration points; linear history is easier to bisect and revert.',
    ],
    hints: [
      'What ingredients feed the commit hash?',
      'Which operation is safe to do on a branch only you have pulled?',
    ],
    objectives: ['Contrast merge and rebase topologies', 'Apply the golden rule of rebasing'],
  }),

  openChallenge({
    id: 'git.reflog-rescue',
    category: 'git',
    challengeType: 'git',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['reflog', 'recovery'],
    tags: ['reflog', 'recovery'],
    skills: ['Disaster recovery'],
    subcategories: ['state'],
    title: 'The morning after reset --hard',
    subtitle: 'Nothing is truly gone (for a while).',
    description: 'Recover work destroyed by a hard reset using the reflog.',
    question:
      'Yesterday you committed a day’s work ("feat: critical module"). This morning you ran `git reset --hard HEAD~3` and the commit is gone from the log and from `git status`. Walk through the exact recovery: which commands reveal the lost commit, how you restore it, and what eventually destroys it for good.',
    guidance: [
      'Name the command that lists where HEAD has been.',
      'Give the exact recovery sequence (identify → branch or reset).',
      'State the retention rules and what really deletes unreachable commits.',
    ],
    solution: {
      summary:
        'git reflog lists every HEAD movement with short hashes; find the lost commit’s entry, then `git branch rescue <hash>` (or checkout -b / reset --hard <hash>) to make it reachable again. Unreachable commits survive until git gc prunes them — typically ~30 days for unreachable objects via the default reflog retention, but pushing a fresh ref and pruning shortens that. The reflog itself is local: it does not save you on a fresh clone.',
      reasoning: [
        'reset --hard moves the branch pointer; the old commits become unreachable but remain on disk.',
        'reflog entries record HEAD at every step, including before the reset.',
        'Creating a branch at the lost hash restores reachability instantly.',
        'Recovery works because reflog is repo-local history of YOUR head movements — clones and collaborators never see it.',
      ],
      commonMistakes: [
        'Looking for the commit in git log — log shows reachable history only.',
        'Running gc --prune=now in panic, which actually destroys the evidence.',
      ],
    },
    hints: [
      'Which log does git log NOT show?',
      'What is the default expiry for unreachable objects?',
    ],
    objectives: ['Recover hard-reset work via reflog', 'Understand reachability and GC'],
  }),

  quizChallenge({
    id: 'git.stash-mechanics',
    category: 'git',
    challengeType: 'git',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['stash'],
    tags: ['stash'],
    skills: ['Work-in-progress management'],
    subcategories: ['state'],
    title: 'The Pocket for Half-Work',
    subtitle: 'Stash, pop, apply — and where they differ.',
    description: 'Stash mechanics: what is stored and what pop versus apply means.',
    question: 'Which statement about `git stash` is correct?',
    options: [
      'stash saves tracked changes to a stack; pop restores the latest and drops it, while apply restores but keeps the entry',
      'stash permanently deletes changes after 24 hours',
      'stash only works on committed changes',
      'stash apply automatically deletes the stash entry',
    ],
    optionExplanations: [
      'Correct: the stash is a stack of commits; pop = apply + drop, apply = apply only.',
      'Stash entries persist until dropped or expired by configuration — no 24-hour rule.',
      'Stash exists precisely for UNCOMMITTED tracked changes (staged included with -k nuance).',
      'That is pop; apply deliberately keeps the entry for reuse.',
    ],
    reasoning: [
      'Stash stores both the working tree and index state (by default merging staged/unstaged back as unstaged; git stash pop --index restores stagedness).',
      'Untracked files need -u to be included.',
      'stash list, stash show, and named drops (stash drop stash@{1}) manage the stack.',
    ],
    hints: [
      'What is the difference between pop and apply by definition?',
      'Are untracked files included by default?',
    ],
    objectives: ['Use the stash stack safely', 'Distinguish pop from apply'],
  }),
];
