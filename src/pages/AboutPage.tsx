import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { getHealth } from '../data/api.js';
import { useAsync } from '../hooks/useAppState.js';

export function AboutPage() {
  useEffect(() => {
    document.title = 'About — DailyQuest';
  }, []);

  const health = useAsync(getHealth, []);
  const templateCount = health.data?.templateCount ?? 0;

  return (
    <div className="container page page-narrow prose">
      <h1 style={{ fontSize: 'var(--text-3xl)' }}>About DailyQuest</h1>

      <p>
        DailyQuest publishes <strong>one technical challenge every day</strong> — coding, debugging,
        output prediction, SQL, regex, security, networking, system design and more. The archive
        grows indefinitely: every date receives its own quest, and the site is a window onto that
        archive.
      </p>

      <h2>Why it exists</h2>
      <p>
        Because a daily ritual beats a weekend binge. Ten focused minutes on one precise problem —
        with hints, a worked solution and the reasoning behind it — compounds faster than
        tutorials. The daily cadence also keeps the archive honest: it grows in public, one commit
        at a time.
      </p>

      <h2>How quests are generated</h2>
      <p>
        There is no AI in the loop and no paid API. A deterministic engine picks a category
        (weighted), a difficulty (balanced), and a template from a curated pool of{' '}
        {templateCount} hand-written challenges. Parameters are derived from a seed computed as{' '}
        <code>SHA-256("DailyQuest:" + date + ":generator-v1")</code> — so the same date always
        produces the same quest, and the whole archive is reproducible from its dates.
      </p>
      <p>
        Crucially, the engine does not just write plausible answers: it <strong>computes</strong>{' '}
        them. Coding quests carry reference implementations whose test outputs are executed at
        generation time. Output-prediction snippets are run in a sandbox. SQL quests are checked
        against a real SQLite fixture. Regex patterns are executed against match and non-match
        samples. Git and Linux scenarios run in throwaway sandboxes. If a claim cannot be verified,
        the quest is not published.
      </p>

      <h2>How the repository grows</h2>
      <p>
        The archive is the repository: <code>data/quests/YYYY/MM/YYYY-MM-DD.json</code> holds each
        quest as structured, human-readable JSON. A GitHub Actions workflow runs once a day,
        generates the missing quest, validates the whole archive, rebuilds the index and statistics,
        and commits the result. The daily commit is a real artifact — a new challenge plus its
        metadata — not a heartbeat.
      </p>
      <p>
        This project is not streak farming. The daily activity exists because the product itself
        publishes something every day; the GitHub history is simply the audit log of that
        publishing.
      </p>

      <h2>Running it locally</h2>
      <ul>
        <li>
          <code>npm install</code> — install dependencies
        </li>
        <li>
          <code>npm run dev</code> — start the dev server
        </li>
        <li>
          <code>npm run generate:daily -- --dry-run</code> — preview today's quest without writing
        </li>
        <li>
          <code>npm run generate:date -- 2026-10-07</code> — generate a specific date
        </li>
        <li>
          <code>npm run validate</code> — validate the whole archive
        </li>
        <li>
          <code>npm test</code> — run the test suite
        </li>
      </ul>

      <h2>Contributing</h2>
      <p>
        The most valuable contributions are new challenge templates and corrections. Templates live
        in <code>scripts/daily/templates/</code> and are plain TypeScript objects; adding one is a
        matter of following the existing factory patterns. See{' '}
        <a href="https://github.com/singhtanishq/DailyQuest/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a>{' '}
        for the details, and{' '}
        <a href="https://github.com/singhtanishq/DailyQuest/blob/main/docs/GENERATOR.md">
          docs/GENERATOR.md
        </a>{' '}
        for how the engine works.
      </p>

      <p style={{ marginTop: 'var(--space-6)' }}>
        <Link to="/archive" className="btn btn-primary">
          Browse the archive
        </Link>
      </p>
    </div>
  );
}
