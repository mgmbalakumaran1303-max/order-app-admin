import { PERMISSIONS } from '../../utils/constants';
import { notFound, nowIso, respond, validationError, writeAudit } from '../db';
import { assertPermission, currentMockUser } from './authService';

const MIN_REASON_LENGTH = 10;

function resolvePii(db, { resourceType, resourceId, field }) {
  if (resourceType === 'order') {
    const order = db.orders.find((o) => o.id === resourceId);
    if (!order) throw notFound(`Order ${resourceId}`);
    if (field === 'name') return order.customer.name;
    if (field === 'phone') return order.customer.phone;
  }
  if (resourceType === 'conversation' && field === 'phone') {
    const conv = db.conversations.find((c) => c.id === resourceId);
    if (!conv) throw notFound(`Conversation ${resourceId}`);
    return conv.contact;
  }
  throw validationError('This field cannot be revealed.');
}

/** Sensitive-data access. In mock mode the grant and its audit entry are simulated. */
export const piiService = {
  MIN_REASON_LENGTH,
  reveal: ({ resourceType, resourceId, field, reason, durationMinutes = 15 }) =>
    respond((db) => {
      assertPermission(PERMISSIONS.PII_REVEAL);
      if (String(reason || '').trim().length < MIN_REASON_LENGTH) {
        throw validationError(`Give a reason of at least ${MIN_REASON_LENGTH} characters.`, { reason: 'Reason is required.' });
      }
      const value = resolvePii(db, { resourceType, resourceId, field });
      const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
      db.piiGrants.push({ resourceType, resourceId, field, userId: currentMockUser().id, expiresAt });
      writeAudit({ actorId: currentMockUser().id, action: 'pii.reveal', resource: `${resourceId} customer ${field}`, reason: reason.trim() });
      return { value, expiresAt };
    }),
};

export const viewAsService = {
  getActiveSession: () => respond((db) => db.viewAsSession),

  start: ({ restaurantId, reason }) =>
    respond((db) => {
      assertPermission(PERMISSIONS.VIEW_AS_RESTAURANT);
      const restaurant = db.restaurants.find((r) => r.id === restaurantId);
      if (!restaurant) throw validationError('Select a restaurant.', { restaurantId: 'Select a restaurant.' });
      if (String(reason || '').trim().length < 5) {
        throw validationError('Enter a reason or support ticket reference.', { reason: 'A reason or ticket reference is required.' });
      }
      const startedAt = nowIso();
      db.viewAsSession = {
        id: `VAS-${Date.now().toString(36).toUpperCase()}`,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        reason: reason.trim(),
        startedAt,
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
        simulated: true,
      };
      writeAudit({ actorId: currentMockUser().id, action: 'view_as.start', resource: `${restaurant.id} ${restaurant.name}`, reason: reason.trim() });
      return db.viewAsSession;
    }),

  end: () =>
    respond((db) => {
      const session = db.viewAsSession;
      if (session) {
        writeAudit({ actorId: currentMockUser().id, action: 'view_as.end', resource: `${session.restaurantId} ${session.restaurantName}` });
      }
      db.viewAsSession = null;
      return null;
    }),
};
