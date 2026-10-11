import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/Badge';
import { AsyncContent, LoadingState, NoDataState } from '../../../components/feedback/States';
import { useAsync } from '../../../hooks/useAsync';
import { deliveryZoneService } from '../../../services';
import { formatCurrency } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

export const zoneColumns = [
  { key: 'id', header: 'Zone ID', render: (z) => <span className="mono">{z.id}</span> },
  { key: 'name', header: 'Zone', render: (z) => <span className="cell-strong">{z.name}</span> },
  { key: 'range', header: 'Distance', render: (z) => `${z.minKm}–${z.maxKm} km` },
  { key: 'active', header: 'Status', render: (z) => <StatusBadge status={z.active ? 'Active' : 'Inactive'} /> },
  { key: 'fee', header: 'Delivery fee', align: 'right', render: (z) => formatCurrency(z.fee) },
  { key: 'minOrder', header: 'Min. order', align: 'right', render: (z) => formatCurrency(z.minOrder) },
  { key: 'eta', header: 'Est. delivery' },
];

export default function DeliveryZonesTab() {
  const { restaurant } = useRestaurant();
  const zones = useAsync(() => deliveryZoneService.listZones({ restaurantId: restaurant.id }), [restaurant.id]);
  return (
    <>
      <div className="section-actions">
        <Link to={`/delivery-zones?restaurant=${restaurant.id}`} className="btn btn--primary btn--md">
          <Stethoscope size={15} aria-hidden="true" /> Open zone diagnostics
        </Link>
      </div>
      <AsyncContent state={zones} loading={<LoadingState variant="table" rows={3} />} isEmpty={(d) => d.length === 0} noData={<NoDataState title="No delivery zones">This restaurant has no delivery zones configured.</NoDataState>}>
        {(rows) => <DataTable caption="Delivery zones" columns={zoneColumns} rows={rows} itemLabel="zones" />}
      </AsyncContent>
    </>
  );
}
