import { respond } from '../db';
import { includesText } from './helpers';

export const notificationService = {
  listNotifications: () => respond((db) => db.notifications),
  markAllRead: () =>
    respond((db) => {
      db.notifications.forEach((n) => {
        n.read = true;
      });
      return db.notifications;
    }),
};

export const searchService = {
  /** Global search across restaurants, issues, orders and incidents. */
  search: (query) =>
    respond((db) => {
      const q = String(query || '').trim();
      if (q.length < 2) return [];
      const results = [
        ...db.restaurants.filter((r) => includesText([r.name, r.id, r.city], q)).slice(0, 4)
          .map((r) => ({ type: 'Restaurant', id: r.id, label: r.name, sublabel: `${r.id} · ${r.city}`, to: `/restaurants/${r.id}` })),
        ...db.issues.filter((i) => includesText([i.id, i.title], q)).slice(0, 4)
          .map((i) => ({ type: 'Issue', id: i.id, label: i.title, sublabel: `${i.id} · ${i.severity}`, to: `/issues/${i.id}` })),
        ...db.orders.filter((o) => includesText([o.id, o.providerRef], q)).slice(0, 3)
          .map((o) => ({ type: 'Order', id: o.id, label: o.id, sublabel: `${o.providerRef} · ${o.status}`, to: `/order-trace?q=${encodeURIComponent(o.id)}` })),
        ...db.incidents.filter((i) => includesText([i.id, i.title], q)).slice(0, 3)
          .map((i) => ({ type: 'Incident', id: i.id, label: i.title, sublabel: `${i.id} · ${i.status}`, to: `/incidents/${i.id}` })),
      ];
      return results;
    }),
};
