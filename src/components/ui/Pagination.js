import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageNumbers(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, total, pageSize, onChange, itemLabel = 'results' }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="pagination">
      <span className="pagination__info">
        Showing {from}–{to} of {total} {itemLabel}
      </span>
      {pageCount > 1 && (
        <nav className="pagination__pages" aria-label="Pagination">
          <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          {pageNumbers(page, pageCount).map((p) =>
            typeof p === 'string' ? (
              <span key={p} className="pagination__gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                type="button"
                key={p}
                className={p === page ? 'is-current' : ''}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            )
          )}
          <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
