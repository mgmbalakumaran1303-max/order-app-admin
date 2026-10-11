import { formatDateTime } from '../../utils/format';

/** Vertical chronological list of events: [{ at, text, actor }]. */
export function ActivityTimeline({ items, emptyText = 'No activity yet.' }) {
  if (!items.length) return <p className="muted">{emptyText}</p>;
  const sorted = [...items].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <ol className="activity">
      {sorted.map((item, i) => (
        <li key={`${item.at}-${i}`} className="activity__item">
          <span className="activity__dot" aria-hidden="true" />
          <div>
            <div className="activity__text">{item.text}</div>
            <div className="activity__meta">
              <time dateTime={item.at}>{formatDateTime(item.at)}</time> · {item.actor}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
