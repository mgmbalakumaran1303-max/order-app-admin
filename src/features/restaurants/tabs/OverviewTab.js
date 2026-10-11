import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, Percent, ShoppingBag, XCircle } from 'lucide-react';
import { MetricCard, MetricGrid } from '../../../components/ui/MetricCard';
import { Panel } from '../../../components/ui/Panel';
import { BarChart, DonutChart, channelColorVar } from '../../../components/charts/Charts';
import { AsyncContent, LoadingState, NoDataState } from '../../../components/feedback/States';
import { useGlobalFilters } from '../../../context/FiltersContext';
import { useAsync } from '../../../hooks/useAsync';
import { restaurantService } from '../../../services';
import { channelLabel, TIME_RANGES } from '../../../utils/constants';
import { formatMinutes, formatNumber, formatPercent } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

export default function OverviewTab() {
  const { restaurant } = useRestaurant();
  const { filters } = useGlobalFilters();
  const overview = useAsync(() => restaurantService.getOverview(restaurant.id, { timeRange: filters.timeRange }), [restaurant.id, filters.timeRange]);
  const rangeLabel = TIME_RANGES.find((t) => t.id === filters.timeRange)?.label;

  return (
    <AsyncContent state={overview} loading={<LoadingState variant="dashboard" rows={4} />}>
      {(data) => (
        <>
          <MetricGrid>
            <MetricCard icon={ShoppingBag} label={`Orders (${rangeLabel})`} value={formatNumber(data.totalOrders)} sublabel={`${formatNumber(restaurant.ordersToday)} today`} />
            <MetricCard icon={Percent} tone="green" label="Acceptance rate" value={formatPercent(restaurant.acceptanceRate)} sublabel="Accepted / received" />
            <MetricCard icon={Clock3} tone="purple" label="Avg. preparation time" value={formatMinutes(restaurant.avgPrepTime)} sublabel="Accepted → ready" />
            <MetricCard
              icon={AlertCircle}
              tone="red"
              label="Open issues"
              value={formatNumber(restaurant.openIssues)}
              sublabel={restaurant.openIssues ? <Link to={`/issues?restaurant=${restaurant.id}`}>View issues</Link> : 'Nothing open'}
            />
          </MetricGrid>
          <div className="grid grid--2-1">
            <Panel title="Order volume" description={rangeLabel}>
              {data.volume.length ? (
                <BarChart data={data.volume} label={`Order volume for ${restaurant.name}`} />
              ) : (
                <NoDataState title="No orders yet">{restaurant.name} has not received any orders in this period.</NoDataState>
              )}
            </Panel>
            <Panel title="Channel distribution">
              {data.channelMix.length ? (
                <DonutChart
                  label={`Channel distribution for ${restaurant.name}`}
                  centerLabel="orders"
                  size={130}
                  segments={data.channelMix.map((c) => ({ key: c.channel, label: channelLabel(c.channel), value: c.value, colorVar: channelColorVar(c.channel) }))}
                />
              ) : (
                <NoDataState>No channel data in this period.</NoDataState>
              )}
            </Panel>
          </div>
          <Panel title="Health checks">
            <ul className="checks">
              {data.healthChecks.map((c) => (
                <li key={c.id} className={c.ok ? 'is-ok' : 'is-fail'}>
                  {c.ok ? <CheckCircle2 size={18} aria-hidden="true" /> : <XCircle size={18} aria-hidden="true" />}
                  <div>
                    <b>{c.label}</b>
                    <span>{c.detail}</span>
                  </div>
                  <span className="checks__result">{c.ok ? 'Passing' : 'Needs attention'}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </AsyncContent>
  );
}
