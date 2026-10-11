import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MapPin, RefreshCw, Settings, XCircle } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/FormControls';
import { KeyValueList, Panel } from '../../components/ui/Panel';
import { DataTable } from '../../components/ui/DataTable';
import { AsyncContent, ErrorState, LoadingState, NoDataState } from '../../components/feedback/States';
import { useAsync } from '../../hooks/useAsync';
import { useMutation } from '../../hooks/useMutation';
import { deliveryZoneService, restaurantService } from '../../services';
import { formatCurrency } from '../../utils/format';
import { zoneColumns } from '../restaurants/tabs/DeliveryZonesTab';

/**
 * Concentric distance bands around the restaurant. This is a schematic, not
 * a geographic map: the backend does not provide zone boundaries yet.
 */
function ZoneSchematic({ zones, result }) {
  const size = 300;
  const c = size / 2;
  const maxKm = Math.max(...zones.map((z) => z.maxKm), result?.distanceKm ?? 0, 1);
  const scale = (km) => (km / maxKm) * (c - 14);
  const sorted = [...zones].sort((a, b) => b.maxKm - a.maxKm);
  return (
    <figure className="schematic">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Schematic of delivery zones as distance bands around the restaurant">
        {sorted.map((z) => (
          <g key={z.id}>
            <circle cx={c} cy={c} r={scale(z.maxKm)} className={`schematic__band ${z.active ? 'is-active' : 'is-inactive'}`} />
            <text x={c} y={c - scale(z.maxKm) + 13} textAnchor="middle" className="schematic__label">
              {z.name.split(' – ')[0]} · {z.maxKm} km{z.active ? '' : ' (inactive)'}
            </text>
          </g>
        ))}
        <circle cx={c} cy={c} r={5} className="schematic__origin" />
        {result?.distanceKm != null && (
          <g>
            <line x1={c} y1={c} x2={c + scale(result.distanceKm) * 0.707} y2={c - scale(result.distanceKm) * 0.707} className="schematic__ray" />
            <circle cx={c + scale(result.distanceKm) * 0.707} cy={c - scale(result.distanceKm) * 0.707} r={6} className={`schematic__pin ${result.covered ? 'is-covered' : 'is-uncovered'}`} />
          </g>
        )}
      </svg>
      <figcaption>Schematic – distance bands only, not a geographic map. Direction is not meaningful.</figcaption>
    </figure>
  );
}

export default function DeliveryZonesPage() {
  const [params, setParams] = useSearchParams();
  const restaurants = useAsync(() => restaurantService.listRestaurants(), []);
  const restaurantId = params.get('restaurant') || '';
  const zones = useAsync(() => deliveryZoneService.listZones({ restaurantId }), [restaurantId], { enabled: Boolean(restaurantId) });
  const [address, setAddress] = useState('');
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState(null);
  const [testError, setTestError] = useState(null);
  const { mutate, pending } = useMutation((input) => deliveryZoneService.testAddress(input));

  const fieldErrors = {
    restaurant: restaurantId ? null : 'Select a restaurant.',
    address: address.trim() ? null : 'Enter a delivery address.',
  };

  const test = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (fieldErrors.restaurant || fieldErrors.address) return;
    setResult(null);
    setTestError(null);
    try {
      setResult(await mutate({ restaurantId, address }));
    } catch (err) {
      setTestError(err);
    }
  };

  const selectRestaurant = (id) => {
    setResult(null);
    setTestError(null);
    setParams(id ? { restaurant: id } : {});
  };

  const restaurant = restaurants.data?.find((r) => r.id === restaurantId);
  const addressError = (touched && fieldErrors.address) || (testError?.code === 'VALIDATION' ? testError.message : null);

  return (
    <PageContainer>
      <PageHeader title="Delivery Zone Diagnostics" description="Test whether an address is covered and inspect each restaurant's delivery zones." />

      <Panel title="Test an address">
        <form className="zone-test" onSubmit={test} noValidate>
          <Field label="Restaurant" required error={touched ? fieldErrors.restaurant : null}>
            {(props) => (
              <select {...props} value={restaurantId} onChange={(e) => selectRestaurant(e.target.value)}>
                <option value="">{restaurants.loading ? 'Loading…' : 'Select a restaurant'}</option>
                {(restaurants.data ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} – {r.city}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Delivery address" required error={addressError} hint="Street, house number and 5-digit postal code, e.g. Torstraße 1, 10119 Berlin">
            {(props) => <input {...props} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street 1, 10115 Berlin" />}
          </Field>
          <Button type="submit" variant="primary" icon={MapPin} loading={pending}>
            Test Address
          </Button>
        </form>
        {testError && testError.code !== 'VALIDATION' && <ErrorState error={testError} title="The address test could not be run" onRetry={() => test({ preventDefault() {} })} />}
      </Panel>

      {!restaurantId ? (
        <NoDataState icon={MapPin} title="Choose a restaurant">Select a restaurant to see its zones and test addresses against them.</NoDataState>
      ) : (
        <AsyncContent state={zones} loading={<LoadingState variant="detail" rows={4} />} isEmpty={(d) => d.length === 0} noData={<NoDataState title="No zones configured">This restaurant has no delivery zones.</NoDataState>}>
          {(zoneList) => (
            <>
              <div className="grid grid--2-1">
                <Panel title="Coverage" description={restaurant ? `${restaurant.name}, ${restaurant.city}` : undefined}>
                  <ZoneSchematic zones={zoneList} result={result} />
                </Panel>
                <Panel title="Diagnostic result">
                  {!result ? (
                    <p className="muted">Run a test to see whether an address is covered.</p>
                  ) : (
                    <div className={`diagnosis ${result.covered ? 'is-covered' : 'is-uncovered'}`} role="status" aria-label="Diagnostic result">
                      <div className="diagnosis__head">
                        {result.covered ? <CheckCircle2 size={20} aria-hidden="true" /> : <XCircle size={20} aria-hidden="true" />}
                        <b>{result.covered ? 'Address is covered' : 'Address is not covered'}</b>
                      </div>
                      {result.reason && <p>{result.reason}</p>}
                      <KeyValueList
                        items={[
                          ['Address', result.address],
                          ['Matching zone', result.zone ? `${result.zone.name} (${result.zone.id})` : 'None'],
                          ['Delivery fee', result.covered ? formatCurrency(result.zone.fee) : '—'],
                          ['Estimated delivery', result.covered ? result.zone.eta : '—'],
                          ['Distance', result.distanceKm != null ? `${result.distanceKm} km (estimated)` : '—'],
                        ]}
                      />
                    </div>
                  )}
                </Panel>
              </div>
              <Panel
                title="Zones"
                actions={
                  <>
                    <Button size="sm" icon={RefreshCw} onClick={zones.reload} loading={zones.loading}>
                      Refresh
                    </Button>
                    <Link to={`/restaurants/${restaurantId}/delivery-zones`} className="btn btn--secondary btn--sm">
                      <Settings size={14} aria-hidden="true" /> View in Restaurant 360
                    </Link>
                  </>
                }
              >
                <DataTable caption="Delivery zones" columns={zoneColumns} rows={zoneList} itemLabel="zones" />
              </Panel>
            </>
          )}
        </AsyncContent>
      )}
    </PageContainer>
  );
}
