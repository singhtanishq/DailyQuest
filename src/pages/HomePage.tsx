import { Link } from 'react-router-dom';
import { ArrowRight, Dice5, Github, LibraryBig } from 'lucide-react';

import { getCategories, getIndex, getLatest, getStats } from '../data/api.js';
import { useAsync } from '../hooks/useAppState.js';
import { QuestCard } from '../components/quest/QuestCard.js';
import { MetaStrip } from '../components/quest/QuestCard.js';
import { categoryIcon } from '../lib/labels.js';
import { pluralize, totalHours } from '../lib/format.js';
import { EmptyState, ErrorState, QuestCardSkeletonGrid } from '../components/ui/States.js';

export function HomePage() {
  const latest = useAsync(getLatest, []);
  const index = useAsync(getIndex, []);
  const stats = useAsync(getStats, []);
  const categories = useAsync(getCategories, []);

  if (latest.error) {
    return <ErrorState title="Today's quest could not be loaded" detail={latest.error.message} />;
  }

  const today = latest.data;
  const entries = index.data ?? [];
  const latestDate = today?.date;
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((e) => e.date !== latestDate)
    .slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-kicker">Autonomous daily challenge platform</div>
          <h1>One challenge. Every day.</h1>
          <p className="tagline">
            A new quest is generated, verified and published automatically — coding, debugging, SQL,
            security, systems and more.
          </p>

          {latest.loading ? (
            <div className="today-card" aria-hidden>
              <div className="skeleton" style={{ height: 12, width: 220 }} />
              <div className="skeleton" style={{ height: 32, width: '60%', marginTop: 16 }} />
              <div className="skeleton" style={{ height: 16, width: '80%', marginTop: 12 }} />
              <div className="skeleton" style={{ height: 40, width: 200, marginTop: 20 }} />
            </div>
          ) : today ? (
            <article className="today-card rise">
              <div className="today-heading">
                <MetaStrip entry={today} />
                <span className="badge badge-today">TODAY'S QUEST</span>
              </div>
              <h2 className="today-title">{today.title}</h2>
              <p className="today-desc">{today.description}</p>
              <div className="today-actions">
                <Link to={`/quest/${today.slug}`} className="btn btn-primary">
                  Start Quest <ArrowRight size={16} aria-hidden />
                </Link>
                <Link to="/archive" className="btn btn-secondary">
                  Browse Archive
                </Link>
              </div>
            </article>
          ) : (
            <div className="today-card">
              <EmptyState title="No quest has been published yet">
                The first quest arrives when the daily pipeline runs.
              </EmptyState>
            </div>
          )}
        </div>
      </section>

      <div className="container">
        <section className="section rise-1">
          <h2 className="section-title">How it works</h2>
          <div className="steps">
            <div className="step">
              <h3>A quest is generated</h3>
              <p>
                Every day, a deterministic engine selects a category, difficulty and template from a
                curated pool, then computes the expected answers by running real code.
              </p>
            </div>
            <div className="step">
              <h3>It is verified and archived</h3>
              <p>
                Each quest passes structural validation, sandbox execution (JavaScript, SQLite,
                regex, shell, git) and duplicate checks before joining the archive.
              </p>
            </div>
            <div className="step">
              <h3>The site updates itself</h3>
              <p>
                A GitHub Actions workflow commits the quest, rebuilds the archive index and deploys
                this site — no human in the loop.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              Recent quests
            </h2>
            <Link to="/archive" className="btn btn-ghost btn-sm">
              <LibraryBig size={14} aria-hidden /> View all
            </Link>
          </div>
          <div style={{ height: 'var(--space-5)' }} />
          {index.loading ? (
            <QuestCardSkeletonGrid count={6} />
          ) : recent.length > 0 ? (
            <div className="quest-grid">
              {recent.map((entry) => (
                <QuestCard key={entry.id} entry={entry} isToday={entry.date === latestDate} />
              ))}
            </div>
          ) : (
            <EmptyState title="The archive is just getting started">
              Recent quests will appear here as they are published.
            </EmptyState>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">Explore by category</h2>
          <div className="category-grid">
            {(categories.data ?? [])
              .filter((c) => c.questCount > 0)
              .map((category) => {
                const Icon = categoryIcon(category.icon);
                return (
                  <Link key={category.id} to={`/category/${category.id}`} className="category-card">
                    <span className="category-icon">
                      <Icon size={20} aria-hidden />
                    </span>
                    <span>
                      <span className="category-name">{category.label}</span>
                      <div className="category-count">
                        {category.questCount} {pluralize(category.questCount, 'quest')}
                      </div>
                    </span>
                  </Link>
                );
              })}
          </div>
        </section>

        {stats.data ? (
          <section className="section">
            <h2 className="section-title">Archive at a glance</h2>
            <div className="stats-strip">
              <div className="stat-tile">
                <div className="stat-value">{stats.data.totalQuests}</div>
                <div className="stat-label">Quests published</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{stats.data.currentStreak}</div>
                <div className="stat-label">Publishing streak</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{totalHours(stats.data.totalEstimatedMinutes)}</div>
                <div className="stat-label">Practice time</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{Object.keys(stats.data.byCategory).length}</div>
                <div className="stat-label">Categories</div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="section" style={{ textAlign: 'center', paddingBottom: 'var(--space-6)' }}>
          <h2 className="section-title" style={{ justifyContent: 'center' }}>Feeling lucky?</h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/random" className="btn btn-secondary">
              <Dice5 size={15} aria-hidden /> Try a random quest
            </Link>
            <a
              className="btn btn-ghost"
              href="https://github.com/singhtanishq/DailyQuest"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={15} aria-hidden /> View the source
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
