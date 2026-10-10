import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpDown, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { QuestIndexEntry } from '../../shared/types.js';
import { CHALLENGE_TYPE_LABELS, DIFFICULTY_ORDER, categoryLabel, difficultyLabel } from '../../lib/labels.js';
import { useAsync, useDebounced } from '../../hooks/useAppState.js';
import { getIndex } from '../../data/api.js';
import { applyFilters, type ArchiveFilters } from '../../lib/search.js';
import { EmptyState, QuestCardSkeletonGrid } from '../ui/States.js';
import { QuestCard } from './QuestCard.js';

const PAGE_SIZE = 12;

function toFilters(params: URLSearchParams): ArchiveFilters {
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    difficulty: params.get('difficulty') ?? '',
    type: params.get('type') ?? '',
    sort: sort === 'oldest' ? 'oldest' : 'newest',
  };
}

/** Full archive browser: search, filters, sort, pagination — all in the URL. */
export function ArchiveBrowser({
  lockCategory,
  heading,
}: {
  /** When set, the category filter is fixed (category pages). */
  lockCategory?: string;
  heading?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const filters = toFilters(params);

  const { data: entries, error, loading } = useAsync(getIndex, []);
  const [searchInput, setSearchInput] = useState(filters.q);
  const debouncedSearch = useDebounced(searchInput);

  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      update({ q: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    if (!('page' in changes)) {
      next.delete('page');
    }
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
  };

  const filtered = useMemo(() => {
    if (!entries) {
      return [];
    }
    return applyFilters(entries, { ...filters, category: lockCategory ?? filters.category });
  }, [entries, filters, lockCategory]);

  if (error) {
    throw error; // caught by the route-level boundary
  }

  const pageParam = Number.parseInt(params.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="archive-controls">
        <label style={{ display: 'contents' }}>
          <span style={{ position: 'absolute', left: -9999 }}>Search quests</span>
          <span className="text-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0.8rem' }}>
            <Search size={15} aria-hidden style={{ color: 'var(--foreground-muted)', flexShrink: 0 }} />
            <input
              type="search"
              value={searchInput}
              placeholder="Search titles, tags, concepts…"
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '0.55rem 0', color: 'inherit' }}
            />
          </span>
        </label>
        {!lockCategory ? (
          <select
            className="select"
            value={filters.category}
            onChange={(e) => update({ category: e.target.value || null })}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categoryOptions(entries ?? [])}
          </select>
        ) : null}
        <select
          className="select"
          value={filters.difficulty}
          onChange={(e) => update({ difficulty: e.target.value || null })}
          aria-label="Filter by difficulty"
        >
          <option value="">All difficulties</option>
          {DIFFICULTY_ORDER.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficultyLabel(difficulty)}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={filters.type}
          onChange={(e) => update({ type: e.target.value || null })}
          aria-label="Filter by challenge type"
        >
          <option value="">All types</option>
          {Object.entries(CHALLENGE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="sort-row">
        <span className="result-count">
          {loading ? 'Loading archive…' : `${filtered.length} quest${filtered.length === 1 ? '' : 's'}`}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => update({ sort: filters.sort === 'newest' ? 'oldest' : 'newest' })}
        >
          <ArrowUpDown size={13} aria-hidden />
          {filters.sort === 'newest' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {loading ? (
        <QuestCardSkeletonGrid />
      ) : visible.length === 0 ? (
        <EmptyState title="No quests match this filter">
          Try a different search term, or clear the filters to see the whole archive.
        </EmptyState>
      ) : (
        <div className="quest-grid">
          {visible.map((entry) => (
            <QuestCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="pagination" aria-label="Pagination">
          <button
            type="button"
            className="page-btn"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) })}
          >
            ←
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <span key={p} style={{ display: 'contents' }}>
                {i > 0 && p - (arr[i - 1] ?? 0) > 1 ? <span style={{ color: 'var(--foreground-faint)' }}>…</span> : null}
                <button
                  type="button"
                  className="page-btn"
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => update({ page: String(p) })}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            type="button"
            className="page-btn"
            disabled={page >= pageCount}
            onClick={() => update({ page: String(page + 1) })}
          >
            →
          </button>
        </nav>
      ) : null}
    </>
  );
}

function categoryOptions(entries: QuestIndexEntry[]) {
  const categories = [...new Set(entries.map((e) => e.category))].sort();
  return categories.map((category) => (
    <option key={category} value={category}>
      {categoryLabel(category)}
    </option>
  ));
}
