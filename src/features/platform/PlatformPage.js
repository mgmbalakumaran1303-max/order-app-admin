import { useState } from 'react';
import { AlertOctagon, Layers, Rocket } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { MetricCard, MetricGrid } from '../../components/ui/MetricCard';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';
import { FilterSelect, Toolbar } from '../../components/ui/FormControls';
import { StatusBadge } from '../../components/ui/Badge';
import { AsyncContent, EmptyState, LoadingState } from '../../components/feedback/States';
import { ConfirmActionDialog } from '../../components/dialogs/ConfirmActionDialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { platformService } from '../../services';
import { PERMISSIONS } from '../../utils/constants';
import { formatDateTime, formatDuration, formatNumber, formatRelative } from '../../utils/format';

// Deliberately no database console, SQL runner or infrastructure controls (out of scope for v1).

export default function PlatformPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [env, setEnv] = useState('all');
  const [jobStatus, setJobStatus] = useState('all');
  const [toggling, setToggling] = useState(null);
  const overview = useAsync(() => platformService.getOverview(), []);
  const flags = useAsync(() => platformService.listFeatureFlags({ environment: env }), [env]);
  const jobs = useAsync(() => platformService.listJobs({ status: jobStatus, environment: env }), [jobStatus, env]);
  const canWrite = can(PERMISSIONS.PLATFORM_WRITE);

  const flagColumns = [
    { key: 'name', header: 'Feature', sortable: true, render: (f) => (<><span className="cell-strong">{f.name}</span><span className="cell-sub mono">{f.key}</span></>) },
    { key: 'environment', header: 'Environment', sortable: true },
    {
      key: 'rollout',
      header: 'Rollout',
      sortable: true,
      render: (f) => (
        <span className="rollout">
          <span className="meter meter--sm" aria-hidden="true">
            <i style={{ width: `${f.rollout}%` }} />
          </span>
          {f.rollout}%
        </span>
      ),
    },
    {
      key: 'enabled',
      header: 'Enabled',
      render: (f) => (
        <label className="switch" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={f.enabled} disabled={!canWrite} onChange={() => setToggling(f)} aria-label={`${f.enabled ? 'Disable' : 'Enable'} ${f.name}`} />
          <span className="switch__track" aria-hidden="true" />
          <span className="sr-only">{f.enabled ? 'On' : 'Off'}</span>
        </label>
      ),
    },
    { key: 'modifiedByName', header: 'Last modified by', render: (f) => (<>{f.modifiedByName}<span className="cell-sub">{formatRelative(f.modifiedAt)}</span></>) },
  ];

  const jobColumns = [
    { key: 'id', header: 'Job ID', render: (j) => <span className="mono">{j.id}</span> },
    { key: 'type', header: 'Type', sortable: true, render: (j) => <span className="mono">{j.type}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (j) => <StatusBadge status={j.status} /> },
    { key: 'environment', header: 'Environment' },
    { key: 'durationSec', header: 'Duration', sortable: true, render: (j) => formatDuration(j.durationSec) },
    { key: 'startedAt', header: 'Started', sortable: true, render: (j) => (j.startedAt ? formatDateTime(j.startedAt) : <span className="muted">Not started</span>) },
    { key: 'error', header: 'Error', render: (j) => (j.error ? <span className="text-danger">{j.error}</span> : <span className="muted">—</span>) },
  ];

  return (
    <PageContainer>
      <PageHeader title="Platform" description="Releases, feature flags, background jobs and queues." />
      <AsyncContent state={overview} loading={<LoadingState variant="dashboard" rows={2} />}>
        {(o) => (
          <>
            <MetricGrid columns={3}>
              <MetricCard icon={Rocket} label="Current release" value={o.release.version} sublabel={`${o.release.commit} · deployed ${formatRelative(o.release.deployedAt)} by ${o.release.deployedBy}`} />
              <MetricCard icon={Layers} tone="purple" label="Queue depth" value={formatNumber(o.queueDepth)} sublabel={o.queues.filter((q) => q.status !== 'Healthy').map((q) => q.name).join(', ') || 'All queues healthy'} />
              <MetricCard icon={AlertOctagon} tone="red" label="Failed jobs" value={o.failedJobs} sublabel="In the job history below" />
            </MetricGrid>
            <Panel title="Queues">
              <ul className="queue-list">
                {o.queues.map((q) => (
                  <li key={q.name}>
                    <span className="mono">{q.name}</span>
                    <span>{formatNumber(q.depth)} messages</span>
                    <span className="muted">{q.consumers} consumers</span>
                    <StatusBadge status={q.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}
      </AsyncContent>
      <Toolbar>
        <FilterSelect label="Environment" value={env} onChange={setEnv} allLabel="All environments" options={['Production', 'Staging']} />
      </Toolbar>
      <Panel title="Feature flags" description={canWrite ? 'Changes require confirmation and are audited.' : 'Read-only for your role.'}>
        <AsyncContent state={flags} loading={<LoadingState variant="table" rows={5} />}>
          {(rows) => <DataTable caption="Feature flags" columns={flagColumns} rows={rows} rowKey={(f) => f.key} itemLabel="flags" empty={<EmptyState>No feature flags in this environment.</EmptyState>} />}
        </AsyncContent>
      </Panel>
      <Panel title="Background jobs" actions={<FilterSelect label="Job status" value={jobStatus} onChange={setJobStatus} allLabel="All statuses" options={['Running', 'Queued', 'Succeeded', 'Failed']} />}>
        <AsyncContent state={jobs} loading={<LoadingState variant="table" rows={5} />}>
          {(rows) => (
            <DataTable caption="Background jobs" columns={jobColumns} rows={rows} itemLabel="jobs" resetKey={`${jobStatus}${env}`} empty={<EmptyState onReset={() => setJobStatus('all')}>No jobs match these filters.</EmptyState>} />
          )}
        </AsyncContent>
      </Panel>
      {toggling && (
        <ConfirmActionDialog
          title={`${toggling.enabled ? 'Disable' : 'Enable'} feature flag`}
          change={`${toggling.name} will be turned ${toggling.enabled ? 'off' : 'on'} (${toggling.rollout}% rollout).`}
          resource={`${toggling.key} · ${toggling.environment}`}
          impact={toggling.environment === 'Production' ? 'Takes effect for production users within about a minute.' : 'Affects the staging environment only.'}
          undo="Toggle the flag back on this page."
          tone={toggling.enabled ? 'danger' : 'primary'}
          confirmLabel={toggling.enabled ? 'Disable' : 'Enable'}
          onClose={() => setToggling(null)}
          onConfirm={async () => {
            const updated = await platformService.setFeatureFlag(toggling.key, !toggling.enabled);
            flags.setData((list) => list.map((f) => (f.key === updated.key ? updated : f)));
            toast.success(`${updated.name} ${updated.enabled ? 'enabled' : 'disabled'}.`);
          }}
        />
      )}
    </PageContainer>
  );
}
