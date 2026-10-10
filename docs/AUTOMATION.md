# Automation

The three GitHub Actions workflows, how credentials work, and how publishing stays safe.

## Workflows

### `ci.yml`

Runs on every push to `main` and every pull request: `npm ci` → lint → typecheck → tests →
data validation → build. It never commits and has `contents: read` only.

### `daily-quest.yml`

The publisher. Triggers:

- **Schedule** — `cron: '17 0 * * *'` with `timezone: 'Asia/Kolkata'` (GitHub supports
  IANA timezones on `schedule`; Asia/Kolkata has no DST). The off-round minute avoids the
  top-of-the-hour congestion GitHub documents for scheduled workflows.
- **`workflow_dispatch`** — with optional `target_date` (empty = today in the publication
  timezone) and `dry_run` (generate + validate + build, but no commit/push/deploy).

A single `concurrency: daily-quest` group (no cancellation) guarantees one publisher at a
time: a manual run queues behind a scheduled one instead of racing it.

Steps: configuration check → checkout (with the PAT) → npm ci → generate → validate the
whole archive → tests → build → identity setup → commit → safe push → upload artifact →
deploy.

### `deploy.yml`

Builds and deploys for pushes to `main` that are **not** the daily commit
(message check: `!startsWith('feat(daily):')`) and for manual dispatch. The daily
workflow deploys its own build immediately, so this prevents double deploys. Both deploy
paths share the `github-pages` concurrency group.

## Commit attribution

GitHub attributes a contribution when:

1. the commit's **author or committer email** matches an email verified on an account, and
2. the commit is on the default branch of a standalone (non-fork) repository.

DailyQuest therefore splits the two concerns:

| Concern | Mechanism |
| --- | --- |
| Author/committer identity | `git config user.name/user.email` from the `DAILYQUEST_COMMIT_NAME` / `DAILYQUEST_COMMIT_EMAIL` secrets, applied after generation and **before** the commit |
| Push authentication | `actions/checkout`'s `token` input with the `DAILYQUEST_PUSH_TOKEN` fine-grained PAT (`Contents: Read and write`), persisted by the action into the runner's git config for the job only |

The identity step refuses to run with an empty email and rejects generic bot identities
(`github-actions[bot]`, `noreply@github.com`, …). It prints the name in full and the email
**masked** (`j***@example.com`). No token is ever echoed, logged, or placed in a URL —
secret masking by GitHub is a backstop, not the design.

## Push safety

The push step never force-pushes:

1. `git fetch origin main`.
2. If `origin/main` is an ancestor of HEAD → push normally.
3. If history diverged: check whether `origin/main` now already contains
   `data/quests/YYYY/MM/<date>.json`. If it does, someone else published the date — the
   local commit is discarded (`reset --hard origin/main`) and the run ends cleanly.
4. Otherwise `git pull --rebase origin main` (replaying only the one daily commit) and
   push.

Combined with the `daily-quest` concurrency group and the idempotent generator (a rerun
for an existing date is a no-op), duplicate challenges for the same date are structurally
impossible.

## Failure handling

- Generation, verification or validation failures **abort before any commit**; invalid
  content is never published.
- The commit step is skipped when there is nothing to commit (`changed=false`), so reruns
  do not create empty commits.
- Deployment failures surface in the `deploy` job (Pages environment) while the content
  commit remains safe on `main`.
- Every run writes `$GITHUB_STEP_SUMMARY` with a publishing report; per-date JSON reports
  land in `reports/daily/`.

## Setup checklist for the owner

1. Push the repository to GitHub (standalone, not a fork).
2. Settings → Pages → **Build and deployment → Source: GitHub Actions**.
3. Settings → Secrets and variables → Actions → add `DAILYQUEST_COMMIT_NAME`,
   `DAILYQUEST_COMMIT_EMAIL` (a verified email on your account), and
   `DAILYQUEST_PUSH_TOKEN` (fine-grained PAT, Contents: Read and write, this repo only).
4. Run **Daily Quest → Run workflow** once manually and watch the summary.
5. Check: Actions run, commit history, Pages deployment URL, and (after GitHub refreshes)
   the contribution graph.
