import { notFound, nowIso, respond, validationError, writeAudit } from '../db';
import { currentMockUser } from './authService';
import { restaurantSummary } from './helpers';

function find(db, id) {
  const integration = db.integrations.find((i) => i.id === id);
  if (!integration) throw notFound(`Integration ${id}`);
  return integration;
}

export const integrationService = {
  listIntegrations: () => respond((db) => db.integrations),

  getIntegration: (id) =>
    respond((db) => {
      const integration = find(db, id);
      const affected = db.restaurants.filter((r) =>
        r.channelConnections.some((c) => c.channel === id && c.status !== 'Connected')
      );
      return {
        ...integration,
        connectedRestaurantCount: db.restaurants.filter((r) => r.channels.includes(id)).length,
        affectedRestaurants: affected.map(restaurantSummary),
        relatedIssues: db.issues
          .filter((i) => i.integrationId === id)
          .map(({ id: iid, title, severity, status }) => ({ id: iid, title, severity, status })),
      };
    }),

  /**
   * Mock retry: providers that are down stay down (the failure is upstream),
   * others record a fresh successful sync.
   */
  retryConnection: (id) =>
    respond((db) => {
      const integration = find(db, id);
      if (!integration.supportsRetry) throw validationError(`${integration.name} does not support manual retries.`);
      writeAudit({ actorId: currentMockUser().id, action: 'integration.retry', resource: integration.name, result: integration.status === 'Down' ? 'Failed' : 'Success' });
      if (integration.status === 'Down') {
        integration.errors.unshift({ at: nowIso(), message: 'Manual retry failed: provider still returning HTTP 502' });
        throw validationError(`Retry failed: ${integration.name} is still returning errors.`);
      }
      integration.lastSuccessAt = nowIso();
      return integration;
    }),
};
