import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Store, Timer, Zap } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { MetricCard, MetricGrid } from '../../components/ui/MetricCard';
import { SeverityBadge, StatusBadge } from '../../components/ui/Badge';
import { FilterSelect, SearchField, Toolbar } from '../../components/ui/FormControls';
import { Tabs } from '../../components/ui/Tabs';
import { AsyncContent, EmptyState, LoadingState } from '../../components/feedback/States';
import { CreateIncidentDialog } from '../../components/dialogs/CreateIncidentDialog';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { incidentService } from '../../services';
import { PERMISSIONS, SEVERITIES } from '../../utils/constants';
import { TOPICS } from '../../utils/events';
import { formatRelative } from '../../utils/format';

function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function formatHours(minutes) {
  if (minutes === null) return '—';
  return minutes < 60 ? `${Math.round(minutes)} min` : `${Math.round((minutes / 60) * 10) / 10} h`;
}

export default function IncidentWorkspacePage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [view, setView] = useState('active');
  const [severity, setSeverity] = useState('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const all = useAsync(() => incidentService.listIncidents(), [], { topics: [TOPICS.INCIDENTS] });
  const list = useAsync(() => incidentService.listIncidents({ status: view, severity, search }), [view, severity, search], { topics: [TOPICS.INCIDENTS] });

  return (
    <PageContainer>
      <PageHeader
        title="Incident Workspace"
        description="Coordinate the response to major operational problems."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)} disabled={!can(PERMISSIONS.INCIDENTS_WRITE)}>
            Create incident
          </Button>
        }
      />
      {all.data && (
        <MetricGrid columns={3}>
          <MetricCard icon={Zap} tone="red" label="Active incidents" value={all.data.filter((i) => i.status !== 'Resolved').length} sublabel="Not yet resolved" />
          <MetricCard icon={Store} tone="purple" label="Affected restaurants" value={new Set(all.data.filter((i) => i.status !== 'Resolved').flatMap((i) => i.restaurantIds)).size} sublabel="Across active incidents" />
          <MetricCard
            icon={Timer}
            tone="green"
            label="Median resolution time"
            value={formatHours(median(all.data.filter((i) => i.resolvedAt).map((i) => (new Date(i.resolvedAt) - new Date(i.startedAt)) / 60000)))}
            sublabel="Resolved incidents"
          />
        </MetricGrid>
      )}
      <Tabs
        label="Incident status"
        value={view}
        onChange={setView}
        tabs={[
          { id: 'active', label: 'Active' },
          { id: 'Resolved', label: 'Resolved' },
          { id: 'all', label: 'All' },
        ]}
      />
      <Toolbar>
        <SearchField value={search} onChange={setSearch} placeholder="Search incidents or services" label="Search incidents" />
        <FilterSelect label="Severity" value={severity} onChange={setSeverity} allLabel="All severities" options={SEVERITIES} />
      </Toolbar>
      <AsyncContent state={list} loading={<LoadingState variant="cards" rows={3} />}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState onReset={search || severity !== 'all' ? () => { setSearch(''); setSeverity('all'); } : undefined} title="No incidents">
              {view === 'active' ? 'There are no active incidents. 🎉' : 'No incidents match these filters.'}
            </EmptyState>
          ) : (
            <div className="card-grid">
              {rows.map((inc) => (
                <article key={inc.id} className="incident-card">
                  <div className="incident-card__top">
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                  </div>
                  <h2>
                    <Link to={`/incidents/${inc.id}`}>{inc.title}</Link>
                  </h2>
                  <span className="mono muted">{inc.id}</span>
                  <p>{inc.description}</p>
                  <div className="tag-list">
                    {inc.affectedServices.map((s) => (
                      <span key={s} className="tag">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="incident-card__bottom">
                    <span>
                      Owner: <b>{inc.ownerName ?? 'Unassigned'}</b>
                    </span>
                    <span className="muted">Updated {formatRelative(inc.updatedAt)}</span>
                    <Button size="sm" onClick={() => navigate(`/incidents/${inc.id}`)}>
                      Open
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )
        }
      </AsyncContent>
      {creating && <CreateIncidentDialog onClose={() => setCreating(false)} onCreated={(inc) => navigate(`/incidents/${inc.id}`)} />}
    </PageContainer>
  );
}
