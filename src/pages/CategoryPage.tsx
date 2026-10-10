import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getCategories, getIndex } from '../data/api.js';
import { useAsync } from '../hooks/useAppState.js';
import { ErrorState, QuestCardSkeletonGrid } from '../components/ui/States.js';
import { QuestCard } from '../components/quest/QuestCard.js';
import { CategoryBadge, DifficultyBadge } from '../components/quest/QuestCard.js';
import { categoryIcon, categoryLabel } from '../lib/labels.js';
import { CATEGORY_META } from '../../shared/categories.js';
import type { CategoryId } from '../../shared/types.js';

export function CategoryPage() {
  const { categoryId = '' } = useParams();
  const categories = useAsync(getCategories, []);
  const index = useAsync(getIndex, []);

  useEffect(() => {
    const label = categoryLabel(categoryId);
    document.title = `${label} — DailyQuest`;
  }, [categoryId]);

  if (categories.error) {
    return <ErrorState title="Categories could not be loaded" detail={categories.error.message} />;
  }

  const summary = categories.data?.find((c) => c.id === categoryId);
  const meta = CATEGORY_META[categoryId as CategoryId];

  if (!summary && !categories.loading) {
    return (
      <ErrorState
        title="Unknown category"
        detail={`No category with id "${categoryId}" exists.`}
      />
    );
  }

  const quests = (index.data ?? [])
    .filter((q) => q.category === categoryId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const Icon = categoryIcon(categoryId);
  const difficulties = Object.entries(summary?.difficultyDistribution ?? {}).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="container page">
      <div className="category-hero">
        <span className="category-icon">
          <Icon size={22} aria-hidden />
        </span>
        <div>
          <h1 className="quest-title" style={{ marginTop: 0 }}>
            {summary?.label ?? categoryLabel(categoryId)}
          </h1>
          <p style={{ color: 'var(--foreground-muted)', maxWidth: '64ch', marginTop: 'var(--space-2)' }}>
            {summary?.description ?? meta?.description}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
            <span className="badge">
              {quests.length} {quests.length === 1 ? 'quest' : 'quests'}
            </span>
            {difficulties.map(([difficulty, count]) => (
              <span key={difficulty} className="badge">
                {count} {difficulty}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="section" style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="section-title">Quests</h2>
        {index.loading ? (
          <QuestCardSkeletonGrid count={6} />
        ) : quests.length === 0 ? (
          <div className="state-box">
            <h2>Nothing here yet</h2>
            <p>This category has not appeared in the daily rotation so far. Check back soon.</p>
            <div className="actions">
              <Link to="/archive" className="btn btn-secondary">
                Browse all quests
              </Link>
            </div>
          </div>
        ) : (
          <div className="quest-grid">
            {quests.map((entry) => (
              <QuestCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {summary && summary.topTags.length > 0 ? (
        <section className="section">
          <h2 className="section-title">Recurring tags</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {summary.topTags.map((tag) => (
              <span key={tag} className="badge">
                #{tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export { CategoryBadge, DifficultyBadge };
