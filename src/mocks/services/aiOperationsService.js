import { respond } from '../db';
import { restaurantSummary, withinRange } from './helpers';
import { maskPhone } from './orderService';

const pct = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : null);

function stats(list) {
  const total = list.length;
  return {
    total,
    completionRate: pct(list.filter((c) => c.status === 'Completed').length, total),
    handoffRate: pct(list.filter((c) => c.status === 'Handoff').length, total),
    failedRate: pct(list.filter((c) => c.status === 'Failed' || c.status === 'Flagged').length, total),
  };
}

export const aiOperationsService = {
  getOverview: ({ timeRange } = {}) =>
    respond((db) => {
      const list = db.conversations.filter((c) => withinRange(c.at, timeRange));
      return {
        ...stats(list),
        avgResponseMs: list.length ? 820 : null,
        byChannel: ['voice', 'whatsapp'].map((channel) => ({ channel, ...stats(list.filter((c) => c.channel === channel)) })),
      };
    }),

  listConversations: ({ channel, status, timeRange } = {}) =>
    respond((db) =>
      db.conversations
        .filter((c) => (!channel || channel === 'all' || c.channel === channel)
          && (!status || status === 'all' || c.status === status)
          && withinRange(c.at, timeRange))
        .map(({ contact, ...c }) => ({
          ...c,
          contactMasked: maskPhone(contact),
          restaurant: restaurantSummary(db.restaurants.find((r) => r.id === c.restaurantId)),
        }))
    ),
};
