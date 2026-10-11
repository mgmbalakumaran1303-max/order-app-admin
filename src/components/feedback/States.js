import { AlertOctagon, Clock3, Database, Inbox, Lock, RefreshCw, SearchX } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatDateTime, formatRelative, isStale } from '../../utils/format';

/** Skeleton placeholder sized to the content it stands in for. */
export function LoadingState({ rows = 4, variant = 'list', label = 'Loading' }) {
  return (
    <div className={`skeleton skeleton--${variant}`} role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton__row" />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

function StateBox({ icon: Icon, title, children, action, tone = 'neutral', role }) {
  return (
    <div className={`state state--${tone}`} role={role}>
      <span className="state__icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <h3 className="state__title">{title}</h3>
      {children && <p className="state__text">{children}</p>}
      {action && <div className="state__action">{action}</div>}
    </div>
  );
}

/** Filters/search matched nothing. */
export function EmptyState({ title = 'No matching results', children = 'No items match the current filters.', onReset, resetLabel = 'Clear filters' }) {
  return (
    <StateBox icon={SearchX} title={title} action={onReset && <Button onClick={onReset}>{resetLabel}</Button>}>
      {children}
    </StateBox>
  );
}

/** The request succeeded but there is genuinely nothing recorded yet. */
export function NoDataState({ title = 'No data yet', children = 'There is nothing recorded for this period.', icon = Database, action }) {
  return (
    <StateBox icon={icon} title={title} action={action}>
      {children}
    </StateBox>
  );
}

export function InboxZero({ title, children }) {
  return (
    <StateBox icon={Inbox} title={title}>
      {children}
    </StateBox>
  );
}

export function NoPermissionState({ resource = 'this page' }) {
  return (
    <StateBox icon={Lock} title="You don't have access" tone="warning" role="alert">
      Your role does not include permission to view {resource}. Ask a platform administrator if you need access.
    </StateBox>
  );
}

/** Error from a service call. Never shows stack traces or raw payloads. */
export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  if (error?.code === 'FORBIDDEN') return <NoPermissionState />;
  const notFound = error?.code === 'NOT_FOUND';
  const message = error?.message && typeof error.message === 'string' ? error.message : 'The data could not be loaded.';
  return (
    <StateBox
      icon={AlertOctagon}
      title={notFound ? 'Not found' : title}
      tone="danger"
      role="alert"
      action={onRetry && !notFound && <Button icon={RefreshCw} onClick={onRetry}>Try again</Button>}
    >
      {message}
    </StateBox>
  );
}

/** Banner shown when data is older than the freshness threshold. */
export function StaleDataBanner({ asOf, thresholdMinutes, onRefresh, subject = 'This data' }) {
  if (!asOf || !isStale(asOf, thresholdMinutes)) return null;
  return (
    <div className="banner banner--warning" role="status">
      <Clock3 size={16} aria-hidden="true" />
      <span>
        <strong>Old data.</strong> {subject} was last updated {formatRelative(asOf)} ({formatDateTime(asOf)}) and may not reflect the current state.
      </span>
      {onRefresh && (
        <Button size="sm" icon={RefreshCw} onClick={onRefresh}>
          Refresh
        </Button>
      )}
    </div>
  );
}

/**
 * Renders the right state for an async resource:
 * loading (first load) → error → no data → content.
 */
export function AsyncContent({ state, children, loading, isEmpty, noData, errorTitle }) {
  const { data, error, loading: isLoading, reload } = state;
  if (error) return <ErrorState error={error} onRetry={reload} title={errorTitle} />;
  if (isLoading && data === undefined) return loading ?? <LoadingState />;
  if (data === undefined) return null;
  if (isEmpty?.(data)) return noData ?? <NoDataState />;
  return children(data);
}
