import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RequireAuth, RequirePermission } from '../components/layout/RouteGuards';
import { PERMISSIONS } from '../utils/constants';
import CommandCenterPage from '../features/command-center/CommandCenterPage';
import IssueInboxPage from '../features/issues/IssueInboxPage';
import IssueDetailPage from '../features/issues/IssueDetailPage';
import RestaurantDirectoryPage from '../features/restaurants/RestaurantDirectoryPage';
import Restaurant360Layout from '../features/restaurants/Restaurant360Layout';
import OverviewTab from '../features/restaurants/tabs/OverviewTab';
import OrdersTab from '../features/restaurants/tabs/OrdersTab';
import ChannelsTab from '../features/restaurants/tabs/ChannelsTab';
import MenuTab from '../features/restaurants/tabs/MenuTab';
import DeliveryZonesTab from '../features/restaurants/tabs/DeliveryZonesTab';
import DevicesTab from '../features/restaurants/tabs/DevicesTab';
import AiTab from '../features/restaurants/tabs/AiTab';
import ConfigurationTab from '../features/restaurants/tabs/ConfigurationTab';
import AuditTab from '../features/restaurants/tabs/AuditTab';
import OrderTracePage from '../features/order-trace/OrderTracePage';
import DeliveryZonesPage from '../features/delivery-zones/DeliveryZonesPage';
import IncidentWorkspacePage from '../features/incidents/IncidentWorkspacePage';
import IncidentDetailPage from '../features/incidents/IncidentDetailPage';
import IntegrationsPage from '../features/integrations/IntegrationsPage';
import DeviceFleetPage from '../features/devices/DeviceFleetPage';
import AiOperationsPage from '../features/ai-operations/AiOperationsPage';
import PlatformPage from '../features/platform/PlatformPage';
import SecurityAuditPage from '../features/security-audit/SecurityAuditPage';
import NotFoundPage from '../features/not-found/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/command-center" replace />} />
        <Route path="command-center" element={<CommandCenterPage />} />
        <Route path="issues" element={<IssueInboxPage />} />
        <Route path="issues/:issueId" element={<IssueDetailPage />} />
        <Route path="restaurants" element={<RestaurantDirectoryPage />} />
        <Route path="restaurants/:restaurantId" element={<Restaurant360Layout />}>
          <Route index element={<OverviewTab />} />
          <Route path="orders" element={<OrdersTab />} />
          <Route path="channels" element={<ChannelsTab />} />
          <Route path="menu" element={<MenuTab />} />
          <Route path="delivery-zones" element={<DeliveryZonesTab />} />
          <Route path="devices" element={<DevicesTab />} />
          <Route path="ai" element={<AiTab />} />
          <Route path="configuration" element={<ConfigurationTab />} />
          <Route path="audit" element={<AuditTab />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="order-trace" element={<OrderTracePage />} />
        <Route path="delivery-zones" element={<DeliveryZonesPage />} />
        <Route path="incidents" element={<IncidentWorkspacePage />} />
        <Route path="incidents/:incidentId" element={<IncidentDetailPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="devices" element={<DeviceFleetPage />} />
        <Route path="ai-operations" element={<AiOperationsPage />} />
        <Route
          path="platform"
          element={
            <RequirePermission permission={PERMISSIONS.PLATFORM_READ} resource="the Platform page">
              <PlatformPage />
            </RequirePermission>
          }
        />
        <Route
          path="security-audit"
          element={
            <RequirePermission permission={PERMISSIONS.AUDIT_READ} resource="the Security & Audit log">
              <SecurityAuditPage />
            </RequirePermission>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
