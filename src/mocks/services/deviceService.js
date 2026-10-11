import { notFound, respond } from '../db';
import { includesText, restaurantSummary } from './helpers';

const LAST_SEEN_MINUTES = { '5m': 5, '1h': 60, '24h': 1440 };

export const deviceService = {
  listDevices: ({ type, status, restaurantId, lastSeen, search } = {}) =>
    respond((db) =>
      db.devices
        .filter((d) => {
          if (type && type !== 'all' && d.type !== type) return false;
          if (status && status !== 'all' && d.status !== status) return false;
          if (restaurantId && restaurantId !== 'all' && d.restaurantId !== restaurantId) return false;
          if (lastSeen && lastSeen !== 'all') {
            const age = (Date.now() - new Date(d.lastHeartbeatAt).getTime()) / 60000;
            // "stale" = not seen within an hour
            if (lastSeen === 'stale' ? age <= 60 : age > LAST_SEEN_MINUTES[lastSeen]) return false;
          }
          const r = db.restaurants.find((x) => x.id === d.restaurantId);
          return includesText([d.id, d.name, r?.name], search);
        })
        .map(({ history, ...d }) => ({ ...d, restaurant: restaurantSummary(db.restaurants.find((r) => r.id === d.restaurantId)) }))
    ),

  getDevice: (id) =>
    respond((db) => {
      const d = db.devices.find((x) => x.id === id);
      if (!d) throw notFound(`Device ${id}`);
      return {
        ...d,
        restaurant: restaurantSummary(db.restaurants.find((r) => r.id === d.restaurantId)),
        relatedIssues: db.issues
          .filter((i) => i.category === 'Devices' && i.restaurantIds.includes(d.restaurantId))
          .map(({ id: iid, title, status }) => ({ id: iid, title, status })),
      };
    }),
};
