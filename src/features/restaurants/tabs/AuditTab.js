import { DataTable } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/Badge';
import { AsyncContent, LoadingState, NoDataState } from '../../../components/feedback/States';
import { useAsync } from '../../../hooks/useAsync';
import { auditService } from '../../../services';
import { formatDateTime } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

export const auditColumns = [
  { key: 'at', header: 'Timestamp', sortable: true, render: (e) => <time dateTime={e.at}>{formatDateTime(e.at)}</time> },
  { key: 'actorName', header: 'Actor', sortable: true },
  { key: 'action', header: 'Action', sortable: true, render: (e) => <span className="mono">{e.action}</span> },
  { key: 'resource', header: 'Resource' },
  { key: 'result', header: 'Result', sortable: true, render: (e) => <StatusBadge status={e.result} /> },
];

export default function AuditTab() {
  const { restaurant } = useRestaurant();
  const entries = useAsync(() => auditService.listForRestaurant(restaurant.id), [restaurant.id, restaurant.config.lastModifiedAt]);
  return (
    <AsyncContent
      state={entries}
      loading={<LoadingState variant="table" rows={4} />}
      isEmpty={(d) => d.length === 0}
      noData={<NoDataState title="No audit entries">No administrative actions have been recorded for this restaurant.</NoDataState>}
    >
      {(rows) => <DataTable caption="Audit log" columns={auditColumns} rows={rows} itemLabel="entries" initialSort={{ key: 'at', direction: 'desc' }} />}
    </AsyncContent>
  );
}
