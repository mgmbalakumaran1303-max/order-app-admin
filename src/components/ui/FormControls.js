import { useId } from 'react';
import { Search, X } from 'lucide-react';

export function SearchField({ value, onChange, placeholder = 'Search…', label = 'Search', className = '' }) {
  return (
    <div className={`search-field ${className}`}>
      <Search size={15} aria-hidden="true" />
      <input type="search" aria-label={label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="search-field__clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** options: [{ value, label }] or strings. */
export function FilterSelect({ label, value, onChange, options, allLabel, hideLabel = true, className = '' }) {
  const id = useId();
  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className={`filter-select ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'filter-select__label'}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {allLabel && <option value="all">{allLabel}</option>}
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Labelled form field with inline validation message. */
export function Field({ label, error, hint, required, children, htmlFor }) {
  const fallbackId = useId();
  const id = htmlFor || fallbackId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && <span className="field__required" aria-hidden="true"> *</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': describedBy, required })}
      {hint && !error && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Toolbar({ children, count }) {
  return (
    <div className="toolbar" role="search">
      {children}
      {count !== undefined && <span className="toolbar__count">{count}</span>}
    </div>
  );
}
