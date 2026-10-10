import { CATEGORY_META } from '../../../shared/categories.js';
import type {
  CategorySummary,
  CategoriesFile,
  Quest,
  QuestIndexEntry,
  QuestStats,
} from '../../../shared/types.js';
import { diffInDays } from '../core/dates.js';
import type { IndexEntry } from './index.js';

function streaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) {
    return { current: 0, longest: 0 };
  }
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = dates[i - 1];
    const curr = dates[i];
    if (prev !== undefined && curr !== undefined && diffInDays(prev, curr) === 1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) {
      longest = run;
    }
  }
  // Current streak counts consecutive published days ending at the last date.
  let current = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const prev = dates[i - 1];
    const curr = dates[i];
    if (prev !== undefined && curr !== undefined && diffInDays(prev, curr) === 1) {
      current++;
    } else {
      break;
    }
  }
  return { current, longest };
}

export function buildStats(
  quests: Quest[],
): Omit<QuestStats, 'schemaVersion' | 'generatorVersion' | 'generatedAt'> {
  const sorted = [...quests].sort((a, b) => a.date.localeCompare(b.date));
  const byCategory: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalMinutes = 0;

  for (const quest of sorted) {
    byCategory[quest.category] = (byCategory[quest.category] ?? 0) + 1;
    byDifficulty[quest.difficulty] = (byDifficulty[quest.difficulty] ?? 0) + 1;
    byType[quest.challengeType] = (byType[quest.challengeType] ?? 0) + 1;
    totalMinutes += quest.estimatedMinutes;
  }

  const dates = sorted.map((q) => q.date);
  const { current, longest } = streaks(dates);
  const oldest = dates[0] ?? null;
  const latest = dates[dates.length - 1] ?? null;
  const spanDays = oldest && latest ? diffInDays(oldest, latest) + 1 : 0;
  const publishedDays = new Set(dates).size;

  const categoryBreakdown = Object.entries(byCategory)
    .map(([id, count]) => ({
      id: id as keyof typeof CATEGORY_META,
      label: CATEGORY_META[id as keyof typeof CATEGORY_META]?.label ?? id,
      count,
      percent: sorted.length > 0 ? Math.round((count / sorted.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

  const mostFrequentCategory = categoryBreakdown[0]?.id ?? null;
  const mostFrequentDifficulty =
    Object.entries(byDifficulty).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalQuests: sorted.length,
    currentSequence: sorted.length,
    latestQuestDate: latest,
    oldestQuestDate: oldest,
    byCategory,
    byDifficulty,
    byType,
    categoryBreakdown,
    averageEstimatedMinutes:
      sorted.length > 0 ? Math.round((totalMinutes / sorted.length) * 10) / 10 : 0,
    totalEstimatedMinutes: totalMinutes,
    currentStreak: current,
    longestStreak: longest,
    archiveSpanDays: spanDays,
    missedDays: spanDays - publishedDays,
    mostFrequentCategory,
    mostFrequentDifficulty,
  };
}

export function buildCategoriesFile(
  quests: Quest[],
  generatorVersion: string,
  generatedAt: string,
): CategoriesFile {
  const sorted = [...quests].sort((a, b) => a.date.localeCompare(b.date));
  const categories: CategorySummary[] = (
    Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>
  ).map((id) => {
    const meta = CATEGORY_META[id];
    const own = sorted.filter((q) => q.category === id);
    const difficultyDistribution: Record<string, number> = {};
    const tagCounts = new Map<string, number>();
    const skills = new Set<string>();
    for (const quest of own) {
      difficultyDistribution[quest.difficulty] =
        (difficultyDistribution[quest.difficulty] ?? 0) + 1;
      for (const tag of quest.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
      for (const skill of quest.skills) {
        skills.add(skill);
      }
    }
    return {
      id,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      group: meta.group,
      questCount: own.length,
      difficultyDistribution,
      skills: [...skills].slice(0, 8),
      topTags: [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 6)
        .map(([tag]) => tag),
      latestQuestDate: own.length > 0 ? (own[own.length - 1]?.date ?? null) : null,
    };
  });

  return {
    schemaVersion: 1,
    generatorVersion,
    generatedAt,
    categories,
  };
}

export function buildLatestFile(
  entries: IndexEntry[],
  generatorVersion: string,
  generatedAt: string,
): { quest: QuestIndexEntry; generatorVersion: string; generatedAt: string; schemaVersion: 1 } {
  const last = entries[entries.length - 1];
  if (!last) {
    throw new Error('Cannot build latest.json: the archive is empty');
  }
  return {
    schemaVersion: 1,
    generatorVersion,
    generatedAt,
    quest: last,
  };
}
