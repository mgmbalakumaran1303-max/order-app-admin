import { PERMISSIONS } from '../../utils/constants';
import { respond, userName } from '../db';
import { assertPermission } from './authService';
import { includesText, withinRange } from './helpers';

export const auditService = {
  listEntries: ({ actorId, action, resource, result, timeRange } = {}) =>
    respond((db) => {
      assertPermission(PERMISSIONS.AUDIT_READ);
      return db.auditLog
        .filter((e) => (!actorId || actorId === 'all' || e.actorId === actorId)
          && (!action || action === 'all' || e.action.startsWith(action))
          && (!result || result === 'all' || e.result === result)
          && includesText([e.resource], resource)
          && withinRange(e.at, timeRange))
        .map((e) => ({ ...e, actorName: userName(e.actorId), source: 'mock' }));
    }),

  /** Audit trail for one restaurant, readable without the global audit permission. */
  listForRestaurant: (restaurantId) =>
    respond((db) =>
      db.auditLog
        .filter((e) => e.resource.startsWith(restaurantId))
        .map(({ ip, ...e }) => ({ ...e, actorName: userName(e.actorId), source: 'mock' }))
    ),
};
