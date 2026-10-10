import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Quest not found — DailyQuest';
  }, []);

  return (
    <div className="container page">
      <div className="notfound">
        <h1>404</h1>
        <p>This page is not part of the quest archive. It may have been moved, or never existed.</p>
        <div className="actions">
          <Link to="/" className="btn btn-primary">
            Go to Today's Quest
          </Link>
          <Link to="/archive" className="btn btn-secondary">
            Browse Archive
          </Link>
        </div>
      </div>
    </div>
  );
}
