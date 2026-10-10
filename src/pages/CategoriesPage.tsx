import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { getCategories } from '../data/api.js';
import { useAsync } from '../hooks/useAppState.js';
import { ErrorState, QuestCardSkeletonGrid } from '../components/ui/States.js';
import { categoryIcon } from '../lib/labels.js';
import { CATEGORY_GROUPS } from '../../shared/categories.js';
import { pluralize } from '../lib/format.js';

export function CategoriesPage() {
  const categories = useAsync(getCategories, []);

  useEffect(() => {
    document.title = 'Categories — DailyQuest';
  }, []);

  if (categories.error) {
    return <ErrorState title="Categories could not be loaded" detail={categories.error.message} />;
  }

  const data = categories.data ?? [];

  return (
    <div className="container page">
      <h1 className="quest-title" style={{ marginTop: 0 }}>
        Categories
      </h1>
      <p style={{ color: 'var(--foreground-muted)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        The quest archive is organized into {data.filter((c) => c.questCount > 0).length} active
        categories across engineering, languages, systems, security and design.
      </p>
      {categories.loading ? (
        <QuestCardSkeletonGrid count={9} />
      ) : (
        CATEGORY_GROUPS.map((group) => {
          const groupCategories = data.filter((c) => c.group === group);
          if (groupCategories.length === 0) {
            return null;
          }
          return (
            <section key={group}>
              <h2 className="group-heading">{group}</h2>
              <div className="category-grid">
                {groupCategories.map((category) => {
                  const Icon = categoryIcon(category.icon);
                  return (
                    <Link key={category.id} to={`/category/${category.id}`} className="category-card">
                      <span className="category-icon">
                        <Icon size={20} aria-hidden />
                      </span>
                      <span>
                        <span className="category-name">{category.label}</span>
                        <div className="category-count">
                          {category.questCount > 0
                            ? `${category.questCount} ${pluralize(category.questCount, 'quest')}`
                            : 'no quests yet'}
                        </div>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
