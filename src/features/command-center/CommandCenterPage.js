import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, ArrowRight, Clock3, Package, RefreshCw, ShoppingBag, Store } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { MetricCard, MetricGrid } from '../../components/ui/MetricCard';
import { Panel } from '../../components/ui/Panel';
import { SeverityBadge } from '../../components/ui/Badge';
import { BarChart, DonutChart, LineChart, channelColorVar } from '../../components/charts/Charts';
import { AsyncContent, LoadingState, NoDataState, StaleDataBanner } from '../../components/feedback/States';
import { useGlobalFilters } from '../../context/FiltersContext';
import { useAsync } from '../../hooks/useAsync';
import { commandCenterService } from '../../services';
import { channelLabel, TIME_RANGES } from '../../utils/constants';
import { formatMinutes, formatNumber, formatRelative, percentChange } from '../../utils/format';

function RestaurantHealth({ health }) {
  const rows = [
    { key: 'online', label: 'Online', value: health.online, tone: 'success' },
    { key: 'degraded', label: 'Degraded', value: health.degraded, tone: 'warning' },
    { key: 'maintenance', label: 'Maintenance', value: health.maintenance, tone: 'neutral' },
    { key: 'offline', label: 'Offline', value: health.offline, tone: 'danger' },
  ];
  const pct = health.total ? Math.round((health.online / health.total) * 100) : 0;
  return (
    <div className="health">
      <div className="health__score">
        <strong>{pct}%</strong>
        <span>fully online</span>
        <div className="meter" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="health__list">
        {rows.map((r) => (
          <li key={r.key}>
            <span className={`status-dot is-${r.tone}`} aria-hidden="true" />
            <span>{r.label}</span>
            <b>{r.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const { filters } = useGlobalFilters();
  const overview = useAsync(() => commandCenterService.getOverview(filters), [filters.timeRange, filters.region, filters.city, filters.channel]);
  const rangeLabel = TIME_RANGES.find((t) => t.id === filters.timeRange)?.label.toLowerCase();

  return (
    <PageContainer>
      <PageHeader
        title="Command Center"
        description="Your real-time overview of platform health and restaurant operations."
        actions={
          <>
            <Button icon={RefreshCw} onClick={overview.reload} loading={overview.loading && overview.data !== undefined}>
              Refresh
            </Button>
            <Button icon={Activity} onClick={() => navigate('/integrations')}>
              System status
            </Button>
            <Button variant="primary" icon={AlertCircle} onClick={() => navigate('/issues')}>
              View issues
            </Button>
          </>
        }
      />

      <AsyncContent state={overview} loading={<LoadingState variant="dashboard" rows={6} label="Loading dashboard" />}>
        {(data) => (
          <>
            <StaleDataBanner asOf={overview.loadedAt} subject="The dashboard" onRefresh={overview.reload} />
            <div className={`status-strip is-${data.systemStatus === 'All systems operational' ? 'success' : 'danger'}`}>
              <span className="status-dot" aria-hidden="true" />
              <b>{data.systemStatus}</b>
              <span className="muted">Updated {formatRelative(data.generatedAt)}</span>
              <Link to="/integrations" className="status-strip__link">
                View integrations <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <MetricGrid>
              <MetricCard icon={ShoppingBag} label="Total orders" value={formatNumber(data.metrics.totalOrders)} change={percentChange(data.metrics.totalOrders, data.metrics.previousTotalOrders)} tooltip={`Orders received across all channels in the ${rangeLabel}, for the selected region and channel.`} />
              <MetricCard
                icon={Store}
                tone="green"
                label="Active restaurants"
                value={`${formatNumber(data.metrics.activeRestaurants)} / ${formatNumber(data.metrics.totalRestaurants)}`}
                sublabel="Not offline right now"
                tooltip="Restaurants that are online, degraded or in maintenance, out of all restaurants matching the filters."
              />
              <MetricCard icon={AlertCircle} tone="red" label="Open issues" value={formatNumber(data.metrics.openIssues)} change={percentChange(data.metrics.openIssues, data.metrics.previousOpenIssues)} goodWhen="down" tooltip="Issues not yet resolved for restaurants matching the filters." />
              <MetricCard icon={Clock3} tone="purple" label="Average order time" value={formatMinutes(data.metrics.avgOrderTime)} change={percentChange(data.metrics.avgOrderTime, data.metrics.previousAvgOrderTime)} goodWhen="down" tooltip="Mean time from order received to ready for pickup." />
            </MetricGrid>

            <div className="grid grid--dashboard">
              <Panel title="Order volume" description={`Orders per ${filters.timeRange === '24h' ? 'hour' : 'day'}, ${rangeLabel}`}>
                {data.orderVolume.length ? <BarChart data={data.orderVolume} label="Order volume" /> : <NoDataState icon={Package}>No orders in this period for the selected filters.</NoDataState>}
              </Panel>
              <Panel title="Orders by channel" description="Share of orders per ordering channel">
                {data.channelMix.length ? (
                  <DonutChart
                    label="Orders by channel"
                    centerLabel="orders"
                    segments={data.channelMix.map((c) => ({ key: c.channel, label: channelLabel(c.channel), value: c.value, colorVar: channelColorVar(c.channel) }))}
                  />
                ) : (
                  <NoDataState>No channel data for the selected filters.</NoDataState>
                )}
              </Panel>
              <Panel title="Issue trends" description={`${data.metrics.openIssues} open issues now`}>
                <LineChart data={data.issueTrend} label="Open issues over time" valueLabel="Open issues" />
              </Panel>
            </div>

            <div className="grid grid--2-1">
              <Panel
                title="Recent issues"
                description="Latest unresolved issues"
                actions={
                  <Link to="/issues" className="link-btn">
                    View all <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                }
              >
                {data.recentIssues.length ? (
                  <ul className="mini-list">
                    {data.recentIssues.map((i) => (
                      <li key={i.id}>
                        <Link to={`/issues/${i.id}`} className="mini-list__main">
                          <b>{i.title}</b>
                          <span>
                            {i.id} · {i.restaurant?.name ?? 'Platform'} · {formatRelative(i.updatedAt)}
                          </span>
                        </Link>
                        <SeverityBadge severity={i.severity} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <NoDataState title="No open issues">Nothing needs attention for the selected filters.</NoDataState>
                )}
              </Panel>
              <Panel
                title="Restaurant health"
                description={`${data.restaurantHealth.total} restaurants`}
                actions={
                  <Link to="/restaurants" className="link-btn">
                    Directory <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                }
              >
                <RestaurantHealth health={data.restaurantHealth} />
              </Panel>
            </div>
          </>
        )}
      </AsyncContent>
    </PageContainer>
  );
}
