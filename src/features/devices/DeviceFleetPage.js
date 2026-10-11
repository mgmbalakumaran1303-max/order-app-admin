import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Cpu, Wifi, WifiOff } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { FilterSelect, SearchField, Toolbar } from '../../components/ui/FormControls';
import { MetricCard, MetricGrid } from '../../components/ui/MetricCard';
import { StatusBadge } from '../../components/ui/Badge';
import { KeyValueList } from '../../components/ui/Panel';
import { AsyncContent, EmptyState, LoadingState } from '../../components/feedback/States';
import { Modal } from '../../components/dialogs/Modal';
import { useAsync } from '../../hooks/useAsync';
import { deviceService, restaurantService } from '../../services';
import { DEVICE_STATUSES, DEVICE_TYPES } from '../../utils/constants';
import { formatDateTime, formatRelative } from '../../utils/format';

// Remote screen control is out of scope for version 1 by requirement.

function DeviceDetail({ id, onClose }) {
  const device = useAsync(() => deviceService.getDevice(id), [id]);
  return (
    <Modal title={device.data?.name ?? 'Device'} eyebrow={id} onClose={onClose} size="lg">
      <AsyncContent state={device} loading={<LoadingState rows={4} />}>
        {(d) => (
          <div className="stack">
            <KeyValueList
              items={[
                ['Type', d.type],
                ['Status', <StatusBadge status={d.status} />],
                ['Detail', d.detail],
                ['Last heartbeat', `${formatRelative(d.lastHeartbeatAt)} (${formatDateTime(d.lastHeartbeatAt)})`],
                ['Firmware', d.firmware],
                ['Restaurant', <Link to={`/restaurants/${d.restaurant.id}/devices`} onClick={onClose}>{d.restaurant.name}</Link>],
              ]}
            />
            <div>
              <h3 className="subhead">Connection history</h3>
              <ul className="log-list">
                {d.history.map((h, i) => (
                  <li key={i}>
                    <time dateTime={h.at}>{formatDateTime(h.at)}</time> <span>{h.event}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="subhead">Related issues</h3>
              {d.relatedIssues.length ? (
                <ul className="link-list">
                  {d.relatedIssues.map((i) => (
                    <li key={i.id}>
                      <Link to={`/issues/${i.id}`} onClick={onClose}>
                        {i.id}
                      </Link>
                      <span className="muted">{i.title}</span>
                      <StatusBadge status={i.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No device issues for this restaurant.</p>
              )}
            </div>
          </div>
        )}
      </AsyncContent>
    </Modal>
  );
}

const DEFAULTS = { search: '', type: 'all', status: 'all', lastSeen: 'all' };

export default function DeviceFleetPage() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULTS);
  const restaurantId = params.get('restaurant') || 'all';
  const selected = params.get('device');
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const query = { ...filters, restaurantId };
  const devices = useAsync(() => deviceService.listDevices(query), [JSON.stringify(query)]);
  const fleet = useAsync(() => deviceService.listDevices(), []);
  const restaurants = useAsync(() => restaurantService.listRestaurants(), []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const columns = [
    { key: 'id', header: 'Device ID', sortable: true, render: (d) => <span className="mono">{d.id}</span> },
    { key: 'name', header: 'Name', sortable: true, render: (d) => <span className="cell-strong">{d.name}</span> },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'restaurant', header: 'Restaurant', sortable: true, sortValue: (d) => d.restaurant.name, render: (d) => <Link to={`/restaurants/${d.restaurant.id}/devices`} onClick={(e) => e.stopPropagation()}>{d.restaurant.name}</Link> },
    { key: 'status', header: 'Connection', sortable: true, render: (d) => <StatusBadge status={d.status} /> },
    { key: 'lastHeartbeatAt', header: 'Last heartbeat', sortable: true, render: (d) => formatRelative(d.lastHeartbeatAt) },
    { key: 'firmware', header: 'Firmware', sortable: true, render: (d) => <span className="mono">{d.firmware}</span> },
  ];

  const all = fleet.data ?? [];
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULTS) || restaurantId !== 'all';

  return (
    <PageContainer>
      <PageHeader title="Device Fleet" description="Order tablets and kitchen printers across all restaurants." />
      <MetricGrid>
        <MetricCard icon={Cpu} label="Total devices" value={fleet.data ? all.length : '—'} />
        <MetricCard icon={Wifi} tone="green" label="Online" value={fleet.data ? all.filter((d) => d.status === 'Online').length : '—'} />
        <MetricCard icon={WifiOff} tone="red" label="Offline" value={fleet.data ? all.filter((d) => d.status === 'Offline').length : '—'} />
        <MetricCard icon={AlertTriangle} tone="purple" label="Need attention" value={fleet.data ? all.filter((d) => d.status !== 'Online').length : '—'} sublabel="Offline or warning" />
      </MetricGrid>
      <Toolbar>
        <SearchField value={filters.search} onChange={set('search')} placeholder="Device ID, name or restaurant" label="Search devices" />
        <FilterSelect label="Device type" value={filters.type} onChange={set('type')} allLabel="All types" options={DEVICE_TYPES} />
        <FilterSelect label="Status" value={filters.status} onChange={set('status')} allLabel="All statuses" options={DEVICE_STATUSES} />
        <FilterSelect label="Restaurant" value={restaurantId} onChange={(v) => updateParam('restaurant', v)} allLabel="All restaurants" options={(restaurants.data ?? []).map((r) => ({ value: r.id, label: r.name }))} />
        <FilterSelect
          label="Last seen"
          value={filters.lastSeen}
          onChange={set('lastSeen')}
          allLabel="Any time"
          options={[
            { value: '5m', label: 'Seen in last 5 min' },
            { value: '1h', label: 'Seen in last hour' },
            { value: 'stale', label: 'Not seen for 1 h+' },
          ]}
        />
      </Toolbar>
      <AsyncContent state={devices} loading={<LoadingState variant="table" rows={8} />}>
        {(rows) => (
          <DataTable
            caption="Devices"
            columns={columns}
            rows={rows}
            itemLabel="devices"
            resetKey={JSON.stringify(query)}
            onRowClick={(d) => updateParam('device', d.id)}
            rowLabel={(d) => `View ${d.name}`}
            empty={<EmptyState onReset={isFiltered ? () => { setFilters(DEFAULTS); setParams({}); } : undefined}>No devices match these filters.</EmptyState>}
          />
        )}
      </AsyncContent>
      {selected && <DeviceDetail id={selected} onClose={() => updateParam('device', null)} />}
    </PageContainer>
  );
}
