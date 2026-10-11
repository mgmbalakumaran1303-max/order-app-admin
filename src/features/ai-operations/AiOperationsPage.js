import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, MessageSquare, Percent, UserRound } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { MetricCard, MetricGrid } from '../../components/ui/MetricCard';
import { Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';
import { FilterSelect, Toolbar } from '../../components/ui/FormControls';
import { StatusBadge } from '../../components/ui/Badge';
import { AsyncContent, EmptyState, LoadingState, NoDataState } from '../../components/feedback/States';
import { MaskedValue } from '../../components/dialogs/RevealPersonalDataDialog';
import { useGlobalFilters } from '../../context/FiltersContext';
import { useAsync } from '../../hooks/useAsync';
import { aiOperationsService } from '../../services';
import { formatDateTime, formatDuration, formatPercent } from '../../utils/format';

const CHANNEL_LABEL = { voice: 'Voice', whatsapp: 'WhatsApp' };

function QualityBar({ label, value, tone }) {
  return (
    <div className="quality">
      <div className="quality__row">
        <span>{label}</span>
        <b>{formatPercent(value, 1)}</b>
      </div>
      <div className={`meter meter--${tone}`} aria-hidden="true">
        <i style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );
}

export default function AiOperationsPage() {
  const { filters } = useGlobalFilters();
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const overview = useAsync(() => aiOperationsService.getOverview({ timeRange: filters.timeRange }), [filters.timeRange]);
  const conversations = useAsync(() => aiOperationsService.listConversations({ channel, status, timeRange: filters.timeRange }), [channel, status, filters.timeRange]);

  const columns = [
    { key: 'id', header: 'Conversation', render: (c) => <span className="mono">{c.id}</span> },
    { key: 'channel', header: 'Channel', render: (c) => CHANNEL_LABEL[c.channel] },
    { key: 'restaurant', header: 'Restaurant', render: (c) => <Link to={`/restaurants/${c.restaurant.id}/ai`}>{c.restaurant.name}</Link> },
    { key: 'status', header: 'Quality', sortable: true, render: (c) => <StatusBadge status={c.status} /> },
    { key: 'failureReason', header: 'Reason', render: (c) => c.failureReason ?? <span className="muted">—</span> },
    { key: 'meta', header: 'Turns / duration', render: (c) => `${c.turns} · ${formatDuration(c.durationSec)}` },
    {
      key: 'contact',
      header: 'Customer contact',
      render: (c) => <MaskedValue masked={c.contactMasked} fieldLabel="customer phone number" resourceLabel={c.id} request={{ resourceType: 'conversation', resourceId: c.id, field: 'phone' }} />,
    },
    { key: 'at', header: 'Time', sortable: true, render: (c) => formatDateTime(c.at) },
    { key: 'issue', header: 'Issue', render: (c) => (c.issueId ? <Link to={`/issues/${c.issueId}`}>{c.issueId}</Link> : <span className="muted">—</span>) },
  ];

  return (
    <PageContainer>
      <PageHeader title="AI Operations" description="Quality of AI-powered voice and WhatsApp ordering. Transcripts are not shown; customer contact details are masked." />
      <AsyncContent state={overview} loading={<LoadingState variant="dashboard" rows={3} />} isEmpty={(d) => d.total === 0} noData={<NoDataState title="No AI conversations">No AI conversations in the selected period.</NoDataState>}>
        {(o) => (
          <>
            <MetricGrid>
              <MetricCard icon={MessageSquare} label="AI conversations" value={o.total} />
              <MetricCard icon={Percent} tone="green" label="Completion rate" value={formatPercent(o.completionRate, 1)} sublabel="Order placed without a human" />
              <MetricCard icon={UserRound} tone="purple" label="Human handoff rate" value={formatPercent(o.handoffRate, 1)} />
              <MetricCard icon={Gauge} tone="blue" label="Avg. response time" value={o.avgResponseMs ? `${o.avgResponseMs} ms` : '—'} />
            </MetricGrid>
            <div className="grid grid--2">
              {o.byChannel.map((c) => (
                <Panel key={c.channel} title={`${CHANNEL_LABEL[c.channel]} ordering quality`} description={`${c.total} conversations`}>
                  {c.total ? (
                    <>
                      <QualityBar label="Completed" value={c.completionRate} tone="success" />
                      <QualityBar label="Handed off to staff" value={c.handoffRate} tone="warning" />
                      <QualityBar label="Failed or flagged" value={c.failedRate} tone="danger" />
                    </>
                  ) : (
                    <p className="muted">No conversations on this channel in the period.</p>
                  )}
                </Panel>
              ))}
            </div>
          </>
        )}
      </AsyncContent>
      <Panel title="Conversation review" description="Metadata only. Revealing contact details requires a reason and is logged.">
        <Toolbar>
          <FilterSelect label="Channel" value={channel} onChange={setChannel} allLabel="All channels" options={[{ value: 'voice', label: 'Voice' }, { value: 'whatsapp', label: 'WhatsApp' }]} />
          <FilterSelect label="Quality status" value={status} onChange={setStatus} allLabel="All outcomes" options={['Completed', 'Handoff', 'Failed', 'Flagged']} />
        </Toolbar>
        <AsyncContent state={conversations} loading={<LoadingState variant="table" rows={6} />}>
          {(rows) => (
            <DataTable
              caption="AI conversations"
              columns={columns}
              rows={rows}
              itemLabel="conversations"
              resetKey={`${channel}${status}`}
              initialSort={{ key: 'at', direction: 'desc' }}
              empty={<EmptyState onReset={() => { setChannel('all'); setStatus('all'); }}>No conversations match these filters.</EmptyState>}
            />
          )}
        </AsyncContent>
      </Panel>
    </PageContainer>
  );
}
