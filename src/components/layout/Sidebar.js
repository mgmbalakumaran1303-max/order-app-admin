import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, CircleHelp, Command, X } from 'lucide-react';
import { NAV_GROUPS } from '../../app/navigation';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { issueService } from '../../services';
import { TOPICS } from '../../utils/events';

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const openIssues = useAsync(() => issueService.getOpenIssueCount(), [], { topics: [TOPICS.ISSUES] });
  const badges = { openIssues: openIssues.data };

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`} aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          <Command size={19} />
        </span>
        <span className="sidebar__brand-text">
          <b>Orderflow</b>
          <span>Control Center</span>
        </span>
        <button type="button" className="sidebar__close" onClick={onCloseMobile} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_GROUPS.map((group) => (
          <div className="sidebar__group" key={group.label}>
            <div className="sidebar__group-label">{group.label}</div>
            <ul>
              {group.items.map((item) => {
                const badge = item.badge ? badges[item.badge] : null;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
                      title={collapsed ? item.label : undefined}
                      onClick={onCloseMobile}
                    >
                      <item.icon size={17} aria-hidden="true" />
                      <span className="sidebar__label">{item.label}</span>
                      {badge ? (
                        <span className="sidebar__badge" aria-label={`${badge} open issues`}>
                          {badge}
                        </span>
                      ) : null}
                      {collapsed && <span className="sidebar__tip" aria-hidden="true">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__help" disabled title="The help center is not available yet">
          <CircleHelp size={17} aria-hidden="true" />
          <span className="sidebar__label">
            <b>Need a hand?</b>
            <small>Help center coming soon</small>
          </span>
        </button>
        {user && (
          <div className="sidebar__user">
            <span className="avatar" aria-hidden="true">
              {user.initials}
            </span>
            <span className="sidebar__label">
              <b>{user.name}</b>
              <small>{user.role}</small>
            </span>
          </div>
        )}
        <button type="button" className="sidebar__collapse" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          <span className="sidebar__label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
