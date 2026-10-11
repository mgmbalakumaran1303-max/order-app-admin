import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ExternalLink, MoreHorizontal, Plug, Radio, Store, Wifi } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { FilterSelect, SearchField, Toolbar } from '../../components/ui/FormControls';
import { StatusBadge } from '../../components/ui/Badge';
import { MetricCard, MetricGrid } from '../../components/ui/MetricCard';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { AsyncContent, EmptyState, LoadingState, NoDataState } from '../../components/feedback/States';
import { useGlobalFilters } from '../../context/FiltersContext';
import { useAsync } from '../../hooks/useAsync';
import { restaurantService } from '../../services';
import { channelLabel, RESTAURANT_STATUSES } from '../../utils/constants';
import { formatMinutes, formatNumber, formatPercent } from '../../utils/format';
import { ChannelChips, RestaurantAvatar } from './RestaurantBits';

const DEFAULT_LOCAL = { search: '', status: 'all', issues: 'all' };

export default function RestaurantDirectoryPage() {
  const navigate = useNavigate();
  const { filters: global } = useGlobalFilters();
  const [local, setLocal] = useState(DEFAULT_LOCAL);
  const set = (key) => (value) => setLocal((l) => ({ ...l, [key]: value }));
  const query = { ...local, region: global.region, city: global.city, channel: global.channel, timeRange: global.timeRange };
  const restaurants = useAsync(() => restaurantService.listRestaurants(query), [JSON.stringify(query)]);

  const columns = [
    {
      key: 'name',
      header: 'Restaurant',
      sortable: true,
      render: (r) => (
        <span className="restaurant-cell">
          <RestaurantAvatar name={r.name} />
          <span>
            <Link to={`/restaurants/${r.id}`} onClick={(e) => e.stopPropagation()} className="cell-strong">
              {r.name}
            </Link>
            <span className="cell-sub">{r.address}</span>
          </span>
        </span>
      ),
    },
    { key: 'id', header: 'ID', sortable: true, render: (r) => <span className="mono">{r.id}</span> },
    { key: 'city', header: 'City', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'channels', header: 'Channels', sortValue: (r) => r.channels.length, sortable: true, render: (r) => <ChannelChips channels={r.channels} /> },
    { key: 'orders', header: 'Orders', sortable: true, align: 'right', render: (r) => formatNumber(r.orders) },
    { key: 'acceptanceRate', header: 'Acceptance', sortable: true, align: 'right', render: (r) => formatPercent(r.acceptanceRate) },
    { key: 'avgOrderTime', header: 'Avg. order time', sortable: true, align: 'right', render: (r) => formatMinutes(r.avgOrderTime) },
    {
      key: 'openIssues',
      header: 'Open issues',
      sortable: true,
      align: 'right',
      render: (r) =>
        r.openIssues ? (
          <span className="issue-count">
            <AlertTriangle size={13} aria-hidden="true" /> {r.openIssues}
          </span>
        ) : (
          <span className="muted">0</span>
        ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      render: (r) => (
        <DropdownMenu
          label={`Actions for ${r.name}`}
          trigger={(props) => (
            <button {...props} type="button" className="icon-btn icon-btn--ghost" aria-label={`Actions for ${r.name}`}>
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>
          )}
        >
          {() => (
            <>
              <MenuItem icon={ExternalLink} onSelect={() => navigate(`/restaurants/${r.id}`)}>
                Open Restaurant 360
              </MenuItem>
              <MenuItem icon={Radio} onSelect={() => navigate(`/restaurants/${r.id}/channels`)}>
                View channel status
              </MenuItem>
              <MenuItem icon={AlertTriangle} disabled={!r.openIssues} onSelect={() => navigate(`/issues?restaurant=${r.id}`)}>
                Open related issues
              </MenuItem>
              <MenuItem icon={Plug} onSelect={() => navigate('/integrations')}>
                Integration health
              </MenuItem>
            </>
          )}
        </DropdownMenu>
      ),
    },
  ];

  const isFiltered = JSON.stringify(local) !== JSON.stringify(DEFAULT_LOCAL);

  return (
    <PageContainer>
      <PageHeader title="Restaurants" description="Every restaurant on the platform, with live status and performance." />

      <AsyncContent state={restaurants} loading={<LoadingState variant="table" rows={8} label="Loading restaurants" />}>
        {(rows) => {
          const channels = new Set(rows.flatMap((r) => r.channels));
          return (
            <>
              <MetricGrid>
                <MetricCard icon={Store} label="Restaurants" value={formatNumber(rows.length)} sublabel="Matching filters" />
                <MetricCard icon={Wifi} tone="green" label="Online" value={formatNumber(rows.filter((r) => r.status === 'Online').length)} sublabel="Accepting orders normally" />
                <MetricCard icon={AlertTriangle} tone="red" label="Need attention" value={formatNumber(rows.filter((r) => r.status !== 'Online' || r.openIssues > 0).length)} sublabel="Not online or with open issues" />
                <MetricCard icon={Radio} tone="purple" label="Connected channels" value={formatNumber(channels.size)} sublabel={[...channels].map(channelLabel).join(', ') || '—'} />
              </MetricGrid>

              <Toolbar count={`${rows.length} restaurants`}>
                <SearchField value={local.search} onChange={set('search')} placeholder="Search by name, ID or city" label="Search restaurants" />
                <FilterSelect label="Status" value={local.status} onChange={set('status')} allLabel="All statuses" options={RESTAURANT_STATUSES} />
                <FilterSelect label="Open issues" value={local.issues} onChange={set('issues')} allLabel="Any issue state" options={[{ value: 'with', label: 'With open issues' }, { value: 'without', label: 'Without open issues' }]} />
                {isFiltered && (
                  <button type="button" className="link-btn" onClick={() => setLocal(DEFAULT_LOCAL)}>
                    Clear
                  </button>
                )}
              </Toolbar>

              <DataTable
                caption="Restaurants"
                columns={columns}
                rows={rows}
                itemLabel="restaurants"
                resetKey={JSON.stringify(query)}
                onRowClick={(r) => navigate(`/restaurants/${r.id}`)}
                rowLabel={(r) => `Open ${r.name}`}
                empty={
                  isFiltered ? (
                    <EmptyState onReset={() => setLocal(DEFAULT_LOCAL)}>No restaurants match your search. Try another name or clear the filters.</EmptyState>
                  ) : (
                    <NoDataState title="No restaurants in this area">No restaurants match the global region, city and channel filters.</NoDataState>
                  )
                }
              />
            </>
          );
        }}
      </AsyncContent>
    </PageContainer>
  );
}
