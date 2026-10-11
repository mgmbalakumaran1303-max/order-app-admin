import { PERMISSIONS, timeRangeHours } from '../../utils/constants';
import { notFound, nowIso, respond, userName, validationError, writeAudit } from '../db';
import { assertPermission, currentMockUser } from './authService';
import { includesText, matchesLocation } from './helpers';

// Relative channel weights used to split a restaurant's order count by channel.
export const CHANNEL_WEIGHTS = { direct: 0.3, lieferando: 0.3, wolt: 0.2, uber_eats: 0.15, whatsapp: 0.05 };

// Approximate multiplier from "orders today" to the selected period.
export const RANGE_MULTIPLIER = { '24h': 1, '7d': 6.7, '30d': 28.4 };

export function channelSplit(restaurant) {
  const total = restaurant.channels.reduce((sum, c) => sum + CHANNEL_WEIGHTS[c], 0);
  return Object.fromEntries(restaurant.channels.map((c) => [c, CHANNEL_WEIGHTS[c] / total]));
}

export function ordersInPeriod(restaurant, timeRange = '24h', channel) {
  const base = restaurant.ordersToday * (RANGE_MULTIPLIER[timeRange] ?? 1);
  if (!channel || channel === 'all') return Math.round(base);
  return Math.round(base * (channelSplit(restaurant)[channel] ?? 0));
}

// Hourly shape of a typical delivery day (index = hour of day).
const DAY_CURVE = [1, 0.5, 0.3, 0.2, 0.2, 0.3, 0.6, 1, 1.5, 2, 3, 5.5, 8, 7, 4, 3, 3.5, 5.5, 8.5, 9, 7.5, 5, 3, 1.8];
const WEEK_CURVE = [0.9, 0.85, 0.9, 1, 1.2, 1.35, 1.2]; // Mon..Sun

/** Builds a volume series for the period that sums to `total`. */
export function volumeSeries(total, timeRange) {
  const now = new Date();
  if (timeRange === '24h') {
    const curveSum = DAY_CURVE.reduce((a, b) => a + b, 0);
    return Array.from({ length: 24 }, (_, i) => {
      const hour = (now.getHours() - 23 + i + 24) % 24;
      return { label: `${String(hour).padStart(2, '0')}:00`, value: Math.round((total * DAY_CURVE[hour]) / curveSum) };
    });
  }
  const days = timeRangeHours(timeRange) / 24;
  const weights = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
    return { d, w: WEEK_CURVE[(d.getDay() + 6) % 7] };
  });
  const wSum = weights.reduce((a, b) => a + b.w, 0);
  return weights.map(({ d, w }) => ({
    label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    value: Math.round((total * w) / wSum),
  }));
}

function findRestaurant(db, id) {
  const r = db.restaurants.find((x) => x.id.toLowerCase() === String(id).toLowerCase());
  if (!r) throw notFound(`Restaurant ${id}`);
  return r;
}

const openIssuesFor = (db, id) => db.issues.filter((i) => i.status !== 'Resolved' && i.restaurantIds.includes(id)).length;

export const restaurantService = {
  listRestaurants: (filters = {}) =>
    respond((db) =>
      db.restaurants
        .filter((r) => {
          if (!matchesLocation(r, filters)) return false;
          if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false;
          if (filters.channel && filters.channel !== 'all' && !r.channels.includes(filters.channel)) return false;
          const issues = openIssuesFor(db, r.id);
          if (filters.issues === 'with' && issues === 0) return false;
          if (filters.issues === 'without' && issues > 0) return false;
          return includesText([r.name, r.id, r.city], filters.search);
        })
        .map((r) => ({
          id: r.id,
          name: r.name,
          city: r.city,
          address: r.address,
          status: r.status,
          channels: r.channels,
          orders: ordersInPeriod(r, filters.timeRange, filters.channel),
          acceptanceRate: r.acceptanceRate,
          avgOrderTime: r.avgOrderTime,
          openIssues: openIssuesFor(db, r.id),
        }))
    ),

  getRestaurant: (id) =>
    respond((db) => {
      const r = findRestaurant(db, id);
      return {
        ...r,
        openIssues: openIssuesFor(db, r.id),
        config: { ...r.config, lastModifiedByName: userName(r.config.lastModifiedBy) },
      };
    }),

  getOverview: (id, { timeRange = '24h' } = {}) =>
    respond((db) => {
      const r = findRestaurant(db, id);
      const total = ordersInPeriod(r, timeRange);
      const split = channelSplit(r);
      const devices = db.devices.filter((d) => d.restaurantId === r.id);
      const zones = db.deliveryZones.filter((z) => z.restaurantId === r.id);
      const offline = r.status === 'Offline';
      return {
        dataAsOf: r.dataAsOf,
        totalOrders: total,
        volume: total > 0 ? volumeSeries(total, timeRange) : [],
        channelMix: total > 0 ? r.channels.map((c) => ({ channel: c, value: Math.round(total * split[c]) })) : [],
        healthChecks: [
          { id: 'online', label: 'Restaurant online', ok: !offline, detail: offline ? 'No heartbeat for over 3 hours' : `Status: ${r.status}` },
          { id: 'menu', label: 'Menu synchronization', ok: r.menu.syncStatus === 'Synced', detail: `Last sync ${new Date(r.menu.lastSyncAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · ${r.menu.syncStatus}` },
          { id: 'devices', label: 'Device connectivity', ok: devices.every((d) => d.status === 'Online'), detail: `${devices.filter((d) => d.status === 'Online').length} of ${devices.length} devices online` },
          { id: 'zones', label: 'Delivery zones', ok: zones.some((z) => z.active), detail: `${zones.filter((z) => z.active).length} of ${zones.length} zones active` },
          {
            id: 'ai',
            label: 'AI ordering',
            ok: r.ai.warnings.length === 0,
            detail: r.ai.voiceEnabled || r.ai.whatsappEnabled ? (r.ai.warnings[0] ?? 'Available') : 'Not enabled',
          },
        ],
      };
    }),

  updateConfig: (id, patch) =>
    respond((db) => {
      assertPermission(PERMISSIONS.RESTAURANT_CONFIG_WRITE);
      const r = findRestaurant(db, id);
      const allowed = ['autoAccept', 'prepTimeMinutes', 'maxOrdersPer15Min', 'menuSyncIntervalMinutes', 'orderAcceptanceTimeoutSec'];
      const keys = Object.keys(patch);
      if (!keys.length || keys.some((k) => !allowed.includes(k))) throw validationError('Unsupported configuration change.');
      if (patch.prepTimeMinutes !== undefined && !(patch.prepTimeMinutes >= 5 && patch.prepTimeMinutes <= 90)) {
        throw validationError('Preparation time must be between 5 and 90 minutes.');
      }
      Object.assign(r.config, patch, { lastModifiedBy: currentMockUser().id, lastModifiedAt: nowIso() });
      writeAudit({ actorId: currentMockUser().id, action: 'restaurant.config.update', resource: `${r.id} ${r.name}` });
      return { ...r.config, lastModifiedByName: userName(r.config.lastModifiedBy) };
    }),
};

