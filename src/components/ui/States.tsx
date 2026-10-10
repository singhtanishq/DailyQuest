import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function EmptyState({
  title,
  children,
  actions,
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="state-box">
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

export function ErrorState({ title, detail }: { title: string; detail?: string }) {
  const isMissing = detail?.includes('not found') || detail?.includes('No quest matches');
  return (
    <div className="container page">
      <div className="state-box" role="alert">
        <h2>{title}</h2>
        <p>
          {isMissing
            ? 'The content you are looking for does not exist (yet).'
            : 'The archive data could not be loaded. This is usually temporary — try again.'}
        </p>
        {detail ? <div className="error-note">{detail}</div> : null}
        <div className="actions">
          <Link to="/" className="btn btn-primary">
            Back to Today
          </Link>
          <Link to="/archive" className="btn btn-secondary">
            Browse Archive
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container page" aria-hidden>
      <div className="stack">
        <div className="skeleton" style={{ height: 14, width: '30%' }} />
        <div className="skeleton" style={{ height: 34, width: '70%' }} />
        <div className="skeleton" style={{ height: 18, width: '55%' }} />
        <div className="skeleton" style={{ height: 180 }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    </div>
  );
}

export function QuestCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="quest-grid" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 150 }} />
      ))}
    </div>
  );
}
