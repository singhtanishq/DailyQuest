# Architecture

DailyQuest has two cooperating subsystems: a **content pipeline** (Node/TypeScript, runs in
CI or locally) and a **static frontend** (React, runs in the browser). They share one
canonical dataset committed to the repository, and one shared type definition of that
dataset.

```
┌────────────────────────────────────────────────────────────┐
│                     CONTENT PIPELINE                       │
│                                                            │
│  GitHub Actions (or your laptop)                           │
│        │                                                   │
│        ▼                                                   │
│  Date Resolver                                             │
│   getTodayInTz(publicationTimezone)                        │
│        │                                                   │
│        ▼                                                   │
│  Catch-up Planner                                          │
│   lastPublished → missing dates (≤ maxCatchupDays)         │
│        │                                                   │
│        ▼                                                   │
│  Deterministic Generator                                   │
│   seed = SHA-256("DailyQuest:" + date + ":generator-v1")   │
│   Rng(seed) → category → template → difficulty → body      │
│        │                                                   │
│        ▼                                                   │
│  Verification runners (sandboxed)                          │
│   JS vm · SQLite · RegExp · bash · git                     │
│        │                                                   │
│        ▼                                                   │
│  Validators                                                │
│   structure · quality score · duplicate fingerprints       │
│        │                                                   │
│        ▼                                                   │
│  Quest Archive  data/quests/YYYY/MM/YYYY-MM-DD.json        │
│        │                                                   │
│        ▼                                                   │
│  Derived rebuild (deterministic, atomic)                   │
│   index.json · stats.json · categories.json                │
│   latest.json · health.json · README status block          │
└────────────────────────────────────────────────────────────┘
                         │
                         ▼  one commit, one push
┌────────────────────────────────────────────────────────────┐
│                       FRONTEND                             │
│                                                            │
│  Vite + React + TypeScript                                 │
│   pages: today · quest · archive · categories · stats      │
│          random · about · 404                              │
│        │                                                   │
│        ▼                                                   │
│  Data service (src/data/api.ts)                            │
│   fetch /data/*.json relative to BASE_URL                  │
│   in-memory index cache · no-cache for latest.json         │
│        │                                                   │
│        ▼                                                   │
│  GitHub Pages (static hosting)                             │
│   SPA fallback via 404.html path-rescue trick              │
└────────────────────────────────────────────────────────────┘
```

## Source vs. generated

| Layer | Status |
| --- | --- |
| `scripts/` (generator), `src/` (frontend), `shared/`, `config/` | human-maintained |
| `data/quests/**` | generated once, then immutable |
| `data/index.json`, `stats.json`, `categories.json`, `latest.json`, `health.json` | derived, deterministic full rebuilds |
| `reports/daily/**` | generated per publish |
| `dist/` | build artifact, never committed |

The derived rebuild is the only writer of derived files. It compares content (ignoring
`generatedAt`) against what is on disk and writes atomically only when something actually
changed — which is what makes a no-op daily run leave the working tree untouched.

## Data model

The canonical quest object is defined once in `shared/types.ts` and consumed by both sides.
Key design decisions:

- **Identity is date-derived**: `id = dq-YYYY-MM-DD`, `slug = YYYY-MM-DD-title-slug`. No
  random UUIDs, so links are stable and regeneration is reproducible.
- **`sequenceNumber` follows date order** and is re-derived on rebuild (a mid-archive
  backfill renumbers successors — a metadata-only update).
- **Content hash** covers semantic content only (template id + parameter signature + title
  + prompt + solution summary), normalized whitespace. It drives duplicate detection, not
  identity.
- **Fingerprints** (`fpc`/`fpt`/`fpp` — 16-hex hashes of content/title/prompt) live in the
  compact index so duplicate checks never need to load full quest files.
- **Navigation** (previous/next) is *not* stored on quests; the frontend derives it from
  the index, so adding a quest never rewrites its neighbors.
- **`relatedQuestIds`** is the only relational field stored on a quest (same category,
  nearest dates, captured at generation time).

## Frontend architecture

- `src/data/api.ts` is the single access point for generated JSON: typed errors
  (`DataError`), an in-memory index cache, and `no-cache` semantics for `latest.json` so a
  new day appears without a hard reload.
- `useAsync` provides loading/error/data state; route-level error boundaries turn failures
  into friendly recovery screens instead of white pages.
- Routes are lazy-loaded; vendor chunks (React, highlight.js, Fuse) are split explicitly.
  Initial payload is ≈100 KB gzipped.
- Quest prose is rendered by `MarkdownLite`, a structural renderer for the generator's
  known markdown subset — no `dangerouslySetInnerHTML` anywhere, so quest content cannot
  inject markup.
- GitHub Pages serves the SPA through the `404.html` path-rescue: unknown paths are
  translated to client routes and replayed via `history.replaceState` after redirect, with
  the base path detected from the first known route segment.

## Pages deployment model

- `daily-quest.yml` pushes with the owner's PAT → deploy job uploads `dist/` →
  `deploy-pages` publishes.
- `deploy.yml` covers non-daily pushes to `main` and skips commits starting with
  `feat(daily):` to avoid double deploys. Both share the `github-pages` concurrency group.
- Build failures never reach deployment: the build (which itself runs full data validation)
  precedes artifact upload in every workflow.
