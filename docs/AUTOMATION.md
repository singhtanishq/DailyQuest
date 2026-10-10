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
  top-of-the-hour congestion GitHub documents for scheduled workflows. Scheduled runs pass
  `--scheduled` to the CLI, so the `publishingEnabled` kill switch in
  `config/dailyquest.config.ts` applies.
- **`workflow_dispatch`** — with optional `target_date` (empty = today in the publication
  timezone) and `dry_run` (generate + validate + build, but no commit/push/deploy).

Workflow inputs never reach shell commands through direct expression interpolation:
`target_date` and `dry_run` flow into step `env:` values, the generation step validates
the date against `^[0-9]{4}-[0-9]{2}-[0-9]{2}$` before use, and the invocation is the real
generator — `npm run generate:daily -- --ci` (the bare `quest` script stays help-only).
The generation step emits job outputs (`publication_date`, `quest_number`, `quest_title`,
`changed`); `changed=false` for both dry runs and no-op reruns, so push and deployment
gates can distinguish a real publication from either.

A single `concurrency: daily-quest` group (no cancellation) guarantees one publisher at a
time: a manual run queues behind a scheduled one instead of racing it.

Steps: configuration check → checkout (with the PAT) → npm ci → generate → validate the
whole archive → tests → build (which itself fails on malformed dist output) → identity
setup → commit → safe push → upload `dist/` artifact → deploy.

### `deploy.yml`

Builds and deploys for pushes to `main` that are **not** the daily commit
(message check: `!startsWith('feat(daily):')`) and for manual dispatch. The daily
workflow deploys its own build immediately, so this prevents double deploys. Both deploy
paths share the `github-pages` concurrency group.

In both workflows `actions/configure-pages` runs inside the deploy job, next to
`actions/deploy-pages` — deliberately not in the publishing job, so a Pages
configuration problem can never block the quest commit and push. The uploaded artifact is
the contents of `dist/` (built `index.html` at the artifact root), never the repository
root; `scripts/build/verify-dist.ts` fails the build before upload if the production HTML
still references the development entry point (`/src/main.tsx`) or ignores the configured
base path.

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
