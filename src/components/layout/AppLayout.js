import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalFilterBar } from './GlobalFilterBar';
import { SystemStatusFooter } from './SystemStatusFooter';
import { ViewAsBanner } from './ViewAsBanner';
import { BreadcrumbProvider } from '../../context/BreadcrumbContext';

const COLLAPSE_KEY = 'orderflow.sidebarCollapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore unavailable storage
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo?.(0, 0);
  }, [pathname]);

  return (
    <BreadcrumbProvider>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
        <div className="app-main">
          <ViewAsBanner />
          <TopBar onOpenNav={() => setMobileOpen(true)} />
          <GlobalFilterBar />
          <main id="main-content" className="app-content" tabIndex={-1}>
            <Outlet />
          </main>
          <SystemStatusFooter />
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
