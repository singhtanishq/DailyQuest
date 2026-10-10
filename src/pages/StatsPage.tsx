import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { getStats } from '../data/api.js';
import { useAsync } from '../hooks/useAppState.js';
import { ErrorState } from '../components/ui/States.js';
import { categoryLabel, difficultyLabel } from '../lib/labels.js';
import { formatDisplayDate, totalHours } from '../lib/format.js';
import type { CategoryStat } from '../../shared/types.js';

function BarList({
  rows,
  labelOf,
}: {
  rows: Array<{ key: string; count: number; percent: number }>;
  labelOf: (key: string) => string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="bars">
      {rows.map((row) => (
        <div key={row.key} className="bar-row">
          <span className="bar-label" title={labelOf(row.key)}>
            {labelOf(row.key)}
          </span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
          <span className="bar-value">
            {row.count} <span style={{ color: 'var(--foreground-faint)' }}>({row.percent}%)</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatsPage() {
  const stats = useAsync(getStats, []);

  useEffect(() => {
    document.title = 'Stats — DailyQuest';
  }, []);

  if (stats.error) {
    return <ErrorState title="Statistics could not be loaded" detail={stats.error.message} />;
  }
  if (stats.loading || !stats.data) {
    return (
      <div className="container page" aria-hidden>
        <div className="stats-strip">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: 90 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 260, marginTop: 'var(--space-5)' }} />
      </div>
    );
  }

  const data = stats.data;
  const difficultyRows = Object.entries(data.byDifficulty).map(([key, count]) => ({
    key,
    count,
    percent: data.totalQuests > 0 ? Math.round((count / data.totalQuests) * 100) : 0,
  }));
  const typeRows = Object.entries(data.byType)
    .map(([key, count]) => ({ key, count, percent: Math.round((count / data.totalQuests) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="container page">
      <h1 className="quest-title" style={{ marginTop: 0 }}>
        Archive Statistics
      </h1>
      <p style={{ color: 'var(--foreground-muted)', marginTop: 'var(--space-2)' }}>
        Every number on this page is computed from the canonical quest archive — nothing is tracked
        by hand.
      </p>

      <section className="section" style={{ marginTop: 'var(--space-5)' }}>
        <div className="stats-strip">
          <div className="stat-tile">
            <div className="stat-value">{data.totalQuests}</div>
            <div className="stat-label">Total quests</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{data.currentStreak}</div>
            <div className="stat-label">Current streak</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{data.longestStreak}</div>
            <div className="stat-label">Longest streak</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{data.missedDays}</div>
            <div className="stat-label">Missed days</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{totalHours(data.totalEstimatedMinutes)}</div>
            <div className="stat-label">Practice time</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value">{data.averageEstimatedMinutes}m</div>
            <div className="stat-label">Avg per quest</div>
          </div>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-5)',
          marginTop: 'var(--space-7)',
        }}
      >
        <section>
          <h2 className="section-title">By category</h2>
          <BarList
            rows={data.categoryBreakdown.map((c: CategoryStat) => ({
              key: c.id,
              count: c.count,
              percent: c.percent,
            }))}
            labelOf={categoryLabel}
          />
        </section>

        <section>
          <h2 className="section-title">By difficulty</h2>
          <BarList rows={difficultyRows} labelOf={difficultyLabel} />
        </section>
      </div>

      <section className="section">
        <h2 className="section-title">By challenge type</h2>
        <BarList rows={typeRows} labelOf={(key) => key.replaceAll('_', ' ')} />
      </section>

      <section className="section">
        <h2 className="section-title">Archive coverage</h2>
        <div className="stats-strip">
          <div className="stat-tile">
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>
              {data.oldestQuestDate ? formatDisplayDate(data.oldestQuestDate) : '—'}
            </div>
            <div className="stat-label">First quest</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>
              {data.latestQuestDate ? formatDisplayDate(data.latestQuestDate) : '—'}
            </div>
            <div className="stat-label">Latest quest</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>
              {data.archiveSpanDays}
            </div>
            <div className="stat-label">Days covered</div>
          </div>
          <div className="stat-tile">
            <div className="stat-value" style={{ fontSize: 'var(--text-lg)' }}>
              {data.generatorVersion}
            </div>
            <div className="stat-label">Generator version</div>
          </div>
        </div>
        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--foreground-muted)' }}>
          The streak counts consecutive <em>published</em> calendar days in the archive itself — it
          is a property of DailyQuest, not of any GitHub account.{' '}
          <Link to="/about">How publishing works →</Link>
        </p>
      </section>
    </div>
  );
}
