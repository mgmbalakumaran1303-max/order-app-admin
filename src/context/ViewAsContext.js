import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { viewAsService } from '../services';

const ViewAsContext = createContext(null);

export function ViewAsProvider({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    viewAsService.getActiveSession().then(setSession, () => setSession(null));
  }, []);

  const start = useCallback(async (input) => {
    const s = await viewAsService.start(input);
    setSession(s);
    return s;
  }, []);

  const end = useCallback(async () => {
    await viewAsService.end();
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, start, end }), [session, start, end]);
  return <ViewAsContext.Provider value={value}>{children}</ViewAsContext.Provider>;
}

export function useViewAs() {
  const ctx = useContext(ViewAsContext);
  if (!ctx) throw new Error('useViewAs must be used inside <ViewAsProvider>');
  return ctx;
}
