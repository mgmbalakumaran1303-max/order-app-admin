import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, MoreHorizontal, Plus, UserCheck, Zap } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { FilterSelect, SearchField, Toolbar } from '../../components/ui/FormControls';
import { SeverityBadge, StatusBadge } from '../../components/ui/Badge';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { AsyncContent, EmptyState, InboxZero, LoadingState } from '../../components/feedback/States';
import { CreateIncidentDialog } from '../../components/dialogs/CreateIncidentDialog';
import { useAuth } from '../../context/AuthContext';
import { useGlobalFilters } from '../../context/FiltersContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { authService, issueService, restaurantService } from '../../services';
import { ISSUE_CATEGORIES, ISSUE_STATUSES, PERMISSIONS, SEVERITIES } from '../../utils/constants';
import { publish, TOPICS } from '../../utils/events';
import { formatRelative } from '../../utils/format';

const SEVERITY_ORDER = Object.fromEntries(SEVERITIES.map((s, i) => [s, i]));
const DEFAULT_LOCAL = { search: '', severity: 'all', status: 'all', category: 'all', restaurantId: 'all', assigneeId: 'all' };

export default function IssueInboxPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, can } = useAuth();
  const { filters: global } = useGlobalFilters();
  const [searchParams] = useSearchParams();
  const [local, setLocal] = useState(() => ({ ...DEFAULT_LOCAL, restaurantId: searchParams.get('restaurant') || 'all' }));
  const [incidentFor, setIncidentFor] = useState(null); // null | {} | issue defaults

  const set = (key) => (value) => setLocal((l) => ({ ...l, [key]: value }));
  const query = { ...local, timeRange: global.timeRange, region: global.region, city: global.city };

  const issues = useAsync(() => issueService.listIssues(query), [JSON.stringify(query)], { topics: [TOPICS.ISSUES] });
  const lookups = useAsync(() => Promise.all([restaurantService.listRestaurants(), authService.listUsers()]), []);
  const [restaurants, users] = lookups.data ?? [[], []];

  const assignToMe = async (issue) => {
    try {
      await issueService.assign(issue.id, user.id);
      toast.success(`${issue.id} assigned to you.`);
      publish(TOPICS.ISSUES);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'id', header: 'Issue ID', sortable: true, render: (r) => <Link to={`/issues/${r.id}`} onClick={(e) => e.stopPropagation()} className="mono">{r.id}</Link> },
      { key: 'title', header: 'Title', sortable: true, render: (r) => <span className="cell-strong">{r.title}</span> },
      { key: 'category', header: 'Category', sortable: true },
      { key: 'severity', header: 'Severity', sortable: true, sortValue: (r) => SEVERITY_ORDER[r.severity], render: (r) => <SeverityBadge severity={r.severity} /> },
      { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      {
        key: 'restaurant',
        header: 'Restaurant',
        sortable: true,
        sortValue: (r) => r.restaurant?.name,
        render: (r) => (
          <>
            {r.restaurant?.name ?? '—'}
            {r.affectedRestaurantCount > 1 && <span className="cell-sub">+{r.affectedRestaurantCount - 1} more</span>}
          </>
        ),
      },
      { key: 'assigneeName', header: 'Assigned to', sortable: true, render: (r) => r.assigneeName ?? <span className="muted">Unassigned</span> },
      { key: 'updatedAt', header: 'Updated', sortable: true, render: (r) => <time dateTime={r.updatedAt}>{formatRelative(r.updatedAt)}</time> },
      {
        key: 'actions',
        header: <span className="sr-only">Actions</span>,
        render: (r) => (
          <DropdownMenu
            label={`Actions for ${r.id}`}
            trigger={(props) => (
              <button {...props} type="button" className="icon-btn icon-btn--ghost" aria-label={`Actions for ${r.id}`}>
                <MoreHorizontal size={16} aria-hidden="true" />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem icon={ExternalLink} onSelect={() => navigate(`/issues/${r.id}`)}>
                  Open issue
                </MenuItem>
                {can(PERMISSIONS.ISSUES_WRITE) && r.assigneeId !== user.id && r.status !== 'Resolved' && (
                  <MenuItem
                    icon={UserCheck}
                    onSelect={() => {
                      close();
                      assignToMe(r);
                    }}
                  >
                    Assign to me
                  </MenuItem>
                )}
                {can(PERMISSIONS.INCIDENTS_WRITE) && (
                  <MenuItem
                    icon={Zap}
                    onSelect={() => {
                      close();
                      setIncidentFor({ title: r.title, severity: r.severity, category: r.category, restaurantId: r.restaurant?.id, relatedIssueId: r.id });
                    }}
                  >
                    Create incident
                  </MenuItem>
                )}
              </>
            )}
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, can]
  );

  const isFiltered = JSON.stringify(local) !== JSON.stringify(DEFAULT_LOCAL);

  return (
    <PageContainer>
      <PageHeader
        title="Issue Inbox"
        description="One place to triage, assign, and resolve platform issues."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setIncidentFor({})} disabled={!can(PERMISSIONS.INCIDENTS_WRITE)} title={can(PERMISSIONS.INCIDENTS_WRITE) ? undefined : 'Your role cannot create incidents'}>
            Create Incident
          </Button>
        }
      />

      <Toolbar count={issues.data ? `${issues.data.length} issues` : undefined}>
        <SearchField value={local.search} onChange={set('search')} placeholder="Search by ID, title, restaurant or category" label="Search issues" />
        <FilterSelect label="Severity" value={local.severity} onChange={set('severity')} allLabel="All severities" options={SEVERITIES} />
        <FilterSelect label="Status" value={local.status} onChange={set('status')} allLabel="All statuses" options={ISSUE_STATUSES} />
        <FilterSelect label="Category" value={local.category} onChange={set('category')} allLabel="All categories" options={ISSUE_CATEGORIES} />
        <FilterSelect label="Restaurant" value={local.restaurantId} onChange={set('restaurantId')} allLabel="All restaurants" options={restaurants.map((r) => ({ value: r.id, label: r.name }))} />
        <FilterSelect label="Assigned to" value={local.assigneeId} onChange={set('assigneeId')} allLabel="Anyone" options={[{ value: 'unassigned', label: 'Unassigned' }, ...users.map((u) => ({ value: u.id, label: u.name }))]} />
        {isFiltered && (
          <button type="button" className="link-btn" onClick={() => setLocal(DEFAULT_LOCAL)}>
            Clear
          </button>
        )}
      </Toolbar>

      <AsyncContent state={issues} loading={<LoadingState variant="table" rows={8} label="Loading issues" />}>
        {(rows) => (
          <DataTable
            caption="Issues"
            columns={columns}
            rows={rows}
            itemLabel="issues"
            resetKey={JSON.stringify(query)}
            onRowClick={(r) => navigate(`/issues/${r.id}`)}
            rowLabel={(r) => `${r.id}: ${r.title}`}
            empty={
              isFiltered ? (
                <EmptyState onReset={() => setLocal(DEFAULT_LOCAL)}>No issues match your search and filters.</EmptyState>
              ) : (
                <InboxZero title="No issues in this period">There are no issues for the selected time range and location.</InboxZero>
              )
            }
          />
        )}
      </AsyncContent>

      {incidentFor && (
        <CreateIncidentDialog defaults={incidentFor} onClose={() => setIncidentFor(null)} onCreated={(inc) => navigate(`/incidents/${inc.id}`)} />
      )}
    </PageContainer>
  );
}
