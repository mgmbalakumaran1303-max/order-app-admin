import { useRef } from 'react';
import { NavLink } from 'react-router-dom';

/** Route-backed tabs: each tab is a link so the selection survives reloads and history. */
export function TabLinks({ tabs, label }) {
  return (
    <nav className="tabs" aria-label={label}>
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tabs__tab ${isActive ? 'is-active' : ''}`}>
          {t.icon && <t.icon size={14} aria-hidden="true" />}
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Local-state tabs implementing the ARIA tabs pattern. */
export function Tabs({ tabs, value, onChange, label }) {
  const refs = useRef([]);
  const onKeyDown = (e, index) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    const next = (index + delta + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          className={`tabs__tab ${value === t.id ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {t.label}
          {t.count !== undefined && <span className="tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
