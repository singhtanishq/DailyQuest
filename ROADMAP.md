# Roadmap

Deliberately ordered from "likely next" to "someday, if it earns its complexity".

## Content

- [ ] Grow the template pool toward richer coverage per category (the engine supports
      arbitrary pool sizes; the rotation window already adapts).
- [ ] Parameterized template variants (same skeleton, different data instances) for
      algebraic categories like regex and SQL.
- [ ] Executable Python output-prediction quests (requires a sandboxed Python runner
      decision for CI).

## Product

- [ ] Per-quest "attempt notes" stored locally (`localStorage`), still privacy-friendly.
- [ ] Calendar view of the archive.
- [ ] RSS/Atom feed generated at build time.
- [ ] PWA shell (offline access to recent quests) — only with a correctly versioned
      service worker; skipped for launch to avoid stale-cache bugs.

## Platform

- [ ] Optional AI-assisted **candidate** generation behind the existing provider
      interface (`ContentProvider`), always passing the same verification + validation
      gates. The deterministic provider remains the default and the fallback.
- [ ] A pre-generated compact search index file when the archive grows past a few
      thousand quests (Fuse currently runs over the compact index, which is fine for
      years).
- [ ] i18n of the UI (content stays English initially).

## Explicitly not planned

- User accounts, leaderboards, achievements — no backend by design.
- Analytics or any third-party tracking.
- Automated social posting.

Ideas welcome via issues — especially for templates.
