import { useId } from 'react';

export function Panel({ title, description, actions, children, className = '', bodyClassName = '', as: Tag = 'section' }) {
  const id = useId();
  const headingId = title ? id : undefined;
  return (
    <Tag className={`panel ${className}`} aria-labelledby={headingId}>
      {(title || actions) && (
        <div className="panel__head">
          <div>
            {title && (
              <h2 className="panel__title" id={headingId}>
                {title}
              </h2>
            )}
            {description && <p className="panel__desc">{description}</p>}
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Tag>
  );
}

export function KeyValueList({ items }) {
  return (
    <dl className="kv">
      {items.filter(Boolean).map(([key, value]) => (
        <div className="kv__row" key={key}>
          <dt>{key}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
