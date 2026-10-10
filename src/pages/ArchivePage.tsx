import { useEffect } from 'react';

import { ArchiveBrowser } from '../components/archive/ArchiveBrowser.js';

export function ArchivePage() {
  useEffect(() => {
    document.title = 'Archive — DailyQuest';
  }, []);

  return (
    <div className="container page">
      <h1 className="quest-title" style={{ marginTop: 0 }}>
        The Archive
      </h1>
      <p style={{ color: 'var(--foreground-muted)', marginTop: 'var(--space-2)' }}>
        Every quest ever published — searchable, filterable, and growing by one each day.
      </p>
      <ArchiveBrowser />
    </div>
  );
}
