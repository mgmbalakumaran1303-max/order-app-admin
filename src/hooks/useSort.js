import { useMemo, useState } from 'react';

export function useSort(items = [], initial = { key: null, direction: 'asc' }, accessors = {}) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    if (!sort.key) return items;
    const get = accessors[sort.key] ?? ((row) => row[sort.key]);
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))) * dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sort]);

  const toggle = (key) =>
    setSort((s) => (s.key === key ? { key, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));

  return { sorted, sort, toggle };
}
