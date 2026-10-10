import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Dice5 } from 'lucide-react';

import { getIndex } from '../data/api.js';
import { useAsync } from '../hooks/useAppState.js';

/**
 * Random quest: picks uniformly from the archive (honoring optional
 * category/difficulty/type filters) and redirects. `exclude=today` skips the
 * latest quest so "roll again" always leaves Today.
 */
export function RandomPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const index = useAsync(getIndex, []);
  const rolled = useRef(false);

  useEffect(() => {
    if (!index.data || rolled.current) {
      return;
    }
    rolled.current = true;
    const entries = index.data.filter((entry) => {
      if (params.get('category') && entry.category !== params.get('category')) {
        return false;
      }
      if (params.get('difficulty') && entry.difficulty !== params.get('difficulty')) {
        return false;
      }
      if (params.get('type') && entry.challengeType !== params.get('type')) {
        return false;
      }
      return true;
    });

    const pool =
      params.get('exclude') === 'today' && entries.length > 1
        ? entries.filter((entry) => entry.id !== index.data?.[index.data.length - 1]?.id)
        : entries;

    if (pool.length === 0) {
      return;
    }
    const randomIndex = new Uint32Array(1);
    crypto.getRandomValues(randomIndex);
    const pick = pool[randomIndex[0]! % pool.length];
    if (pick) {
      navigate(`/quest/${pick.slug}`, { replace: true });
    }
  }, [index.data, params, navigate]);

  const hasMatch =
    index.data &&
    index.data.some(
      (entry) =>
        (!params.get('category') || entry.category === params.get('category')) &&
        (!params.get('difficulty') || entry.difficulty === params.get('difficulty')) &&
        (!params.get('type') || entry.challengeType === params.get('type'))
    );

  return (
    <div className="container page">
      <div className="notfound">
        <Dice5 size={44} style={{ margin: '0 auto', color: 'var(--primary)' }} aria-hidden />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-sans)' }}>
          {index.loading ? 'Rolling the dice…' : hasMatch ? 'Rolling…' : 'No match found'}
        </h1>
        <p>
          {hasMatch === false
            ? 'No quests match those filters yet. Try clearing them.'
            : 'Choosing a quest from the archive.'}
        </p>
        <div className="actions">
          <Link to="/archive" className="btn btn-secondary">
            Browse Archive
          </Link>
          <Link to="/" className="btn btn-ghost">
            Back to Today
          </Link>
        </div>
      </div>
    </div>
  );
}
