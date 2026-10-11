import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services';

// Frontend permission checks only shape the UI. The backend (or the mock
// services, which emulate it) remains the authority and rejects forbidden calls.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true, error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    authService.getCurrentUser().then(
      (user) => setState({ user, loading: false, error: null }),
      (error) => setState({ user: null, loading: false, error })
    );
  }, []);

  useEffect(load, [load]);

  const value = useMemo(
    () => ({
      ...state,
      reload: load,
      setUser: (user) => setState((s) => ({ ...s, user })),
      can: (permission) => Boolean(state.user?.permissions?.includes(permission)),
    }),
    [state, load]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
