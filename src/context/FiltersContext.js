import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Global filters persist across page navigation (and reloads, per tab session).

export const DEFAULT_FILTERS = { timeRange: '24h', region: 'all', city: 'all', channel: 'all' };
const STORAGE_KEY = 'orderflow.globalFilters';

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

const FiltersContext = createContext(null);

export function FiltersProvider({ children, initial }) {
  const [filters, setFilters] = useState(() => initial ?? readStored());

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Storage unavailable (private mode); filters still work for this session.
    }
  }, [filters]);

  const setFilter = useCallback((key, value) => {
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === 'region') next.city = 'all';
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const isDefault = Object.keys(DEFAULT_FILTERS).every((k) => filters[k] === DEFAULT_FILTERS[k]);

  const value = useMemo(() => ({ filters, setFilter, resetFilters, isDefault }), [filters, setFilter, resetFilters, isDefault]);
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useGlobalFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useGlobalFilters must be used inside <FiltersProvider>');
  return ctx;
}
