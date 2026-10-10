import Fuse, { type IFuseOptions } from 'fuse.js';

import type { QuestIndexEntry } from '../../shared/types.js';

const FUSE_OPTIONS: IFuseOptions<QuestIndexEntry> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.2 },
    { name: 'tags', weight: 0.2 },
    { name: 'concepts', weight: 0.1 },
    { name: 'category', weight: 0.1 },
  ],
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/** Fuzzy search across the compact index; falls back to substring matching. */
export function searchEntries(entries: QuestIndexEntry[], query: string): QuestIndexEntry[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return entries;
  }
  const fuse = new Fuse(entries, FUSE_OPTIONS);
  return fuse.search(trimmed).map((result) => result.item);
}

export interface ArchiveFilters {
  q: string;
  category: string;
  difficulty: string;
  type: string;
  sort: 'newest' | 'oldest';
}

export function applyFilters(
  entries: QuestIndexEntry[],
  filters: ArchiveFilters,
): QuestIndexEntry[] {
  let result = searchEntries(entries, filters.q);
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }
  if (filters.difficulty) {
    result = result.filter((e) => e.difficulty === filters.difficulty);
  }
  if (filters.type) {
    result = result.filter((e) => e.challengeType === filters.type);
  }
  result = [...result].sort((a, b) =>
    filters.sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  );
  return result;
}
