import { describe, expect, it } from 'vitest';

import { testConfig } from './helpers.js';
import { CATEGORY_IDS } from '../shared/types.js';
import { Rng } from '../scripts/daily/core/rng.js';
import {
  emptyRecentArchive,
  selectCategory,
  selectDifficulty,
  selectTemplate,
  templatesForCategory,
  type RecentArchive,
} from '../scripts/daily/core/selection.js';
import { ALL_TEMPLATES } from '../scripts/daily/templates/index.js';

function recentWith(overrides: Partial<RecentArchive>): RecentArchive {
  return { ...emptyRecentArchive(), ...overrides };
}

describe('selection', () => {
  it('selectCategory respects the repeat limit (no 3 in a row)', () => {
    const cfg = testConfig();
    const recent = recentWith({ categories: ['sql', 'sql'] });
    for (let i = 0; i < 50; i++) {
      const rng = new Rng(`category-${i}`);
      expect(selectCategory(rng, cfg, recent)).not.toBe('sql');
    }
  });

  it('selectCategory allows a category again after a break', () => {
    const cfg = testConfig();
    const recent = recentWith({ categories: ['sql', 'git'] });
    const rng = new Rng('category-ok');
    expect(CATEGORY_IDS).toContain(selectCategory(rng, cfg, recent));
  });

  it('every category with weight has at least one template', () => {
    const cfg = testConfig();
    for (const [category, weight] of Object.entries(cfg.categoryWeights)) {
      if (weight > 0) {
        expect(
          templatesForCategory(ALL_TEMPLATES, category as keyof typeof cfg.categoryWeights).length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('selectTemplate avoids the rotation window', () => {
    const cfg = testConfig();
    const recent = recentWith({
      templateIds: [
        'coding.balanced-ledger',
        'coding.comma-that-lied',
        'coding.vanishing-number',
        'coding.roman-ledger',
        'coding.run-length',
        'coding.silent-bits',
        'coding.persisting-digit',
        'coding.common-ground',
        'coding.shifted-dispatch',
        'coding.nested-cascade',
        'coding.order-in-the-ranks',
        'coding.params-of-chaos',
        'coding.unruly-line',
        'coding.scattered-isles',
      ],
    });
    const pool = templatesForCategory(ALL_TEMPLATES, 'coding');
    const rng = new Rng('template-window');
    const chosen = selectTemplate(rng, cfg, pool, recent);
    expect(chosen.id).toBe('coding.case-rites'); // the only one outside the 14-window
  });

  it('selectTemplate falls back to least-recently-used when the window covers the pool', () => {
    const cfg = testConfig();
    const pool = templatesForCategory(ALL_TEMPLATES, 'databases'); // 2 templates
    const recent = recentWith({ templateIds: ['db.index-tradeoffs'] });
    const rng = new Rng('lru');
    expect(selectTemplate(rng, cfg, pool, recent).id).toBe('db.isolation-phenomena');
  });

  it('selectDifficulty respects template restrictions and category overrides', () => {
    const cfg = testConfig();
    const template = ALL_TEMPLATES.find((t) => t.id === 'design.rate-limiter');
    expect(template).toBeDefined();
    for (let i = 0; i < 30; i++) {
      const rng = new Rng(`difficulty-${i}`);
      const difficulty = selectDifficulty(rng, cfg, template!, 'system_design');
      expect(template!.difficulties).toContain(difficulty);
      expect(difficulty).not.toBe('beginner'); // overridden to 0 for system_design
    }
  });

  it('selection is deterministic for a given seed and archive state', () => {
    const cfg = testConfig();
    const run = (rng: Rng): string => {
      const category = selectCategory(rng, cfg, emptyRecentArchive());
      const pool = templatesForCategory(ALL_TEMPLATES, category);
      const template = selectTemplate(rng, cfg, pool, emptyRecentArchive());
      const difficulty = selectDifficulty(rng, cfg, template, category);
      return `${category}/${template.id}/${difficulty}`;
    };
    expect(run(new Rng('determinism-check'))).toBe(run(new Rng('determinism-check')));
  });
});
