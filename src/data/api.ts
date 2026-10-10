import type {
  CategoriesFile,
  CategorySummary,
  HealthFile,
  LatestFile,
  Quest,
  QuestIndexEntry,
  QuestStats,
} from '../../shared/types.js';

/**
 * Data service — the single access point for generated JSON. Components never
 * call fetch directly; errors surface as typed DataError instances that pages
 * translate into friendly states.
 */

const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export class DataError extends Error {
  constructor(
    message: string,
    readonly kind: 'not-found' | 'network' | 'parse'
  ) {
    super(message);
    this.name = 'DataError';
  }
}

async function getJson<T>(path: string, cache: RequestCache = 'default'): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { cache });
  } catch (error) {
    throw new DataError(`Network error while loading ${path}`, 'network');
  }
  if (response.status === 404) {
    throw new DataError(`${path} not found`, 'not-found');
  }
  if (!response.ok) {
    throw new DataError(`Failed to load ${path} (HTTP ${response.status})`, 'network');
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new DataError(`${path} contains invalid JSON`, 'parse');
  }
}

type IndexEntry = QuestIndexEntry;

let indexPromise: Promise<IndexEntry[]> | null = null;

/** The archive index, cached in memory for the session. */
export function getIndex(): Promise<IndexEntry[]> {
  if (!indexPromise) {
    indexPromise = getJson<{ quests: IndexEntry[] }>('data/index.json').then(
      (data) => data.quests,
      (error) => {
        indexPromise = null;
        throw error;
      }
    );
  }
  return indexPromise;
}

/** Today's quest metadata — always fetched fresh so a new day shows up. */
export async function getLatest(): Promise<IndexEntry> {
  const data = await getJson<LatestFile>('data/latest.json', 'no-cache');
  return data.quest;
}

export async function getQuestBySlug(slugOrId: string): Promise<Quest> {
  const entries = await getIndex();
  const entry = entries.find((q) => q.slug === slugOrId || q.id === slugOrId);
  if (!entry) {
    throw new DataError(`No quest matches "${slugOrId}"`, 'not-found');
  }
  const [year, month] = entry.date.split('-');
  return getJson<Quest>(`data/quests/${year}/${month}/${entry.date}.json`);
}

export async function getStats(): Promise<QuestStats> {
  return getJson<QuestStats>('data/stats.json', 'no-cache');
}

export async function getCategories(): Promise<CategorySummary[]> {
  const data = await getJson<CategoriesFile>('data/categories.json');
  return data.categories;
}

export async function getHealth(): Promise<HealthFile> {
  return getJson<HealthFile>('data/health.json');
}

export function questPathFor(entry: IndexEntry): string {
  return `${import.meta.env.BASE_URL}quest/${entry.slug}`;
}
