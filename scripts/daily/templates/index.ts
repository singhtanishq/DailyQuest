import type { QuestTemplate } from '../../../shared/types.js';

import { algorithmTemplates } from './algorithms.js';
import { architectureTemplates } from './architecture.js';
import { codingTemplates } from './coding.js';
import { codeReviewTemplates } from './code-review.js';
import { databaseTemplates } from './databases.js';
import { debuggingTemplates } from './debugging.js';
import { devopsTemplates, generalTemplates } from './devops-general.js';
import { dataStructureTemplates } from './data-structures.js';
import { gitTemplates } from './git.js';
import { httpTemplates } from './http.js';
import { javascriptTemplates } from './javascript.js';
import { linuxTemplates } from './linux.js';
import { logicTemplates, puzzleTemplates } from './logic.js';
import { networkingTemplates } from './networking.js';
import { predictionTemplates } from './output-prediction.js';
import { performanceTemplates } from './performance.js';
import { pythonTemplates } from './python.js';
import { reactTemplates, webTemplates } from './react-web.js';
import { regexTemplates } from './regex.js';
import { securityTemplates } from './security.js';
import { sqlTemplates } from './sql.js';
import { systemDesignTemplates } from './system-design.js';
import { typescriptTemplates } from './typescript.js';
import { apiTemplates } from './apis.js';

/**
 * The full template registry — the generator's content pool. Every entry is
 * validated for unique ids at load time; duplicate ids are a programming
 * error and must fail immediately.
 */
export const ALL_TEMPLATES: QuestTemplate[] = [
  ...codingTemplates,
  ...algorithmTemplates,
  ...debuggingTemplates,
  ...predictionTemplates,
  ...dataStructureTemplates,
  ...codeReviewTemplates,
  ...pythonTemplates,
  ...javascriptTemplates,
  ...typescriptTemplates,
  ...reactTemplates,
  ...webTemplates,
  ...httpTemplates,
  ...apiTemplates,
  ...databaseTemplates,
  ...sqlTemplates,
  ...linuxTemplates,
  ...gitTemplates,
  ...networkingTemplates,
  ...securityTemplates,
  ...regexTemplates,
  ...logicTemplates,
  ...puzzleTemplates,
  ...systemDesignTemplates,
  ...architectureTemplates,
  ...devopsTemplates,
  ...generalTemplates,
];

const seenIds = new Set<string>();
for (const template of ALL_TEMPLATES) {
  if (seenIds.has(template.id)) {
    throw new Error(`Duplicate template id: ${template.id}`);
  }
  seenIds.add(template.id);
}

export function templateCountByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const template of ALL_TEMPLATES) {
    counts[template.category] = (counts[template.category] ?? 0) + 1;
  }
  return counts;
}
