import { Component, type ErrorInfo, type ReactNode, Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { AppShell } from './components/layout/AppShell.js';
import { ErrorState } from './components/ui/ErrorState.js';
import { HomePage } from './pages/HomePage.js';

const ArchivePage = lazy(() =>
  import('./pages/ArchivePage.js').then((m) => ({ default: m.ArchivePage }))
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage.js').then((m) => ({ default: m.CategoriesPage }))
);
const CategoryPage = lazy(() =>
  import('./pages/CategoryPage.js').then((m) => ({ default: m.CategoryPage }))
);
const QuestPage = lazy(() => import('./pages/QuestPage.js').then((m) => ({ default: m.QuestPage })));
const StatsPage = lazy(() => import('./pages/StatsPage.js').then((m) => ({ default: m.StatsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage.js').then((m) => ({ default: m.AboutPage })));
const RandomPage = lazy(() =>
  import('./pages/RandomPage.js').then((m) => ({ default: m.RandomPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage.js').then((m) => ({ default: m.NotFoundPage }))
);

import { PageSkeleton } from './components/ui/PageSkeleton.js';

/** Replaces only the document title — description/OG stay static. */
function RouteTitle() {
  if (document.title !== 'DailyQuest — One challenge. Every day.') {
    document.title = 'DailyQuest — One challenge. Every day.';
  }
  return null;
}

interface BoundaryState {
  error: Error | null;
}

/** App-level boundary: a hard crash renders a friendly recovery screen. */
class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ErrorState title="Something went wrong" detail={this.state.error.message} />;
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  window.scrollTo(0, 0);
  void pathname;
  return null;
}
export function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <AppErrorBoundary>
      <BrowserRouter basename={basename}>
        <AppShell>
          <ScrollToTop />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<><RouteTitle /><HomePage /></>} />
              <Route path="/quest/:slug" element={<QuestPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/random" element={<RandomPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="/today" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppShell>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
