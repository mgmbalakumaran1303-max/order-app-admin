import { Command } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorState, LoadingState, NoPermissionState } from '../feedback/States';

/**
 * Waits for the current user before rendering protected routes. There is no
 * login flow in this repository yet; when one is added, redirect here instead
 * of showing the error state.
 */
export function RequireAuth({ children }) {
  const { user, loading, error, reload } = useAuth();
  if (loading) {
    return (
      <div className="boot">
        <Command size={28} aria-hidden="true" />
        <LoadingState rows={2} label="Loading your session" />
      </div>
    );
  }
  if (error || !user) {
    return (
      <div className="boot">
        <ErrorState error={error} onRetry={reload} title="Could not load your session" />
      </div>
    );
  }
  return children;
}

/** UX-level guard only; the backend must enforce the same permission. */
export function RequirePermission({ permission, resource, children }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <div className="page">
        <NoPermissionState resource={resource} />
      </div>
    );
  }
  return children;
}
