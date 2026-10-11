import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchService } from '../../services';

export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  // Ctrl/⌘+K focuses search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }
    let cancelled = false;
    setStatus('loading');
    const t = setTimeout(() => {
      searchService.search(query).then(
        (r) => {
          if (cancelled) return;
          setResults(r);
          setActive(r.length ? 0 : -1);
          setStatus('done');
        },
        () => !cancelled && setStatus('error')
      );
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const go = (item) => {
    navigate(item.to);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div className="global-search">
      <Search size={15} aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search restaurants, orders, issues and incidents"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Search restaurants, orders, issues…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      <kbd aria-hidden="true">Ctrl K</kbd>
      {showPanel && (
        <div className="global-search__panel">
          {status === 'loading' && <div className="global-search__msg">Searching…</div>}
          {status === 'error' && <div className="global-search__msg">Search is unavailable right now.</div>}
          {status === 'done' && results.length === 0 && <div className="global-search__msg">No results for “{query}”.</div>}
          <ul role="listbox" id={listId}>
            {results.map((r, i) => (
              <li
                key={`${r.type}-${r.id}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'is-active' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(r);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="global-search__type">{r.type}</span>
                <span className="global-search__label">{r.label}</span>
                <span className="global-search__sub">{r.sublabel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
