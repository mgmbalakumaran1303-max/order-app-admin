import { useState } from 'react';
import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, ClipboardList, LayoutDashboard, MapPin, MapPinned, MonitorSmartphone, Printer, Radio, ScrollText, Settings, UtensilsCrossed } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { TabLinks } from '../../components/ui/Tabs';
import { AsyncContent, LoadingState, StaleDataBanner } from '../../components/feedback/States';
import { ViewAsRestaurantDialog } from '../../components/dialogs/ViewAsRestaurantDialog';
import { useAuth } from '../../context/AuthContext';
import { usePageCrumb } from '../../context/BreadcrumbContext';
import { useViewAs } from '../../context/ViewAsContext';
import { useAsync } from '../../hooks/useAsync';
import { restaurantService } from '../../services';
import { PERMISSIONS } from '../../utils/constants';
import { RestaurantAvatar } from './RestaurantBits';
import { IS_MOCK } from '../../config/env';

export const RESTAURANT_TABS = [
  { path: '', label: 'Overview', icon: LayoutDashboard },
  { path: 'orders', label: 'Orders', icon: ClipboardList },
  { path: 'channels', label: 'Channels', icon: Radio },
  { path: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { path: 'delivery-zones', label: 'Delivery Zones', icon: MapPinned },
  { path: 'devices', label: 'Devices', icon: Printer },
  { path: 'ai', label: 'AI', icon: Bot },
  { path: 'configuration', label: 'Configuration', icon: Settings },
  { path: 'audit', label: 'Audit', icon: ScrollText },
];

/** Shared header + tab navigation; each tab renders in the <Outlet>. */
export default function Restaurant360Layout() {
  const { restaurantId } = useParams();
  const { can } = useAuth();
  const { session } = useViewAs();
  const restaurant = useAsync(() => restaurantService.getRestaurant(restaurantId), [restaurantId]);
  const [viewAsOpen, setViewAsOpen] = useState(false);
  usePageCrumb(restaurant.data?.name);

  const base = `/restaurants/${restaurantId}`;

  return (
    <div className="page">
      <Link to="/restaurants" className="back-link">
        <ArrowLeft size={14} aria-hidden="true" /> All restaurants
      </Link>
      <AsyncContent state={restaurant} loading={<LoadingState variant="detail" rows={5} label="Loading restaurant" />}>
        {(r) => (
          <>
            <div className="restaurant-hero">
              <RestaurantAvatar name={r.name} size="lg" />
              <div className="restaurant-hero__text">
                <h1>
                  {r.name} <StatusBadge status={r.status} />
                  {IS_MOCK && <span className="sample-chip">Sample data</span>}
                </h1>
                <p>
                  <span className="mono">{r.id}</span>
                  <span aria-hidden="true">·</span>
                  <MapPin size={13} aria-hidden="true" /> {r.address}
                  <span aria-hidden="true">·</span>
                  Connection: <StatusBadge status={r.connection} />
                </p>
              </div>
              <div className="restaurant-hero__actions">
                <Button
                  variant="danger-outline"
                  icon={MonitorSmartphone}
                  onClick={() => setViewAsOpen(true)}
                  disabled={!can(PERMISSIONS.VIEW_AS_RESTAURANT) || Boolean(session)}
                  title={session ? 'End the current view-as session first' : can(PERMISSIONS.VIEW_AS_RESTAURANT) ? undefined : 'Your role cannot view as a restaurant'}
                >
                  View as restaurant
                </Button>
                <Link to={`${base}/configuration`} className="btn btn--secondary btn--md">
                  <Settings size={15} aria-hidden="true" /> Configuration
                </Link>
              </div>
            </div>
            <StaleDataBanner asOf={r.dataAsOf} subject={`Data from ${r.name}`} onRefresh={restaurant.reload} />
            <TabLinks label="Restaurant sections" tabs={RESTAURANT_TABS.map((t) => ({ to: t.path ? `${base}/${t.path}` : base, label: t.label, icon: t.icon, end: !t.path }))} />
            <Outlet context={{ restaurant: r, reloadRestaurant: restaurant.reload, setRestaurant: restaurant.setData }} />
            {viewAsOpen && <ViewAsRestaurantDialog defaultRestaurantId={r.id} onClose={() => setViewAsOpen(false)} />}
          </>
        )}
      </AsyncContent>
    </div>
  );
}

export const useRestaurant = () => useOutletContext();
