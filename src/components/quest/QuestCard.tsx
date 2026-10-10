import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { categoryIcon, categoryLabel, difficultyLabel } from '../../lib/labels.js';
import { padQuestNumber } from '../../lib/format.js';
import type { QuestIndexEntry } from '../../../shared/types.js';

export function DifficultyBadge({ difficulty, score }: { difficulty: string; score: number }) {
  return (
    <span className={`badge badge-difficulty-${score}`}>
      <DifficultyDots score={score} />
      {difficultyLabel(difficulty)}
    </span>
  );
}

export function DifficultyDots({ score }: { score: number }) {
  return (
    <span className="difficulty-dots" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < score ? 'filled' : ''} />
      ))}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const Icon = categoryIcon(category);
  return (
    <span className="badge badge-category">
      <Icon size={12} aria-hidden />
      {categoryLabel(category)}
    </span>
  );
}

export function MetaStrip({
  entry,
  showDate = true,
}: {
  entry: QuestIndexEntry;
  showDate?: boolean;
}) {
  return (
    <div className="meta-strip">
      <span>Quest #{padQuestNumber(entry.sequenceNumber)}</span>
      {showDate ? (
        <>
          <span className="dot">·</span>
          <span>{entry.date}</span>
        </>
      ) : null}
      <span className="dot">·</span>
      <CategoryBadge category={entry.category} />
      <span className="dot">·</span>
      <DifficultyBadge difficulty={entry.difficulty} score={entry.difficultyScore} />
      <span className="dot">·</span>
      <span>{entry.estimatedMinutes} min</span>
    </div>
  );
}

/** Compact quest card used across home, archive, category and related lists. */
export function QuestCard({
  entry,
  isToday = false,
  footer,
}: {
  entry: QuestIndexEntry;
  isToday?: boolean;
  footer?: ReactNode;
}) {
  return (
    <Link to={`/quest/${entry.slug}`} className="card">
      <div className="meta-strip" style={{ fontSize: '0.68rem' }}>
        <span>#{padQuestNumber(entry.sequenceNumber)}</span>
        {isToday ? <span className="badge badge-today">TODAY</span> : <span>{entry.date}</span>}
      </div>
      <h3 className="card-title">{entry.title}</h3>
      <p className="card-desc">{entry.description}</p>
      <div className="card-footer">
        <CategoryBadge category={entry.category} />
        <DifficultyBadge difficulty={entry.difficulty} score={entry.difficultyScore} />
        <span className="badge">{entry.estimatedMinutes} min</span>
      </div>
      {footer}
    </Link>
  );
}
