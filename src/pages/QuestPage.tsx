import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { getIndex, getLatest, getQuestBySlug } from '../data/api.js';
import { useAsync } from '../hooks/useAppState.js';
import { ErrorState, PageSkeleton } from '../components/ui/States.js';
import { MetaStrip } from '../components/quest/QuestCard.js';
import {
  HintList,
  LearningObjectives,
  QuestBody,
  QuestNav,
  ShareButton,
  SolutionPanel,
} from '../components/quest/QuestBody.js';
import { QuestCard } from '../components/quest/QuestCard.js';
import { formatDisplayDate, padQuestNumber } from '../lib/format.js';
import { categoryLabel } from '../lib/labels.js';

export function QuestPage() {
  const { slug = '' } = useParams();
  const quest = useAsync(() => getQuestBySlug(slug), [slug]);
  const index = useAsync(getIndex, []);
  const latest = useAsync(getLatest, []);

  useEffect(() => {
    if (quest.data) {
      document.title = `${quest.data.title} — Quest #${padQuestNumber(quest.data.sequenceNumber)} — DailyQuest`;
    }
  }, [quest.data]);

  if (quest.error) {
    return <ErrorState title="Quest not found" detail={quest.error.message} />;
  }
  if (quest.loading || !quest.data) {
    return (
      <PageSkeleton />
    );
  }

  const current = quest.data;
  const entries = index.data ?? [];
  const position = entries.findIndex((e) => e.id === current.id);
  const previous = position > 0 ? (entries[position - 1] ?? null) : null;
  const next =
    position >= 0 && position < entries.length - 1 ? (entries[position + 1] ?? null) : null;
  const isLatest = latest.data?.id === current.id;
  const related = entries.filter((e) => current.relatedQuestIds.includes(e.id));

  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <Link to="/archive" className="btn btn-ghost btn-sm">
          <ChevronLeft size={14} aria-hidden /> Archive
        </Link>
        <ShareButton title={`${current.title} — DailyQuest`} />
      </div>

      <header className="quest-header">
        <MetaStrip entry={current} />
        {isLatest ? (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <span className="badge badge-today">TODAY'S QUEST</span>
          </div>
        ) : null}
        <h1 className="quest-title">{current.title}</h1>
        <p className="quest-subtitle">{current.subtitle}</p>
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--foreground-muted)' }}>
          {current.description}
        </p>
        <p
          style={{
            marginTop: 'var(--space-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--foreground-faint)',
          }}
        >
          {formatDisplayDate(current.date)} · {categoryLabel(current.category)} ·{' '}
          {current.tags.map((tag) => `#${tag}`).join(' ')}
        </p>
      </header>

      <QuestBody quest={current} />
      <HintList hints={current.hints} />
      <SolutionPanel quest={current} />
      <LearningObjectives quest={current} />

      {related.length > 0 ? (
        <section className="quest-section">
          <h2>Related Quests</h2>
          <div className="quest-grid">
            {related.map((entry) => (
              <QuestCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ) : null}

      <QuestNav previous={previous} next={next} />
    </div>
  );
}
