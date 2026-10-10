# The Generator

How DailyQuest turns a date into a verified quest.

## Seed derivation

```
seed = SHA-256("DailyQuest:" + YYYY-MM-DD + ":generator-v<major>")
```

The major version of `generatorVersion` is used, so a major generator bump intentionally
changes all future selections while historical seeds remain reconstructible. The seed
feeds `Rng` (`scripts/daily/core/rng.ts`), a counter-based hash RNG: draw *n* is
`SHA-256(seed + ":" + n)`. There is no `Math.random`, no wall-clock input beyond the date
itself, and no hidden state — the entire selection is a pure function of the date.

## Selection pipeline

For each date, in a fixed order (fixed order matters: each draw consumes the RNG):

1. **Category** — weighted pick from `config.categoryWeights`. The category that would
   violate `categoryRepeatLimit` (no three consecutive days) is banned.
2. **Template** — from the category's pool, minus everything used within
   `templateWindow` (14) recent quests, preferring templates whose primary concept was not
   used within `conceptWindow` (7). If the window covers the whole pool, the
   least-recently-used template wins instead of repeating recent work.
3. **Difficulty** — weighted pick over the template's allowed difficulties, using global
   `difficultyWeights` with per-category overrides (e.g. system design never publishes
   beginner).

### Duplicate handling

The assembled quest must not collide with any published quest on content hash, title
fingerprint or prompt fingerprint. On collision the generator rotates (the RNG has already
advanced, so the next attempt is different) for up to `maxDuplicateRetries` attempts,
then fails loudly. Collisions are rare: template ids participate in the content hash.

## Templates

Templates live in `scripts/daily/templates/` as declarative objects built by factories in
`framework.ts`:

| Factory | Challenge shape | Verification |
| --- | --- | --- |
| `codingChallenge` | implementation task, reference `run()`, tests | expected outputs computed by running the reference implementation |
| `predictionChallenge` | "what does this print?" | snippet executed in a Node `vm` sandbox; stored output must match reality |
| `quizChallenge` | multiple choice | correct option validated against explanations; options shuffled deterministically |
| `openChallenge` | conceptual free-form | structural validation |
| `debuggingChallenge` | broken code → root cause → fix | structural validation |
| `reviewChallenge` | flawed snippet → annotated issues | structural validation |
| `sqlChallenge` | fixture + query | result set verified against SQLite (when the `sqlite3` binary exists; otherwise published with a warning and the authored rows) |
| `regexChallenge` | pattern + match/non-match samples | pattern executed against every sample |
| `shellChallenge` | command + fixture files | command run in a throwaway directory; stdout compared |
| `gitChallenge` | command sequence | scenario replayed in a throwaway repository; log subjects, file contents and revision counts asserted |
| `designChallenge` | scoped system design | structural validation |

### Verification runners

All runners (`scripts/daily/verify/runners.ts`) execute **repository-owned content only**
— never user input — inside throwaway sandbox directories with hard timeouts. The JS
sandbox exposes nothing but a capturing `console`. A failed verification aborts
generation: the quest is never written.

## Validation

Every candidate quest passes `validateQuestStructure` (`scripts/daily/validators/schema.ts`):
~40 checks covering identity formats, taxonomy validity, difficulty/complexity ranges,
content substance (prompt length, hints ≤ 3, solution present), option consistency,
placeholder scans (`TODO`, `lorem`, …), secret-pattern scans, and balanced markdown
fences. The pass rate becomes the quest's `validation.score`; below
`config.quality.minQualityScore` (70) the quest is rejected.

## Catch-up and idempotency

- `planCatchUp` computes the missing dates between the last published date and today.
  Gaps ≤ `maxCatchupDays` (7) are backfilled automatically; larger gaps generate only
  today and record a warning (manual `generate:backfill` recovers the rest).
- If a quest file already exists for a date, it is loaded, re-validated, and returned as
  `already-exists` — never regenerated, never overwritten.
- Derived files are full deterministic rebuilds; the rebuild writes only files whose
  content actually changed (ignoring `generatedAt`), so a no-op run produces an empty diff.

## Versioning

`generatorVersion` (semver) is stamped on every quest. Minor/patch bumps must not change
selections for a given date in a way that alters already-published quests — published
quests are immutable; corrections are explicit (see `status: corrected` in the schema and
the repository validator, which flags any quest not marked validated).

## Adding a template

1. Add a factory call to the relevant pool file (e.g. `scripts/daily/templates/coding.ts`).
2. Give it a unique `id` (`category.short-name`) and a distinctive title — titles are
   duplicate-checked.
3. For executable types, provide the reference implementation/fixture; the pipeline will
   refuse to publish if its behavior disagrees with your prose.
4. Run `npm run generate:date -- <some-future-date> --dry-run`-style checks locally:
   generate a couple of dates, run `npm run validate` and `npm test`.
