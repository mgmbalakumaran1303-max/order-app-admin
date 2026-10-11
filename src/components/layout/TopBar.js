import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight, Clock3, FlaskConical, LogOut, Menu, ShieldCheck, UserCog } from 'lucide-react';
import { breadcrumbsFor } from '../../app/navigation';
import { ENVIRONMENT_NAME, IS_MOCK } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { useBreadcrumbLabel } from '../../context/BreadcrumbContext';
import { useGlobalFilters } from '../../context/FiltersContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { notificationService } from '../../services';
import { PERMISSIONS, TIME_RANGES } from '../../utils/constants';
import { formatRelative } from '../../utils/format';
import { DropdownMenu, MenuItem } from '../ui/DropdownMenu';
import { GlobalSearch } from './GlobalSearch';
import { mockControls } from '../../mocks/db';
import { authService as mockAuthService } from '../../mocks/services/authService';

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const override = useBreadcrumbLabel();
  const trail = breadcrumbsFor(pathname);
  if (override && trail.length > 1) trail[trail.length - 1] = { label: override };
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/command-center">Control Center</Link>
        </li>
        {trail.map((c, i) => (
          <li key={`${c.label}-${i}`}>
            <ChevronRight size={13} aria-hidden="true" />
            {c.to && i < trail.length - 1 ? (
              <Link to={c.to}>{c.label}</Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EnvironmentBadge() {
  return (
    <span className="env-badges">
      <span className={`env-badge env-badge--${ENVIRONMENT_NAME.toLowerCase()}`} title={`Environment: ${ENVIRONMENT_NAME}`}>
        <span className="live-dot" aria-hidden="true" />
        {ENVIRONMENT_NAME}
      </span>
      {IS_MOCK && (
        <span className="env-badge env-badge--mock" title="All data on screen is sample data. Nothing is read from or written to production.">
          <FlaskConical size={12} aria-hidden="true" />
          <span className="env-badge__text">Mock data</span>
        </span>
      )}
    </span>
  );
}

export function TimeRangeSelector() {
  const { filters, setFilter } = useGlobalFilters();
  return (
    <label className="time-range">
      <Clock3 size={14} aria-hidden="true" />
      <span className="sr-only">Time range</span>
      <select value={filters.timeRange} onChange={(e) => setFilter('timeRange', e.target.value)}>
        {TIME_RANGES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NotificationMenu() {
  const navigate = useNavigate();
  const notifications = useAsync(() => notificationService.listNotifications(), []);
  const list = notifications.data ?? [];
  const unread = list.filter((n) => !n.read).length;

  return (
    <DropdownMenu
      label="Notifications"
      trigger={(props) => (
        <button {...props} type="button" className="icon-btn" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
          <Bell size={18} aria-hidden="true" />
          {unread > 0 && <span className="icon-btn__dot" aria-hidden="true" />}
        </button>
      )}
    >
      {(close) => (
        <div className="notifications">
          <div className="menu__header">
            <b>Notifications</b>
            <button
              type="button"
              className="link-btn"
              disabled={!unread}
              onClick={() => notificationService.markAllRead().then((n) => notifications.setData(n))}
            >
              Mark all as read
            </button>
          </div>
          {notifications.error && <div className="menu__empty">Notifications could not be loaded.</div>}
          {!notifications.error && list.length === 0 && <div className="menu__empty">You're all caught up.</div>}
          {list.map((n) => (
            <button
              type="button"
              role="menuitem"
              key={n.id}
              className={`notification ${n.read ? '' : 'is-unread'}`}
              onClick={() => {
                close();
                navigate(n.link);
              }}
            >
              <span className="notification__title">{n.title}</span>
              <span className="notification__time">{formatRelative(n.at)}</span>
            </button>
          ))}
        </div>
      )}
    </DropdownMenu>
  );
}

export function UserProfileMenu() {
  const { user, can, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  if (!user) return null;

  const switchRole = async (role) => {
    const updated = await mockAuthService.switchRole(role);
    setUser(updated);
    toast.info(`Mock role switched to ${role}.`);
  };

  return (
    <DropdownMenu
      label="User menu"
      trigger={(props) => (
        <button {...props} type="button" className="top-user">
          <span className="avatar" aria-hidden="true">
            {user.initials}
          </span>
          <span className="top-user__text">
            {user.name}
            <small>{user.role}</small>
          </span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="menu__header menu__header--stack">
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
          <MenuItem
            icon={ShieldCheck}
            disabled={!can(PERMISSIONS.AUDIT_READ)}
            hint={can(PERMISSIONS.AUDIT_READ) ? undefined : 'Requires audit permission'}
            onSelect={() => {
              close();
              navigate('/security-audit');
            }}
          >
            Security & audit log
          </MenuItem>
          {IS_MOCK && (
            <>
              <div className="menu__section">Mock mode tools</div>
              {mockAuthService.availableRoles().map((role) => (
                <MenuItem
                  key={role}
                  icon={UserCog}
                  disabled={user.role === role}
                  onSelect={() => {
                    close();
                    switchRole(role);
                  }}
                >
                  Act as {role}
                  {user.role === role ? ' (current)' : ''}
                </MenuItem>
              ))}
              <MenuItem
                icon={FlaskConical}
                onSelect={() => {
                  mockControls.simulateErrors = !mockControls.simulateErrors;
                  close();
                  toast.info(mockControls.simulateErrors ? 'Simulating API failures. Refresh any panel to see error states.' : 'API failure simulation turned off.');
                }}
              >
                {mockControls.simulateErrors ? 'Stop simulating API errors' : 'Simulate API errors'}
              </MenuItem>
            </>
          )}
          <MenuItem icon={LogOut} disabled hint="Sign-out is handled by the authentication provider, which is not configured yet.">
            Sign out (not configured)
          </MenuItem>
        </>
      )}
    </DropdownMenu>
  );
}

export function TopBar({ onOpenNav }) {
  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar__menu" onClick={onOpenNav} aria-label="Open navigation">
        <Menu size={18} />
      </button>
      <Breadcrumbs />
      <div className="topbar__actions">
        <EnvironmentBadge />
        <GlobalSearch />
        <TimeRangeSelector />
        <NotificationMenu />
        <UserProfileMenu />
      </div>
    </header>
  );
}
