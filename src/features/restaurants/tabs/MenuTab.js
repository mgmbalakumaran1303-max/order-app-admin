import { Info } from 'lucide-react';
import { KeyValueList, Panel } from '../../../components/ui/Panel';
import { StatusBadge } from '../../../components/ui/Badge';
import { formatDateTime, formatRelative } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

// Read-only: no menu-editing API exists yet.
export default function MenuTab() {
  const { restaurant } = useRestaurant();
  const { menu } = restaurant;
  return (
    <div className="grid grid--2">
      <Panel title="Menu synchronization" actions={<StatusBadge status={menu.syncStatus} />}>
        <KeyValueList
          items={[
            ['Sync status', <StatusBadge status={menu.syncStatus} />],
            ['Last synchronization', `${formatRelative(menu.lastSyncAt)} (${formatDateTime(menu.lastSyncAt)})`],
            ['Menu items', menu.itemCount],
            ['Unavailable items', menu.unavailableItems],
            ['Availability', menu.unavailableItems === 0 ? 'All items available' : `${menu.unavailableItems} items hidden on all channels`],
          ]}
        />
        <p className="muted small">
          <Info size={12} aria-hidden="true" /> Menu content is read-only in the Control Center. Edits are made in the restaurant's menu manager.
        </p>
      </Panel>
      <Panel title="Synchronization errors">
        {menu.errors.length ? (
          <ul className="error-list">
            {menu.errors.map((e, i) => (
              <li key={i}>
                <time dateTime={e.at}>{formatDateTime(e.at)}</time> {e.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No synchronization errors.</p>
        )}
      </Panel>
    </div>
  );
}
