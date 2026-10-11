import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { InfoTooltip } from './Tooltip';

/**
 * change: percentage vs previous period. `goodWhen` says whether an increase
 * is good ("up") or bad ("down", e.g. open issues) so the trend is coloured right.
 */
export function MetricCard({ icon: Icon, label, value, sublabel, change, goodWhen = 'up', tooltip, tone = 'blue' }) {
  const hasChange = change !== null && change !== undefined;
  const up = hasChange && change >= 0;
  const good = hasChange && (goodWhen === 'up' ? up : !up);
  return (
    <div className="metric-card">
      <div className="metric-card__top">
        {Icon && (
          <span className={`metric-card__icon metric-card__icon--${tone}`} aria-hidden="true">
            <Icon size={17} />
          </span>
        )}
        {tooltip && <InfoTooltip text={tooltip} label={`About ${label}`} />}
      </div>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {hasChange ? (
        <div className={`metric-card__change ${good ? 'is-good' : 'is-bad'}`}>
          {up ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
          <span>
            {up ? '+' : ''}
            {change}% <span className="muted">vs previous period</span>
          </span>
        </div>
      ) : (
        sublabel && <div className="metric-card__sub">{sublabel}</div>
      )}
    </div>
  );
}

export function MetricGrid({ children, columns = 4 }) {
  return <div className={`metric-grid metric-grid--${columns}`}>{children}</div>;
}
