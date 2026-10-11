import { CHANNELS, timeRangeHours } from '../../utils/constants';
import { nowIso, respond } from '../db';
import { matchesLocation, restaurantSummary } from './helpers';
import { channelSplit, ordersInPeriod, volumeSeries } from './restaurantService';

const ISSUE_TREND_SHAPE = [3, 4, 3, 5, 6, 5, 7, 6, 8, 7, 9, 8];

export const commandCenterService = {
  getOverview: ({ timeRange = '24h', region, city, channel } = {}) =>
    respond((db) => {
      const restaurants = db.restaurants.filter(
        (r) => matchesLocation(r, { region, city }) && (!channel || channel === 'all' || r.channels.includes(channel))
      );
      const ids = new Set(restaurants.map((r) => r.id));
      const timed = restaurants.filter((r) => r.avgOrderTime);
      const avgOrderTime = timed.length ? Math.round(timed.reduce((s, r) => s + r.avgOrderTime, 0) / timed.length) : null;

      const relevantIssues = db.issues.filter((i) => i.restaurantIds.some((id) => ids.has(id)));
      const openIssues = relevantIssues.filter((i) => i.status !== 'Resolved');

      const channelTotals = {};
      restaurants.forEach((r) => {
        const total = ordersInPeriod(r, timeRange);
        Object.entries(channelSplit(r)).forEach(([c, share]) => {
          if (channel && channel !== 'all' && c !== channel) return;
          channelTotals[c] = (channelTotals[c] ?? 0) + Math.round(total * share);
        });
      });
      // Channel totals are the source of truth so the metric and donut always agree.
      const channelMix = CHANNELS.filter((c) => channelTotals[c.id] !== undefined).map((c) => ({ channel: c.id, value: channelTotals[c.id] }));
      const totalOrders = channelMix.reduce((sum, c) => sum + c.value, 0);

      const hours = timeRangeHours(timeRange);
      const scale = Math.max(openIssues.length, 1) / 9;
      const issueTrend = ISSUE_TREND_SHAPE.map((v, i) => {
        const at = new Date(Date.now() - ((ISSUE_TREND_SHAPE.length - 1 - i) * hours * 3600000) / ISSUE_TREND_SHAPE.length);
        return {
          label: hours <= 24 ? at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : at.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          value: Math.round(v * scale),
        };
      });
      issueTrend[issueTrend.length - 1].value = openIssues.length;

      const count = (status) => restaurants.filter((r) => r.status === status).length;

      return {
        generatedAt: nowIso(),
        metrics: {
          totalOrders,
          previousTotalOrders: Math.round(totalOrders / 1.082),
          activeRestaurants: restaurants.filter((r) => r.status !== 'Offline').length,
          totalRestaurants: restaurants.length,
          openIssues: openIssues.length,
          previousOpenIssues: openIssues.length + 2,
          avgOrderTime,
          previousAvgOrderTime: avgOrderTime ? avgOrderTime + 2 : null,
        },
        orderVolume: totalOrders > 0 ? volumeSeries(totalOrders, timeRange) : [],
        channelMix,
        issueTrend,
        recentIssues: [...openIssues]
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 5)
          .map((i) => ({
            id: i.id,
            title: i.title,
            severity: i.severity,
            updatedAt: i.updatedAt,
            restaurant: restaurantSummary(db.restaurants.find((r) => r.id === i.restaurantIds[0])),
          })),
        restaurantHealth: {
          online: count('Online'),
          degraded: count('Degraded'),
          maintenance: count('Maintenance'),
          offline: count('Offline'),
          total: restaurants.length,
        },
        systemStatus: db.integrations.some((i) => i.status === 'Down')
          ? 'Major outage'
          : db.integrations.some((i) => i.status === 'Degraded')
            ? 'Partial degradation'
            : 'All systems operational',
      };
    }),
};
