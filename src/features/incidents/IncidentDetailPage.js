import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Store } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SeverityBadge, StatusBadge } from '../../components/ui/Badge';
import { KeyValueList, Panel } from '../../components/ui/Panel';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { Field } from '../../components/ui/FormControls';
import { AsyncContent, LoadingState } from '../../components/feedback/States';
import { ConfirmActionDialog } from '../../components/dialogs/ConfirmActionDialog';
import { useAuth } from '../../context/AuthContext';
import { usePageCrumb } from '../../context/BreadcrumbContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { authService, incidentService } from '../../services';
import { PERMISSIONS } from '../../utils/constants';
import { publish, TOPICS } from '../../utils/events';
import { formatDateTime, formatRelative } from '../../utils/format';

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const incident = useAsync(() => incidentService.getIncident(incidentId), [incidentId], { topics: [TOPICS.INCIDENTS] });
  const users = useAsync(() => authService.listUsers(), []);
  const [nextStatus, setNextStatus] = useState(null);
  usePageCrumb(incident.data ? `${incident.data.id} · ${incident.data.title}` : null);
  const canWrite = can(PERMISSIONS.INCIDENTS_WRITE);

  const assign = async (userId) => {
    try {
      await incidentService.assignOwner(incidentId, userId);
      toast.success('Owner updated.');
      publish(TOPICS.INCIDENTS);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <PageContainer>
      <Link to="/incidents" className="back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Back to Incident Workspace
      </Link>
      <AsyncContent state={incident} loading={<LoadingState variant="detail" rows={5} />}>
        {(inc) => (
          <>
            <PageHeader
              eyebrow={inc.id}
              title={inc.title}
              actions={
                canWrite &&
                inc.allowedTransitions.length > 0 && (
                  <DropdownMenu label="Update status" trigger={(props) => <Button {...props} variant="primary">Update status</Button>}>
                    {(close) =>
                      inc.allowedTransitions.map((s) => (
                        <MenuItem
                          key={s}
                          onSelect={() => {
                            close();
                            setNextStatus(s);
                          }}
                        >
                          {s}
                        </MenuItem>
                      ))
                    }
                  </DropdownMenu>
                )
              }
            >
              <div className="header-meta">
                <SeverityBadge severity={inc.severity} />
                <StatusBadge status={inc.status} />
                <span className="muted">Started {formatDateTime(inc.startedAt)}</span>
              </div>
            </PageHeader>
            <div className="grid grid--2-1">
              <div className="stack">
                <Panel title="Summary">
                  <p className="prose">{inc.description || 'No description provided.'}</p>
                  <KeyValueList
                    items={[
                      ['Affected services', inc.affectedServices.join(', ') || '—'],
                      ['Started', formatDateTime(inc.startedAt)],
                      ['Last updated', formatRelative(inc.updatedAt)],
                      ['Resolved', inc.resolvedAt ? formatDateTime(inc.resolvedAt) : 'Not yet'],
                    ]}
                  />
                </Panel>
                <Panel title="Activity history">
                  <ActivityTimeline items={inc.history} />
                </Panel>
              </div>
              <div className="stack">
                <Panel title="Owner">
                  {canWrite ? (
                    <Field label="Assigned owner">
                      {(props) => (
                        <select {...props} value={inc.ownerId ?? ''} onChange={(e) => e.target.value && assign(e.target.value)} disabled={inc.status === 'Resolved'}>
                          <option value="">Unassigned</option>
                          {(users.data ?? []).map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  ) : (
                    <p>{inc.ownerName ?? 'Unassigned'}</p>
                  )}
                </Panel>
                <Panel title="Related issues">
                  {inc.relatedIssues.length ? (
                    <ul className="link-list">
                      {inc.relatedIssues.map((i) => (
                        <li key={i.id}>
                          <AlertCircle size={15} aria-hidden="true" />
                          <Link to={`/issues/${i.id}`}>{i.id}</Link>
                          <span className="muted">{i.title}</span>
                          <StatusBadge status={i.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No related issues.</p>
                  )}
                </Panel>
                <Panel title="Affected restaurants">
                  {inc.restaurants.length ? (
                    <ul className="link-list">
                      {inc.restaurants.map((r) => (
                        <li key={r.id}>
                          <Store size={15} aria-hidden="true" />
                          <Link to={`/restaurants/${r.id}`}>{r.name}</Link>
                          <StatusBadge status={r.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Platform-wide or not specified.</p>
                  )}
                </Panel>
              </div>
            </div>
            {nextStatus && (
              <ConfirmActionDialog
                title={`Move incident to ${nextStatus}`}
                change={`Status changes from ${inc.status} to ${nextStatus}.`}
                resource={`${inc.id} – ${inc.title}`}
                impact={nextStatus === 'Resolved' ? 'Closes the incident. Resolved incidents cannot be reopened; open a new incident if the problem returns.' : 'Responders and watchers see the new status.'}
                undo={nextStatus === 'Resolved' ? null : 'Update the status again from this page.'}
                confirmLabel="Update status"
                onClose={() => setNextStatus(null)}
                onConfirm={async () => {
                  await incidentService.updateStatus(inc.id, nextStatus);
                  toast.success(`Incident moved to ${nextStatus}.`);
                  publish(TOPICS.INCIDENTS);
                }}
              />
            )}
          </>
        )}
      </AsyncContent>
    </PageContainer>
  );
}
