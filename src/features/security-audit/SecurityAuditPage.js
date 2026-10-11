import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { FilterSelect, SearchField, Toolbar } from '../../components/ui/FormControls';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { AsyncContent, EmptyState, LoadingState } from '../../components/feedback/States';
import { useGlobalFilters } from '../../context/FiltersContext';
import { useAsync } from '../../hooks/useAsync';
import { auditService, authService } from '../../services';
import { IS_MOCK } from '../../config/env';
import { formatDateTime } from '../../utils/format';

const ACTION_TYPES = [
  { value: 'restaurant.config', label: 'Configuration changes' },
  { value: 'issue', label: 'Issue updates' },
  { value: 'incident', label: 'Incidents' },
  { value: 'pii', label: 'Sensitive-data access' },
  { value: 'view_as', label: 'View-as-restaurant' },
  { value: 'feature_flag', label: 'Feature flags' },
  { value: 'integration', label: 'Integrations' },
  { value: 'auth', label: 'Login / logout' },
];

const DEFAULTS = { actorId: 'all', action: 'all', resource: '', result: 'all' };

export default function SecurityAuditPage() {
  const { filters: global } = useGlobalFilters();
  const [filters, setFilters] = useState(DEFAULTS);
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const query = { ...filters, timeRange: global.timeRange };
  const entries = useAsync(() => auditService.listEntries(query), [JSON.stringify(query)]);
  const users = useAsync(() => authService.listUsers(), []);

  const columns = [
    { key: 'at', header: 'Timestamp', sortable: true, render: (e) => <time dateTime={e.at}>{formatDateTime(e.at)}</time> },
    { key: 'actorName', header: 'Actor', sortable: true },
    { key: 'action', header: 'Action', sortable: true, render: (e) => <span className="mono">{e.action}</span> },
    { key: 'resource', header: 'Resource', render: (e) => (<>{e.resource}{e.reason && <span className="cell-sub">Reason: {e.reason}</span>}</>) },
    { key: 'ip', header: 'IP address', render: (e) => <span className="mono">{e.ip ?? '—'}</span> },
    { key: 'result', header: 'Result', sortable: true, render: (e) => <StatusBadge status={e.result} /> },
    ...(IS_MOCK ? [{ key: 'source', header: 'Record', render: () => <Badge tone="neutral">Mock</Badge> }] : []),
  ];

  return (
    <PageContainer>
      <PageHeader title="Security & Audit" description="Who did what: administrative actions, sensitive-data access and support sessions." />
      {IS_MOCK && (
        <div className="banner banner--info">
          <FlaskConical size={15} aria-hidden="true" />
          <span>These are mock audit entries generated in the browser. They are not persisted audit records; the authoritative log lives in the backend.</span>
        </div>
      )}
      <Toolbar count={entries.data ? `${entries.data.length} entries` : undefined}>
        <SearchField value={filters.resource} onChange={set('resource')} placeholder="Filter by resource (e.g. R-1002, ISS-1001)" label="Filter by resource" />
        <FilterSelect label="Actor" value={filters.actorId} onChange={set('actorId')} allLabel="All actors" options={(users.data ?? []).map((u) => ({ value: u.id, label: u.name }))} />
        <FilterSelect label="Action type" value={filters.action} onChange={set('action')} allLabel="All actions" options={ACTION_TYPES} />
        <FilterSelect label="Result" value={filters.result} onChange={set('result')} allLabel="All results" options={['Success', 'Failed', 'Denied']} />
      </Toolbar>
      <AsyncContent state={entries} loading={<LoadingState variant="table" rows={8} />}>
        {(rows) => (
          <DataTable
            caption="Audit log"
            columns={columns}
            rows={rows}
            itemLabel="entries"
            pageSize={15}
            resetKey={JSON.stringify(query)}
            initialSort={{ key: 'at', direction: 'desc' }}
            empty={<EmptyState onReset={() => setFilters(DEFAULTS)}>No audit entries match these filters in the selected time range.</EmptyState>}
          />
        )}
      </AsyncContent>
    </PageContainer>
  );
}
