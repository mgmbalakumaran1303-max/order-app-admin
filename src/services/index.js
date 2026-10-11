import { IS_MOCK } from '../config/env';
import * as mock from '../mocks/services';
import { createPendingApiService } from './apiClient';

// Service contracts. Every implementation (mock or API) exposes exactly these
// methods; components only ever import from this module.
//
// The backend contract has not been provided yet, so the API implementations
// are pending stubs that reject with a NOT_CONFIGURED error. When an endpoint
// is documented, replace the corresponding stub with a function that calls
// apiRequest() from ./apiClient.
const CONTRACTS = {
  authService: ['getCurrentUser', 'listUsers'],
  commandCenterService: ['getOverview'],
  issueService: ['listIssues', 'getIssue', 'getOpenIssueCount', 'updateStatus', 'assign', 'addNote'],
  restaurantService: ['listRestaurants', 'getRestaurant', 'getOverview', 'updateConfig'],
  orderService: ['listOrders', 'traceOrder', 'sampleOrderIds'],
  deliveryZoneService: ['listZones', 'testAddress'],
  incidentService: ['listIncidents', 'getIncident', 'createIncident', 'updateStatus', 'assignOwner'],
  integrationService: ['listIntegrations', 'getIntegration', 'retryConnection'],
  deviceService: ['listDevices', 'getDevice'],
  aiOperationsService: ['getOverview', 'listConversations'],
  platformService: ['getOverview', 'listFeatureFlags', 'setFeatureFlag', 'listJobs'],
  auditService: ['listEntries', 'listForRestaurant'],
  piiService: ['reveal'],
  viewAsService: ['getActiveSession', 'start', 'end'],
  notificationService: ['listNotifications', 'markAllRead'],
  searchService: ['search'],
};

function select(name) {
  return IS_MOCK ? mock[name] : createPendingApiService(name, CONTRACTS[name]);
}

export const authService = select('authService');
export const commandCenterService = select('commandCenterService');
export const issueService = select('issueService');
export const restaurantService = select('restaurantService');
export const orderService = select('orderService');
export const deliveryZoneService = select('deliveryZoneService');
export const incidentService = select('incidentService');
export const integrationService = select('integrationService');
export const deviceService = select('deviceService');
export const aiOperationsService = select('aiOperationsService');
export const platformService = select('platformService');
export const auditService = select('auditService');
export const piiService = select('piiService');
export const viewAsService = select('viewAsService');
export const notificationService = select('notificationService');
export const searchService = select('searchService');
