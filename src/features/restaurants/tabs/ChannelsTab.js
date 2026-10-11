import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { Panel } from '../../../components/ui/Panel';
import { StatusBadge } from '../../../components/ui/Badge';
import { NoDataState } from '../../../components/feedback/States';
import { channelLabel } from '../../../utils/constants';
import { formatDateTime, formatRelative } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

export default function ChannelsTab() {
  const { restaurant } = useRestaurant();
  if (!restaurant.channelConnections.length) return <NoDataState title="No channels configured">This restaurant is not connected to any ordering channel.</NoDataState>;
  return (
    <div className="card-grid">
      {restaurant.channelConnections.map((c) => (
        <Panel
          key={c.channel}
          title={channelLabel(c.channel)}
          actions={<StatusBadge status={c.status} />}
        >
          <dl className="kv kv--compact">
            <div className="kv__row">
              <dt>Last synchronization</dt>
              <dd>
                {formatRelative(c.lastSyncAt)} <span className="muted">({formatDateTime(c.lastSyncAt)})</span>
              </dd>
            </div>
          </dl>
          <h3 className="subhead">Recent errors</h3>
          {c.errors.length ? (
            <ul className="error-list">
              {c.errors.map((e, i) => (
                <li key={i}>
                  <time dateTime={e.at}>{formatRelative(e.at)}</time> {e.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No errors recorded.</p>
          )}
          {c.channel === 'direct' ? (
            <p className="muted small">Direct ordering is managed in Configuration.</p>
          ) : (
            <Link to={`/integrations?provider=${c.channel}`} className="btn btn--secondary btn--sm">
              <Settings2 size={14} aria-hidden="true" /> Manage connection
            </Link>
          )}
        </Panel>
      ))}
    </div>
  );
}
