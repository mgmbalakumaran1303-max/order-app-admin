import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileSearch } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { FilterSelect, SearchField, Toolbar } from '../../../components/ui/FormControls';
import { StatusBadge } from '../../../components/ui/Badge';
import { AsyncContent, EmptyState, LoadingState, NoDataState } from '../../../components/feedback/States';
import { useAsync } from '../../../hooks/useAsync';
import { orderService } from '../../../services';
import { channelLabel, ORDER_FAILURE_STATUSES, ORDER_LIFECYCLE } from '../../../utils/constants';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

export default function OrdersTab() {
  const { restaurant } = useRestaurant();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', status: 'all', channel: 'all' });
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const orders = useAsync(() => orderService.listOrders({ restaurantId: restaurant.id, ...filters }), [restaurant.id, JSON.stringify(filters)]);
  const filtered = filters.search || filters.status !== 'all' || filters.channel !== 'all';

  const columns = [
    { key: 'id', header: 'Order ID', sortable: true, render: (o) => <span className="mono cell-strong">{o.id}</span> },
    { key: 'providerRef', header: 'Provider ref.', render: (o) => <span className="mono">{o.providerRef}</span> },
    { key: 'channel', header: 'Channel', sortable: true, render: (o) => channelLabel(o.channel) },
    { key: 'status', header: 'Status', sortable: true, render: (o) => <StatusBadge status={o.status} /> },
    { key: 'total', header: 'Total', sortable: true, align: 'right', render: (o) => formatCurrency(o.total) },
    { key: 'createdAt', header: 'Created', sortable: true, render: (o) => formatDateTime(o.createdAt) },
    {
      key: 'trace',
      header: <span className="sr-only">Actions</span>,
      render: (o) => (
        <Link to={`/order-trace?q=${o.id}`} className="link-btn" onClick={(e) => e.stopPropagation()}>
          <FileSearch size={13} aria-hidden="true" /> Trace
        </Link>
      ),
    },
  ];

  return (
    <>
      <Toolbar>
        <SearchField value={filters.search} onChange={set('search')} placeholder="Order ID or provider reference" label="Search orders" />
        <FilterSelect label="Order status" value={filters.status} onChange={set('status')} allLabel="All statuses" options={[...ORDER_LIFECYCLE, 'Delayed', ...ORDER_FAILURE_STATUSES]} />
        <FilterSelect label="Channel" value={filters.channel} onChange={set('channel')} allLabel="All channels" options={restaurant.channels.map((c) => ({ value: c, label: channelLabel(c) }))} />
      </Toolbar>
      <AsyncContent state={orders} loading={<LoadingState variant="table" rows={6} />}>
        {(rows) => (
          <DataTable
            caption={`Orders for ${restaurant.name}`}
            columns={columns}
            rows={rows}
            itemLabel="orders"
            resetKey={JSON.stringify(filters)}
            onRowClick={(o) => navigate(`/order-trace?q=${o.id}`)}
            rowLabel={(o) => `Trace order ${o.id}`}
            empty={
              filtered ? (
                <EmptyState onReset={() => setFilters({ search: '', status: 'all', channel: 'all' })}>No orders match these filters.</EmptyState>
              ) : (
                <NoDataState title="No orders yet">{restaurant.name} has not received any orders.</NoDataState>
              )
            }
          />
        )}
      </AsyncContent>
    </>
  );
}
