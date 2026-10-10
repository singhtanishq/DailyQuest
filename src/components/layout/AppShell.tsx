import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';

import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/useAppState.js';

const NAV_ITEMS = [
  { to: '/', label: 'Today', end: true },
  { to: '/archive', label: 'Archive' },
  { to: '/categories', label: 'Categories' },
  { to: '/stats', label: 'Stats' },
  { to: '/random', label: 'Random' },
  { to: '/about', label: 'About' },
];

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="brand-mark">
      <path
        d="M12 2.5 21 12l-9 9.5L3 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.4 12.1l2.5 2.6 4.9-5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (to: string, end?: boolean): boolean =>
    end ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="site">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="DailyQuest home">
            <BrandMark />
            DailyQuest
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={17} aria-hidden /> : <Menu size={17} aria-hidden />}
          </button>
          <nav className={`nav${menuOpen ? ' open' : ''}`} aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to, item.end);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="nav-link"
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </NavLink>
              );
            })}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            </button>
          </nav>
        </div>
      </header>
      <main id="main" className="site-main">
        {children}
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong>DailyQuest</strong>
            <div className="footer-tagline">One challenge. Every day.</div>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <Link to="/archive">Archive</Link>
            <Link to="/about">About</Link>
            <a
              href="https://github.com/singhtanishq/DailyQuest"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <span>MIT License</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
