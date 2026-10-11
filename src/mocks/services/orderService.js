import { notFound, respond, validationError } from '../db';
import { restaurantSummary } from './helpers';

const maskName = (name) => name.split(' ').map((part) => `${part[0]}${'•'.repeat(Math.max(part.length - 1, 2))}`).join(' ');
const maskPhone = (phone) => `${phone.slice(0, 4)} •••• ••${phone.slice(-2)}`;

function toListItem(o) {
  return { id: o.id, providerRef: o.providerRef, channel: o.channel, status: o.status, total: o.total, currency: o.currency, createdAt: o.createdAt, restaurantId: o.restaurantId };
}

export const orderService = {
  listOrders: ({ restaurantId, status, channel, search } = {}) =>
    respond((db) =>
      db.orders
        .filter((o) => (!restaurantId || o.restaurantId === restaurantId)
          && (!status || status === 'all' || o.status === status)
          && (!channel || channel === 'all' || o.channel === channel)
          && (!search || [o.id, o.providerRef].some((v) => v.toLowerCase().includes(search.toLowerCase()))))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toListItem)
    ),

  /** Finds an order by internal ID or provider reference. */
  traceOrder: (query) =>
    respond((db) => {
      const q = String(query || '').trim().toLowerCase();
      if (!q) throw validationError('Enter an order ID or provider reference.');
      const o = db.orders.find((x) => x.id.toLowerCase() === q || x.providerRef.toLowerCase() === q);
      if (!o) throw notFound(`Order "${query.trim()}"`);
      return {
        ...toListItem(o),
        restaurant: restaurantSummary(db.restaurants.find((r) => r.id === o.restaurantId)),
        events: [...o.events].sort((a, b) => a.at.localeCompare(b.at)),
        relatedIssueId: o.relatedIssueId,
        // Personal data is masked; revealing it goes through piiService.
        customer: { name: maskName(o.customer.name), phone: maskPhone(o.customer.phone) },
      };
    }),

  sampleOrderIds: () => respond((db) => ['ORD-50001', 'ORD-50002', 'ORD-50003', 'ORD-50004', 'ORD-50005'].filter((id) => db.orders.some((o) => o.id === id))),
};

export { maskPhone };
