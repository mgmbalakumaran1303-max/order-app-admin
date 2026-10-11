import { createContext, useContext, useEffect, useState } from 'react';

// Lets detail pages replace the trailing breadcrumb (e.g. an ID) with a
// human-readable label once their data has loaded.

const BreadcrumbContext = createContext({ label: null, setLabel: () => {} });

export function BreadcrumbProvider({ children }) {
  const [label, setLabel] = useState(null);
  return <BreadcrumbContext.Provider value={{ label, setLabel }}>{children}</BreadcrumbContext.Provider>;
}

export const useBreadcrumbLabel = () => useContext(BreadcrumbContext).label;

export function usePageCrumb(label) {
  const { setLabel } = useContext(BreadcrumbContext);
  useEffect(() => {
    setLabel(label || null);
    return () => setLabel(null);
  }, [label, setLabel]);
}
