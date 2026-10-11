import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileSearch, MessageSquarePlus, MoreHorizontal, Plug, Store, UserCheck, Zap } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge, SeverityBadge, StatusBadge } from '../../components/ui/Badge';
import { KeyValueList, Panel } from '../../components/ui/Panel';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { AsyncContent, LoadingState } from '../../components/feedback/States';
import { ConfirmActionDialog } from '../../components/dialogs/ConfirmActionDialog';
import { CreateIncidentDialog } from '../../components/dialogs/CreateIncidentDialog';
import { Field } from '../../components/ui/FormControls';
import { useAuth } from '../../context/AuthContext';
import { usePageCrumb } from '../../context/BreadcrumbContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useMutation } from '../../hooks/useMutation';
import { issueService } from '../../services';
import { channelLabel, PERMISSIONS } from '../../utils/constants';
import { publish, TOPICS } from '../../utils/events';
import { formatCurrency, formatDateTime, formatRelative, formatTime } from '../../utils/format';

function NoteForm({ issueId, onAdded }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const { mutate, pending } = useMutation((t) => issueService.addNote(issueId, t));
  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Write a note before saving.');
      return;
    }
    setError(null);
    try {
      await mutate(text);
      setText('');
      onAdded();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit} className="form" noValidate>
      <Field label="Internal note" error={error} hint="Visible to Control Center staff only.">
        {(props) => <textarea {...props} rows={3} value={text} onChange={(e) => setText(e.target.value)} />}
      </Field>
      <div>
        <Button type="submit" icon={MessageSquarePlus} loading={pending}>
          Add note
        </Button>
      </div>
    </form>
  );
}

export default function IssueDetailPage() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, can } = useAuth();
  const issue = useAsync(() => issueService.getIssue(issueId), [issueId], { topics: [TOPICS.ISSUES] });
  const [pendingStatus, setPendingStatus] = useState(null);
  const [incidentOpen, setIncidentOpen] = useState(false);
  usePageCrumb(issue.data ? `${issue.data.id} · ${issue.data.title}` : null);

  const canWrite = can(PERMISSIONS.ISSUES_WRITE);

  const assignToMe = async () => {
    try {
      await issueService.assign(issueId, user.id);
      toast.success('Issue assigned to you.');
      publish(TOPICS.ISSUES);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <PageContainer>
      <Link to="/issues" className="back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Back to Issue Inbox
      </Link>
      <AsyncContent state={issue} loading={<LoadingState variant="detail" rows={6} label="Loading issue" />}>
        {(data) => (
          <>
            <PageHeader
              eyebrow={data.id}
              title={data.title}
              actions={
                <>
                  {canWrite && data.assigneeId !== user.id && data.status !== 'Resolved' && (
                    <Button icon={UserCheck} onClick={assignToMe}>
                      Assign to me
                    </Button>
                  )}
                  {canWrite && data.allowedTransitions.length > 0 && (
                    <DropdownMenu
                      label="Change status"
                      trigger={(props) => (
                        <Button {...props} variant="primary">
                          Change status
                        </Button>
                      )}
                    >
                      {(close) =>
                        data.allowedTransitions.map((s) => (
                          <MenuItem
                            key={s}
                            onSelect={() => {
                              close();
                              setPendingStatus(s);
                            }}
                          >
                            {s === 'Open' ? 'Reopen' : `Mark as ${s}`}
                          </MenuItem>
                        ))
                      }
                    </DropdownMenu>
                  )}
                  <DropdownMenu
                    label="More actions"
                    trigger={(props) => (
                      <button {...props} type="button" className="icon-btn" aria-label="More actions">
                        <MoreHorizontal size={17} aria-hidden="true" />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem
                          icon={Zap}
                          disabled={!can(PERMISSIONS.INCIDENTS_WRITE)}
                          onSelect={() => {
                            close();
                            setIncidentOpen(true);
                          }}
                        >
                          Create incident
                        </MenuItem>
                        {data.integration && (
                          <MenuItem icon={Plug} onSelect={() => navigate(`/integrations?provider=${data.integration.id}`)}>
                            View integration status
                          </MenuItem>
                        )}
                        {data.relatedOrders[0] && (
                          <MenuItem icon={FileSearch} onSelect={() => navigate(`/order-trace?q=${data.relatedOrders[0].id}`)}>
                            Trace related order
                          </MenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenu>
                </>
              }
            >
              <div className="header-meta">
                <SeverityBadge severity={data.severity} />
                <StatusBadge status={data.status} />
                <span className="muted">Created {formatDateTime(data.createdAt)}</span>
              </div>
            </PageHeader>

            <div className="grid grid--2-1">
              <div className="stack">
                <Panel title="Overview">
                  <p className="prose">{data.description}</p>
                  <KeyValueList
                    items={[
                      ['Category', data.category],
                      ['Severity', <SeverityBadge severity={data.severity} />],
                      ['Status', <StatusBadge status={data.status} />],
                      ['Affected restaurants', data.restaurants.length],
                      ['Assigned to', data.assigneeName ?? 'Unassigned'],
                      ['Created', formatDateTime(data.createdAt)],
                      ['Last updated', `${formatDateTime(data.updatedAt)} (${formatRelative(data.updatedAt)})`],
                    ]}
                  />
                </Panel>
                <Panel title="Activity timeline">
                  <ActivityTimeline items={[...data.activity, ...data.notes.map((n) => ({ at: n.at, text: `Note: ${n.text}`, actor: n.author }))]} />
                </Panel>
                {canWrite && (
                  <Panel title="Add internal note">
                    <NoteForm issueId={data.id} onAdded={() => publish(TOPICS.ISSUES)} />
                  </Panel>
                )}
                <Panel title="Recent logs" description="Most recent first">
                  {data.logs.length ? (
                    <ul className="log-list">
                      {data.logs.map((l, i) => (
                        <li key={i}>
                          <time dateTime={l.at}>{formatTime(l.at)}</time>
                          <Badge tone={l.level === 'ERROR' ? 'danger' : 'warning'}>{l.level}</Badge>
                          <code>{l.message}</code>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No log entries are linked to this issue.</p>
                  )}
                </Panel>
              </div>

              <div className="stack">
                <Panel title="Affected restaurants" description={`${data.restaurants.length} affected`}>
                  <ul className="link-list">
                    {data.restaurants.map((r) => (
                      <li key={r.id}>
                        <Store size={15} aria-hidden="true" />
                        <Link to={`/restaurants/${r.id}`}>{r.name}</Link>
                        <span className="muted">{r.city}</span>
                        <StatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                </Panel>
                <Panel title="Related integration">
                  {data.integration ? (
                    <div className="link-list__single">
                      <Link to={`/integrations?provider=${data.integration.id}`}>{data.integration.name}</Link>
                      <StatusBadge status={data.integration.status} />
                      <p className="muted">Last successful sync {formatRelative(data.integration.lastSuccessAt)}</p>
                    </div>
                  ) : (
                    <p className="muted">No integration linked.</p>
                  )}
                </Panel>
                <Panel title="Related orders">
                  {data.relatedOrders.length ? (
                    <ul className="link-list">
                      {data.relatedOrders.map((o) => (
                        <li key={o.id}>
                          <FileSearch size={15} aria-hidden="true" />
                          <Link to={`/order-trace?q=${o.id}`}>{o.id}</Link>
                          <span className="muted">
                            {channelLabel(o.channel)} · {formatCurrency(o.total)}
                          </span>
                          <StatusBadge status={o.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No orders linked.</p>
                  )}
                </Panel>
                <Panel title="Incidents">
                  {data.incidents.length ? (
                    <ul className="link-list">
                      {data.incidents.map((inc) => (
                        <li key={inc.id}>
                          <Zap size={15} aria-hidden="true" />
                          <Link to={`/incidents/${inc.id}`}>{inc.id}</Link>
                          <span className="muted">{inc.title}</span>
                          <StatusBadge status={inc.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">This issue is not part of an incident.</p>
                  )}
                </Panel>
              </div>
            </div>

            {pendingStatus && (
              <ConfirmActionDialog
                title={`Change status to ${pendingStatus}`}
                change={`Status changes from ${data.status} to ${pendingStatus}.`}
                resource={`${data.id} – ${data.title}`}
                impact={pendingStatus === 'Resolved' ? 'The issue leaves the active queue and stops alerting the on-call team.' : 'Watchers are notified of the new status.'}
                undo="Change the status again from this page."
                confirmLabel="Change status"
                onClose={() => setPendingStatus(null)}
                onConfirm={async () => {
                  await issueService.updateStatus(data.id, pendingStatus);
                  toast.success(`Status changed to ${pendingStatus}.`);
                  publish(TOPICS.ISSUES);
                }}
              />
            )}
            {incidentOpen && (
              <CreateIncidentDialog
                defaults={{ title: data.title, description: data.description, severity: data.severity, category: data.category, restaurantId: data.restaurants[0]?.id, relatedIssueId: data.id }}
                onClose={() => setIncidentOpen(false)}
                onCreated={() => publish(TOPICS.ISSUES)}
              />
            )}
          </>
        )}
      </AsyncContent>
    </PageContainer>
  );
}
