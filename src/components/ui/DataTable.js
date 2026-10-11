import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { Pagination } from './Pagination';

/**
 * columns: [{ key, header, render?(row), sortable?, sortValue?(row), align?, width? }]
 * Rows are activated by click or Enter/Space when onRowClick is provided.
 * Interactive elements inside cells should call e.stopPropagation().
 */
export function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  onRowClick,
  rowLabel,
  pageSize = 10,
  caption,
  empty,
  itemLabel = 'results',
  initialSort,
  resetKey,
}) {
  const accessors = Object.fromEntries(columns.filter((c) => c.sortValue).map((c) => [c.key, c.sortValue]));
  const { sorted, sort, toggle } = useSort(rows, initialSort, accessors);
  const { page, setPage, pageCount, pageItems, total } = usePagination(sorted, pageSize, resetKey);

  if (rows.length === 0 && empty) return empty;

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="data-table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sort.key === col.key;
                const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined;
                return (
                  <th key={col.key} scope="col" aria-sort={ariaSort} style={{ width: col.width, textAlign: col.align }}>
                    {col.sortable ? (
                      <button type="button" className="th-sort" onClick={() => toggle(col.key)}>
                        {col.header}
                        {active ? (
                          sort.direction === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />
                        ) : (
                          <ArrowUpDown size={12} aria-hidden="true" className="th-sort__idle" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? 'is-clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align }}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} itemLabel={itemLabel} />
    </div>
  );
}
