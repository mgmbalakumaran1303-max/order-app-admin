import { Link } from 'react-router-dom';
import { DataTable } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/Badge';
import { AsyncContent, LoadingState, NoDataState } from '../../../components/feedback/States';
import { useAsync } from '../../../hooks/useAsync';
import { deviceService } from '../../../services';
import { formatRelative } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

export default function DevicesTab() {
  const { restaurant } = useRestaurant();
  const devices = useAsync(() => deviceService.listDevices({ restaurantId: restaurant.id }), [restaurant.id]);
  const columns = [
    { key: 'name', header: 'Device', render: (d) => <span className="cell-strong">{d.name}</span> },
    { key: 'id', header: 'ID', render: (d) => <span className="mono">{d.id}</span> },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Connectivity', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'detail', header: 'Status detail' },
    { key: 'lastHeartbeatAt', header: 'Last heartbeat', render: (d) => formatRelative(d.lastHeartbeatAt) },
    { key: 'firmware', header: 'Firmware', render: (d) => <span className="mono">{d.firmware}</span> },
  ];
  return (
    <>
      <div className="section-actions">
        <Link to={`/devices?restaurant=${restaurant.id}`} className="link-btn">
          Open in Device Fleet
        </Link>
      </div>
      <AsyncContent state={devices} loading={<LoadingState variant="table" rows={3} />} isEmpty={(d) => d.length === 0} noData={<NoDataState title="No devices">No tablets or printers are registered.</NoDataState>}>
        {(rows) => <DataTable caption="Devices" columns={columns} rows={rows} itemLabel="devices" />}
      </AsyncContent>
    </>
  );
}
