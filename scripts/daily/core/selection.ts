import { CATEGORY_IDS, DIFFICULTIES, type CategoryId, type Difficulty } from '../../../shared/types.js';
import type { DailyQuestConfig } from '../../../config/dailyquest.config.js';
import type { Rng } from './rng.js';
import type { QuestTemplate } from '../templates/framework.js';

/**
 * Selection layer: turns a seeded RNG into concrete category / template /
 * difficulty choices while respecting the rotation rules that keep daily
 * content varied (no repeated categories, no recently used templates or
 * concepts, healthy difficulty distribution).
 */

export interface RecentArchive {
  /** Quest dates, newest first. */
  dates: string[];
  /** Categories, newest first. */
  categories: CategoryId[];
  /** Template ids, newest first. */
  templateIds: string[];
  /** Primary concept of each quest, newest first. */
  primaryConcepts: string[];
}

export function emptyRecentArchive(): RecentArchive {
  return { dates: [], categories: [], templateIds: [], primaryConcepts: [] };
}

export function selectCategory(
  rng: Rng,
  cfg: DailyQuestConfig,
  recent: RecentArchive
): CategoryId {
  // Ban the category that would violate the repeat limit (e.g. publishing it
  // again would make three consecutive days).
  const head = recent.categories.slice(0, cfg.rotation.categoryRepeatLimit);
  const banned = new Set<CategoryId>();
  if (
    head.length === cfg.rotation.categoryRepeatLimit &&
    head[0] !== undefined &&
    head.every((c) => c === head[0])
  ) {
    banned.add(head[0]);
  }

  const withWeight = CATEGORY_IDS.filter((id) => (cfg.categoryWeights[id] ?? 0) > 0);
  const candidates = withWeight.filter((id) => !banned.has(id));
  const pool = candidates.length > 0 ? candidates : withWeight;
  if (pool.length === 0) {
    throw new Error('No categories with positive weight configured');
  }
  return rng.weighted(pool, (id) => cfg.categoryWeights[id] ?? 0);
}

export function templatesForCategory(
  pool: readonly QuestTemplate[],
  category: CategoryId
): QuestTemplate[] {
  return pool.filter((t) => t.category === category);
}

export function selectTemplate(
  rng: Rng,
  cfg: DailyQuestConfig,
  pool: readonly QuestTemplate[],
  recent: RecentArchive
): QuestTemplate {
  if (pool.length === 0) {
    throw new Error('Template pool is empty');
  }

  const templateBanned = new Set(recent.templateIds.slice(0, cfg.rotation.templateWindow));
  const conceptBanned = new Set(recent.primaryConcepts.slice(0, cfg.rotation.conceptWindow));

  let candidates = pool.filter((t) => !templateBanned.has(t.id));

  // Prefer candidates whose primary concept was not used recently. If the
  // rotation windows are larger than the pool, fall back to unfiltered.
  const byConcept = candidates.filter(
    (t) => t.concepts[0] === undefined || !conceptBanned.has(t.concepts[0])
  );
  if (byConcept.length > 0) {
    candidates = byConcept;
  }

  if (candidates.length === 0) {
    // Least-recently-used fallback: pick the template whose last use is
    // furthest back (never-used templates are preferred).
    let best: QuestTemplate | undefined;
    let bestDistance = -1;
    for (const template of pool) {
      const lastIndex = recent.templateIds.indexOf(template.id);
      const distance = lastIndex === -1 ? Number.MAX_SAFE_INTEGER : lastIndex;
      if (distance > bestDistance) {
        bestDistance = distance;
        best = template;
      }
    }
    if (best === undefined) {
      throw new Error('Template selection failed: pool exhausted');
    }
    return best;
  }

  return rng.pick(candidates);
}

export function selectDifficulty(
  rng: Rng,
  cfg: DailyQuestConfig,
  template: QuestTemplate,
  category: CategoryId
): Difficulty {
  const allowed = DIFFICULTIES.filter((d) => template.difficulties.includes(d));
  if (allowed.length === 0) {
    throw new Error(`Template ${template.id} declares no valid difficulties`);
  }
  const overrides = cfg.categoryDifficultyOverrides[category];
  const weightOf = (d: Difficulty): number =>
    overrides?.[d] ?? cfg.difficultyWeights[d];

  const weighted = allowed.filter((d) => weightOf(d) > 0);
  if (weighted.length === 0) {
    const first = allowed[0];
    if (first === undefined) {
      throw new Error(`Template ${template.id} has no allowed difficulty`);
    }
    return first;
  }
  return rng.weighted(weighted, weightOf);
}
