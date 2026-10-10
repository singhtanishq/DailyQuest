# Contributing to DailyQuest

Thank you for wanting to improve the quest archive. The highest-value contributions are:

1. **New quest templates** (the content pool)
2. **Corrections** to published quests or generator logic
3. **Frontend improvements**

## Running locally

```bash
npm install        # Node 22.12+
npm run dev        # frontend dev server
npm test           # unit + integration tests
npm run validate   # consistency check over data/
npm run build      # the full production pipeline
```

No secrets are ever needed for local work. Local generation writes to `data/` and
`reports/` — that is expected and safe.

## Adding a quest template

Templates are plain TypeScript objects built with the factories in
`scripts/daily/templates/framework.ts`. The quickest path:

1. Pick the pool file matching the category (e.g. `templates/coding.ts`).
2. Copy a neighboring template and adapt it. Key fields:
   - `id` — globally unique, format `category.short-name`.
   - `title` — distinctive; titles are duplicate-checked across the archive.
   - For executable types: the reference implementation (`run`), tests, fixtures or
     samples. The pipeline executes them; a disagreement with your prose aborts the quest.
3. Check your work:

```bash
npm run generate:date -- 2099-01-01 --dry-run  # preview without writing
npm run validate
npm test
```

Read [docs/GENERATOR.md](docs/GENERATOR.md) for the full template contract — in
particular: no placeholders, no TODOs, hints must escalate (direction → strategy →
near-solution), and cybersecurity content must stay strictly defensive.

## Correcting published quests

Published quests are immutable by design. If a quest is wrong, open an issue with the
quest date and the specific claim; fixes are applied through the generator/template layer
with an explicit `corrected` status, never by silently rewriting history.

## Pull requests

- One logical change per PR.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run validate` and `npm run build`
  must pass — CI runs exactly these.
- If your change affects generated data, commit the regenerated files as part of the PR.
- Screenshots/GIFs for visual changes.

## Code style

Prettier and ESLint are enforced (`npm run format`, `npm run lint`). Keep comments for
constraints the code cannot express — the generator's docs live in `docs/`, not in
repeated inline narration.

## Reporting issues

- **Quest quality issue** — include the quest date and what is wrong.
- **Generator bug** — include the failing date and the error output.
- **Site bug** — browser, route, and what you expected.

Thanks for helping the archive grow well.
