// Sample dataset for mock mode. Everything is generated relative to the time
// the seed is created so relative timestamps ("5 min ago") stay realistic, and
// a seeded PRNG keeps the numbers stable between reloads.

import { PERMISSIONS } from '../../utils/constants';

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLES = {
  'Platform Admin': ALL_PERMISSIONS,
  'Support Agent': [PERMISSIONS.ISSUES_WRITE, PERMISSIONS.INCIDENTS_WRITE],
};

const USERS = [
  { id: 'u-1', name: 'John Doe', initials: 'JD', role: 'Platform Admin', email: 'john.doe@orderflow.example' },
  { id: 'u-2', name: 'Sarah Klein', initials: 'SK', role: 'Platform Admin', email: 'sarah.klein@orderflow.example' },
  { id: 'u-3', name: 'Mike Ross', initials: 'MR', role: 'Support Agent', email: 'mike.ross@orderflow.example' },
  { id: 'u-4', name: 'Priya Mehta', initials: 'PM', role: 'Support Agent', email: 'priya.mehta@orderflow.example' },
  { id: 'u-5', name: 'Lena Vogel', initials: 'LV', role: 'Support Agent', email: 'lena.vogel@orderflow.example' },
];

const RESTAURANT_ROWS = [
  // id, name, city, address, status, channels, ordersToday, acceptance, avgOrder, avgPrep, connection
  ['R-1001', 'Bella Italia', 'Berlin', 'Torstraße 112, 10119 Berlin', 'Online', ['direct', 'wolt', 'uber_eats', 'lieferando'], 342, 96, 18, 14, 'Connected'],
  ['R-1002', 'Sushi Central', 'Munich', 'Leopoldstraße 41, 80802 München', 'Degraded', ['direct', 'wolt', 'lieferando'], 281, 88, 21, 17, 'Unstable'],
  ['R-1003', 'Burger House', 'Hamburg', 'Schanzenstraße 5, 20357 Hamburg', 'Online', ['direct', 'uber_eats', 'lieferando'], 198, 91, 24, 16, 'Connected'],
  ['R-1004', 'Taco Loco', 'Berlin', 'Oranienstraße 18, 10999 Berlin', 'Offline', ['wolt', 'lieferando'], 0, null, null, null, 'Disconnected'],
  ['R-1005', 'Pizza Palace', 'Cologne', 'Ehrenstraße 70, 50672 Köln', 'Online', ['direct', 'lieferando', 'wolt', 'uber_eats', 'whatsapp'], 412, 98, 16, 12, 'Connected'],
  ['R-1006', 'Green Bowl', 'Frankfurt', 'Berger Straße 88, 60316 Frankfurt', 'Online', ['direct', 'wolt'], 156, 94, 19, 13, 'Connected'],
  ['R-1007', 'Curry Corner', 'Stuttgart', 'Marienstraße 9, 70178 Stuttgart', 'Maintenance', ['direct', 'lieferando', 'whatsapp'], 203, 95, 22, 18, 'Connected'],
  ['R-1008', 'Pasta Point', 'Düsseldorf', 'Kasernenstraße 20, 40213 Düsseldorf', 'Online', ['direct', 'uber_eats', 'lieferando'], 227, 97, 17, 13, 'Connected'],
  ['R-1009', 'Noodle Bar', 'Leipzig', 'Karl-Liebknecht-Straße 30, 04107 Leipzig', 'Online', ['direct', 'wolt', 'whatsapp'], 134, 93, 20, 15, 'Connected'],
  ['R-1010', 'Döner Werk', 'Berlin', 'Kottbusser Damm 77, 10967 Berlin', 'Online', ['lieferando', 'uber_eats', 'whatsapp'], 389, 95, 15, 9, 'Connected'],
  ['R-1011', 'Fischhaus Nord', 'Bremen', 'Schlachte 12, 28195 Bremen', 'Online', ['direct', 'lieferando'], 88, 99, 23, 19, 'Connected'],
  ['R-1012', 'Bao Brothers', 'Hamburg', 'Lange Reihe 54, 20099 Hamburg', 'Degraded', ['direct', 'wolt', 'uber_eats'], 171, 86, 26, 20, 'Unstable'],
  ['R-1013', 'Café Sonnenschein', 'Munich', 'Gärtnerplatz 2, 80469 München', 'Online', ['direct'], 0, null, null, null, 'Connected'],
  ['R-1014', 'Thai Garden', 'Frankfurt', 'Schweizer Straße 15, 60594 Frankfurt', 'Online', ['direct', 'wolt', 'lieferando', 'whatsapp'], 246, 96, 18, 14, 'Connected'],
];

export const CITY_POSTCODE_PREFIXES = {
  Berlin: ['10', '12', '13', '14'],
  Hamburg: ['20', '21', '22'],
  Munich: ['80', '81'],
  Cologne: ['50', '51'],
  Frankfurt: ['60'],
  Stuttgart: ['70'],
  Düsseldorf: ['40'],
  Leipzig: ['04'],
  Bremen: ['28'],
};

export function createSeed(now = Date.now()) {
  const rand = mulberry32(20261011);
  const ago = (minutes) => new Date(now - minutes * 60000).toISOString();
  const pick = (list) => list[Math.floor(rand() * list.length)];

  const users = USERS.map((u) => ({ ...u }));

  const restaurants = RESTAURANT_ROWS.map(
    ([id, name, city, address, status, channels, ordersToday, acceptanceRate, avgOrderTime, avgPrepTime, connection], index) => {
      const offline = status === 'Offline';
      const degraded = status === 'Degraded';
      return {
        id,
        name,
        city,
        address,
        status,
        channels,
        ordersToday,
        acceptanceRate,
        avgOrderTime,
        avgPrepTime,
        connection,
        timezone: 'Europe/Berlin',
        // Offline restaurants stopped reporting hours ago -> "Old data".
        dataAsOf: offline ? ago(190) : ago(1 + (index % 3)),
        channelConnections: channels.map((channel) => {
          const failing = (degraded && channel === 'wolt') || offline;
          return {
            channel,
            status: failing ? (offline ? 'Disconnected' : 'Error') : 'Connected',
            lastSyncAt: failing ? ago(offline ? 190 : 47) : ago(2 + Math.floor(rand() * 6)),
            errors: failing
              ? [
                  {
                    at: ago(offline ? 185 : 12),
                    message: offline ? 'Store heartbeat missing – channel paused by provider' : 'Webhook delivery failed: HTTP 502 from provider',
                  },
                ]
              : [],
          };
        }),
        menu: {
          syncStatus: id === 'R-1007' ? 'Failed' : offline ? 'Pending' : 'Synced',
          lastSyncAt: id === 'R-1007' ? ago(300) : ago(20 + index * 3),
          itemCount: 40 + Math.floor(rand() * 60),
          unavailableItems: id === 'R-1007' ? 6 : Math.floor(rand() * 3),
          errors: id === 'R-1007' ? [{ at: ago(300), message: 'Item "Lamb Rogan Josh" references a deleted modifier group' }] : [],
        },
        ai: {
          voiceEnabled: ['R-1005', 'R-1007', 'R-1009', 'R-1014', 'R-1010'].includes(id),
          whatsappEnabled: channels.includes('whatsapp'),
          successRate: channels.includes('whatsapp') ? 82 + Math.floor(rand() * 14) : null,
          handoffRate: channels.includes('whatsapp') ? 4 + Math.floor(rand() * 10) : null,
          warnings: id === 'R-1007' ? ['Menu sync failure is causing the AI to offer unavailable items.'] : [],
        },
        config: {
          autoAccept: !degraded,
          prepTimeMinutes: avgPrepTime ?? 15,
          maxOrdersPer15Min: 12,
          menuSyncIntervalMinutes: 30,
          orderAcceptanceTimeoutSec: 180,
          lastModifiedBy: 'u-2',
          lastModifiedAt: ago(60 * 24 * (1 + (index % 5))),
        },
      };
    }
  );

  // ---------- Orders ----------
  const providerPrefix = { direct: 'DIR', wolt: 'WOLT', uber_eats: 'UE', lieferando: 'LF', whatsapp: 'WA' };
  const LIFECYCLE_SOURCES = {
    Received: (ch) => (ch === 'direct' ? 'Web shop' : `${providerPrefix[ch]} webhook`),
    Accepted: () => 'Restaurant tablet',
    Preparing: () => 'Restaurant tablet',
    Ready: () => 'Restaurant tablet',
    'Picked Up': () => 'Courier app',
    Delivered: () => 'Courier app',
  };
  const DESCRIPTIONS = {
    Received: 'Order received and validated',
    Accepted: 'Order accepted by the restaurant',
    Preparing: 'Kitchen started preparing the order',
    Ready: 'Order marked ready for pickup',
    'Picked Up': 'Courier picked up the order',
    Delivered: 'Order delivered to the customer',
  };

  let orderSeq = 50000;
  const orders = [];

  function buildOrder({ restaurant, channel, outcome, minutesAgo, total, customerName, delayed = false, issueId }) {
    orderSeq += 1;
    const id = `ORD-${orderSeq}`;
    const steps = ['Received', 'Accepted', 'Preparing', 'Ready', 'Picked Up', 'Delivered'];
    const reachedCount = { Delivered: 6, 'Picked Up': 5, Ready: 4, Preparing: 3, Accepted: 2, Received: 1 }[outcome.reached];
    const events = [];
    let t = minutesAgo;
    steps.slice(0, reachedCount).forEach((step, i) => {
      events.push({
        at: ago(t),
        type: step,
        description: DESCRIPTIONS[step],
        source: LIFECYCLE_SOURCES[step](channel),
      });
      t -= i === 2 ? (delayed ? 24 : 12) : 4;
      if (t < 1) t = 1;
    });
    if (delayed) {
      events.push({ at: ago(Math.max(t, 1)), type: 'Delayed', description: 'Preparation exceeded the promised time by 12 min', source: 'SLA monitor' });
    }
    if (outcome.failure) {
      events.push({ at: ago(Math.max(t, 1)), type: outcome.failure, description: outcome.reason, source: outcome.source });
    }
    const status = outcome.failure || (delayed ? 'Delayed' : outcome.reached);
    const order = {
      id,
      providerRef: `${providerPrefix[channel]}-${Math.floor(rand() * 0xfffff).toString(16).toUpperCase().padStart(5, '0')}`,
      restaurantId: restaurant.id,
      channel,
      status,
      total,
      currency: 'EUR',
      createdAt: events[0].at,
      customer: { name: customerName, phone: `+49 15${Math.floor(rand() * 9)} ${Math.floor(1000000 + rand() * 8999999)}` },
      events,
      relatedIssueId: issueId || null,
    };
    orders.push(order);
    return order;
  }

  const byId = Object.fromEntries(restaurants.map((r) => [r.id, r]));
  // Named orders referenced by issues and quick searches.
  buildOrder({ restaurant: byId['R-1001'], channel: 'wolt', outcome: { reached: 'Delivered' }, minutesAgo: 95, total: 38.4, customerName: 'Anna Schmidt' });
  buildOrder({ restaurant: byId['R-1001'], channel: 'wolt', outcome: { reached: 'Received', failure: 'Failed', reason: 'Order not forwarded to restaurant: Wolt webhook returned HTTP 502', source: 'Integration gateway' }, minutesAgo: 9, total: 24.9, customerName: 'Jonas Weber', issueId: 'ISS-1001' });
  buildOrder({ restaurant: byId['R-1004'], channel: 'lieferando', outcome: { reached: 'Received', failure: 'Cancelled', reason: 'Auto-cancelled: restaurant did not accept within 180 s', source: 'Order engine' }, minutesAgo: 200, total: 19.5, customerName: 'Mia Fischer', issueId: 'ISS-1003' });
  buildOrder({ restaurant: byId['R-1002'], channel: 'lieferando', outcome: { reached: 'Received', failure: 'Rejected', reason: 'Rejected by restaurant: item out of stock', source: 'Restaurant tablet' }, minutesAgo: 40, total: 52.0, customerName: 'Lukas Becker', issueId: 'ISS-1002' });
  buildOrder({ restaurant: byId['R-1003'], channel: 'uber_eats', outcome: { reached: 'Preparing' }, delayed: true, minutesAgo: 48, total: 31.7, customerName: 'Sophie Wagner', issueId: 'ISS-1004' });
  buildOrder({ restaurant: byId['R-1005'], channel: 'whatsapp', outcome: { reached: 'Ready' }, minutesAgo: 22, total: 27.3, customerName: 'Paul Hoffmann' });

  // Background orders for every restaurant that is taking orders.
  const NAMES = ['Lea Schulz', 'Ben Koch', 'Emma Richter', 'Noah Klein', 'Hannah Wolf', 'Elias Neumann', 'Lina Schwarz', 'Felix Zimmermann', 'Marie Braun', 'Leon Krüger'];
  restaurants
    .filter((r) => r.ordersToday > 0)
    .forEach((restaurant) => {
      for (let i = 0; i < 6; i += 1) {
        const roll = rand();
        const outcome =
          roll < 0.06
            ? { reached: 'Received', failure: 'Rejected', reason: 'Rejected by restaurant: kitchen at capacity', source: 'Restaurant tablet' }
            : roll < 0.1
              ? { reached: 'Accepted', failure: 'Cancelled', reason: 'Cancelled by customer before preparation', source: 'Customer' }
              : { reached: i < 2 ? pick(['Accepted', 'Preparing', 'Ready']) : 'Delivered' };
        buildOrder({
          restaurant,
          channel: pick(restaurant.channels),
          outcome,
          minutesAgo: 15 + i * 37 + Math.floor(rand() * 20),
          total: Math.round((14 + rand() * 50) * 10) / 10,
          customerName: pick(NAMES),
        });
      }
    });

  // ---------- Issues ----------
  const issue = (id, fields) => ({
    id,
    notes: [],
    relatedOrderIds: [],
    logs: [],
    integrationId: null,
    ...fields,
  });
  const issues = [
    issue('ISS-1001', {
      title: 'Orders not coming from Wolt',
      description: 'Wolt webhooks for Bella Italia return HTTP 502 since 10 minutes. New Wolt orders are not reaching the restaurant tablet.',
      category: 'Integration', severity: 'Critical', status: 'Open', restaurantIds: ['R-1001', 'R-1002', 'R-1012'], assigneeId: null,
      createdAt: ago(14), updatedAt: ago(5), integrationId: 'wolt', relatedOrderIds: ['ORD-50002'],
      activity: [
        { at: ago(14), text: 'Issue detected by webhook failure monitor', actor: 'System' },
        { at: ago(12), text: 'Integration health check: Wolt webhook endpoint degraded', actor: 'System' },
        { at: ago(5), text: 'Severity raised to Critical (3 restaurants affected)', actor: 'System' },
      ],
      logs: [
        { at: ago(6), level: 'ERROR', message: 'POST /webhooks/wolt -> 502 Bad Gateway (upstream timeout 10s)' },
        { at: ago(9), level: 'ERROR', message: 'Order WOLT payload rejected: upstream unavailable' },
        { at: ago(13), level: 'WARN', message: 'Wolt webhook latency p95 above 4s' },
      ],
    }),
    issue('ISS-1002', {
      title: 'High order rejection rate',
      description: 'Sushi Central rejected 12% of orders in the last hour, mostly due to out-of-stock items that are still listed on Lieferando.',
      category: 'Orders', severity: 'High', status: 'Investigating', restaurantIds: ['R-1002'], assigneeId: 'u-2',
      createdAt: ago(70), updatedAt: ago(12), integrationId: 'lieferando', relatedOrderIds: ['ORD-50004'],
      activity: [
        { at: ago(70), text: 'Issue detected: rejection rate above 10% threshold', actor: 'System' },
        { at: ago(55), text: 'Assigned to Sarah Klein', actor: 'John Doe' },
        { at: ago(12), text: 'Status changed to Investigating', actor: 'Sarah Klein' },
      ],
    }),
    issue('ISS-1003', {
      title: 'Restaurant offline',
      description: 'Taco Loco has not sent a heartbeat for over 3 hours. Channels were paused automatically by providers.',
      category: 'Restaurant', severity: 'High', status: 'Open', restaurantIds: ['R-1004'], assigneeId: null,
      createdAt: ago(188), updatedAt: ago(18), relatedOrderIds: ['ORD-50003'],
      activity: [
        { at: ago(188), text: 'Heartbeat missing for 5 minutes', actor: 'System' },
        { at: ago(185), text: 'Wolt and Lieferando listings paused by providers', actor: 'System' },
        { at: ago(18), text: 'Restaurant contacted by phone – no answer', actor: 'Mike Ross' },
      ],
    }),
    issue('ISS-1004', {
      title: 'Printer not working',
      description: 'Kitchen printer at Burger House stopped printing receipts; orders are delayed while staff read from the tablet.',
      category: 'Devices', severity: 'Medium', status: 'In Progress', restaurantIds: ['R-1003'], assigneeId: 'u-3',
      createdAt: ago(80), updatedAt: ago(25), relatedOrderIds: ['ORD-50005'],
      activity: [
        { at: ago(80), text: 'Printer reported paper jam', actor: 'Device monitor' },
        { at: ago(60), text: 'Assigned to Mike Ross', actor: 'John Doe' },
        { at: ago(25), text: 'Status changed to In Progress', actor: 'Mike Ross' },
      ],
    }),
    issue('ISS-1005', {
      title: 'Delivery zone gap',
      description: 'Customers in 60389 Frankfurt (Bornheim north) see "not delivering" although the area should be covered by Zone B.',
      category: 'Delivery Zones', severity: 'Medium', status: 'Open', restaurantIds: ['R-1006'], assigneeId: null,
      createdAt: ago(240), updatedAt: ago(32),
      activity: [{ at: ago(240), text: 'Reported by restaurant via support chat', actor: 'Lena Vogel' }],
    }),
    issue('ISS-1006', {
      title: 'Slow order acceptance',
      description: 'Average acceptance time at Pizza Palace increased to 2m 40s during the lunch peak.',
      category: 'Performance', severity: 'Low', status: 'Monitoring', restaurantIds: ['R-1005'], assigneeId: 'u-1',
      createdAt: ago(400), updatedAt: ago(60),
      activity: [
        { at: ago(400), text: 'Acceptance time above 2 minutes', actor: 'System' },
        { at: ago(60), text: 'Status changed to Monitoring', actor: 'John Doe' },
      ],
    }),
    issue('ISS-1007', {
      title: 'Menu item missing',
      description: 'Menu sync for Curry Corner failed. Six items are unavailable on all channels.',
      category: 'Menu', severity: 'Medium', status: 'Open', restaurantIds: ['R-1007'], assigneeId: 'u-4',
      createdAt: ago(310), updatedAt: ago(120),
      activity: [
        { at: ago(310), text: 'Menu sync failed: invalid modifier group reference', actor: 'Menu sync job' },
        { at: ago(120), text: 'Assigned to Priya Mehta', actor: 'John Doe' },
      ],
    }),
    issue('ISS-1008', {
      title: 'WhatsApp ordering handoffs increasing',
      description: 'Human handoff rate for WhatsApp AI ordering at Döner Werk rose from 6% to 18% after the menu update.',
      category: 'AI Ordering', severity: 'Medium', status: 'Investigating', restaurantIds: ['R-1010'], assigneeId: 'u-2',
      createdAt: ago(500), updatedAt: ago(90), integrationId: 'whatsapp',
      activity: [{ at: ago(500), text: 'Handoff rate anomaly detected', actor: 'AI quality monitor' }],
    }),
    issue('ISS-1009', {
      title: 'Uber Eats menu prices out of sync',
      description: 'Prices on Uber Eats for Bao Brothers differ from the master menu for 4 items.',
      category: 'Integration', severity: 'Low', status: 'Open', restaurantIds: ['R-1012'], assigneeId: null,
      createdAt: ago(900), updatedAt: ago(600), integrationId: 'uber_eats',
      activity: [{ at: ago(900), text: 'Price drift detected by nightly reconciliation', actor: 'Reconciliation job' }],
    }),
    issue('ISS-1010', {
      title: 'Tablet battery critical',
      description: 'Tablet at Noodle Bar is running on battery (8%) and may disconnect.',
      category: 'Devices', severity: 'Low', status: 'Resolved', restaurantIds: ['R-1009'], assigneeId: 'u-3',
      createdAt: ago(1400), updatedAt: ago(1300),
      activity: [
        { at: ago(1400), text: 'Low battery warning', actor: 'Device monitor' },
        { at: ago(1300), text: 'Issue resolved: charger reconnected', actor: 'Mike Ross' },
      ],
    }),
    issue('ISS-1011', {
      title: 'Payment capture failures',
      description: 'Card payments for direct orders failed for 3% of transactions due to timeouts at the payment provider.',
      category: 'Integration', severity: 'High', status: 'Monitoring', restaurantIds: ['R-1005', 'R-1008', 'R-1014'], assigneeId: 'u-1',
      createdAt: ago(2000), updatedAt: ago(240), integrationId: 'stripe',
      activity: [
        { at: ago(2000), text: 'Capture failure rate above 2%', actor: 'System' },
        { at: ago(240), text: 'Provider deployed fix, monitoring', actor: 'John Doe' },
      ],
    }),
    issue('ISS-1012', {
      title: 'Lieferando order status callbacks delayed',
      description: 'Status callbacks to Lieferando are queued for up to 6 minutes.',
      category: 'Integration', severity: 'Medium', status: 'Resolved', restaurantIds: ['R-1003', 'R-1008'], assigneeId: 'u-2',
      createdAt: ago(3000), updatedAt: ago(2700), integrationId: 'lieferando',
      activity: [
        { at: ago(3000), text: 'Queue depth alert on lieferando-callbacks', actor: 'System' },
        { at: ago(2700), text: 'Issue resolved: consumer scaled up', actor: 'Sarah Klein' },
      ],
    }),
  ];

  // ---------- Incidents ----------
  const incidents = [
    {
      id: 'INC-301', title: 'Wolt order ingestion outage', severity: 'Critical', status: 'Investigating',
      description: 'Wolt webhooks are failing with HTTP 502. Orders from Wolt are not reaching restaurants in several cities.',
      affectedServices: ['Wolt integration', 'Order ingestion'], restaurantIds: ['R-1001', 'R-1002', 'R-1012'], ownerId: 'u-1',
      relatedIssueIds: ['ISS-1001'], startedAt: ago(13), updatedAt: ago(4), resolvedAt: null,
      history: [
        { at: ago(13), text: 'Incident opened from ISS-1001', actor: 'John Doe' },
        { at: ago(4), text: 'Contacted Wolt partner support', actor: 'John Doe' },
      ],
    },
    {
      id: 'INC-300', title: 'Payment capture timeouts', severity: 'High', status: 'Monitoring',
      description: 'Increased timeouts when capturing card payments for direct orders.',
      affectedServices: ['Payments'], restaurantIds: ['R-1005', 'R-1008', 'R-1014'], ownerId: 'u-2',
      relatedIssueIds: ['ISS-1011'], startedAt: ago(2000), updatedAt: ago(240), resolvedAt: null,
      history: [
        { at: ago(2000), text: 'Incident opened', actor: 'Sarah Klein' },
        { at: ago(1200), text: 'Status changed to Mitigating', actor: 'Sarah Klein' },
        { at: ago(240), text: 'Status changed to Monitoring', actor: 'Sarah Klein' },
      ],
    },
    {
      id: 'INC-299', title: 'Menu sync job backlog', severity: 'Medium', status: 'Mitigating',
      description: 'Menu sync jobs are delayed; some restaurants show stale menus on delivery platforms.',
      affectedServices: ['Menu sync', 'Job queue'], restaurantIds: ['R-1007'], ownerId: 'u-4',
      relatedIssueIds: ['ISS-1007'], startedAt: ago(320), updatedAt: ago(100), resolvedAt: null,
      history: [{ at: ago(320), text: 'Incident opened', actor: 'Priya Mehta' }],
    },
    {
      id: 'INC-297', title: 'Lieferando callback delays', severity: 'Medium', status: 'Resolved',
      description: 'Order status callbacks to Lieferando were delayed by up to 6 minutes.',
      affectedServices: ['Lieferando integration'], restaurantIds: ['R-1003', 'R-1008'], ownerId: 'u-2',
      relatedIssueIds: ['ISS-1012'], startedAt: ago(3000), updatedAt: ago(2700), resolvedAt: ago(2700),
      history: [
        { at: ago(3000), text: 'Incident opened', actor: 'Sarah Klein' },
        { at: ago(2700), text: 'Status changed to Resolved', actor: 'Sarah Klein' },
      ],
    },
    {
      id: 'INC-294', title: 'Printer firmware rollout failure', severity: 'Low', status: 'Resolved',
      description: 'Firmware 4.2.0 caused printers to reboot repeatedly; rolled back to 4.1.3.',
      affectedServices: ['Device fleet'], restaurantIds: ['R-1003', 'R-1009'], ownerId: 'u-3',
      relatedIssueIds: [], startedAt: ago(9000), updatedAt: ago(8800), resolvedAt: ago(8800),
      history: [
        { at: ago(9000), text: 'Incident opened', actor: 'Mike Ross' },
        { at: ago(8800), text: 'Status changed to Resolved', actor: 'Mike Ross' },
      ],
    },
  ];

  // ---------- Integrations ----------
  const integrations = [
    { id: 'wolt', name: 'Wolt', category: 'Delivery marketplace', status: 'Down', uptime30d: 98.91, lastSuccessAt: ago(14), supportsRetry: true,
      errors: [{ at: ago(6), message: 'Webhook delivery failed: HTTP 502 Bad Gateway' }, { at: ago(9), message: 'Upstream timeout after 10s' }] },
    { id: 'uber_eats', name: 'Uber Eats', category: 'Delivery marketplace', status: 'Operational', uptime30d: 99.95, lastSuccessAt: ago(1), supportsRetry: true,
      errors: [{ at: ago(600), message: 'Price reconciliation found 4 mismatches' }] },
    { id: 'lieferando', name: 'Lieferando', category: 'Delivery marketplace', status: 'Degraded', uptime30d: 99.62, lastSuccessAt: ago(3), supportsRetry: true,
      errors: [{ at: ago(30), message: 'Status callback latency p95 4.8s' }] },
    { id: 'whatsapp', name: 'WhatsApp Business', category: 'Messaging / AI ordering', status: 'Operational', uptime30d: 99.98, lastSuccessAt: ago(1), supportsRetry: false, errors: [] },
    { id: 'stripe', name: 'Stripe', category: 'Payments', status: 'Operational', uptime30d: 99.9, lastSuccessAt: ago(1), supportsRetry: false,
      errors: [{ at: ago(250), message: 'Capture timeout (resolved by provider)' }] },
    { id: 'google_maps', name: 'Google Maps Platform', category: 'Maps & routing', status: 'Operational', uptime30d: 100, lastSuccessAt: ago(2), supportsRetry: false, errors: [] },
    { id: 'twilio', name: 'Twilio Voice', category: 'Voice / AI ordering', status: 'Operational', uptime30d: 99.97, lastSuccessAt: ago(42), supportsRetry: true, errors: [] },
  ];

  // ---------- Devices ----------
  const devices = [];
  let deviceSeq = 2000;
  restaurants.forEach((r) => {
    const types = ['Tablet', 'Printer'];
    if (r.ordersToday > 300) types.push('Printer');
    types.forEach((type) => {
      deviceSeq += 1;
      const offline = r.status === 'Offline';
      const warning = !offline && (r.status === 'Degraded' || rand() < 0.08);
      const status = offline ? 'Offline' : warning ? 'Warning' : 'Online';
      const lastHeartbeatAt = offline ? ago(r.status === 'Offline' ? 190 : 82) : ago(warning ? 4 : 1);
      devices.push({
        id: `DEV-${deviceSeq}`,
        name: `${r.name} ${type === 'Tablet' ? 'Order tablet' : 'Kitchen printer'}`,
        type,
        restaurantId: r.id,
        status,
        lastHeartbeatAt,
        firmware: type === 'Tablet' ? pick(['OF-Android 3.8.1', 'OF-Android 3.9.0']) : pick(['4.1.3', '4.1.3', '4.0.9']),
        detail: offline ? (type === 'Printer' ? 'Paper jam / not responding' : 'No heartbeat') : warning ? 'Weak Wi-Fi signal (-78 dBm)' : 'Healthy',
        history: [
          { at: lastHeartbeatAt, event: status === 'Online' ? 'Heartbeat OK' : status === 'Warning' ? 'Signal degraded' : 'Heartbeat lost' },
          { at: ago(60 * 6), event: 'Connected' },
          { at: ago(60 * 30), event: 'Firmware check OK' },
        ],
      });
    });
  });
  // Make the Burger House printer the known-failing device referenced by ISS-1004.
  const burgerPrinter = devices.find((d) => d.restaurantId === 'R-1003' && d.type === 'Printer');
  if (burgerPrinter) {
    Object.assign(burgerPrinter, { status: 'Offline', detail: 'Paper jam / not responding', lastHeartbeatAt: ago(82) });
  }

  // ---------- Delivery zones ----------
  const deliveryZones = [];
  restaurants.forEach((r, index) => {
    const zones = [
      { name: 'Zone A – Core', minKm: 0, maxKm: 3, fee: 1.99, eta: '25–35 min', active: true },
      { name: 'Zone B – Extended', minKm: 3, maxKm: 6, fee: 3.49, eta: '35–50 min', active: true },
    ];
    if (index % 3 === 0) zones.push({ name: 'Zone C – Outer', minKm: 6, maxKm: 9, fee: 4.99, eta: '50–65 min', active: r.status !== 'Offline' && index % 2 === 0 });
    zones.forEach((z, zi) => {
      deliveryZones.push({ id: `Z-${r.id.slice(2)}-${String.fromCharCode(65 + zi)}`, restaurantId: r.id, minOrder: 12 + zi * 3, ...z });
    });
  });
  // Seeded misconfiguration for ISS-1005: Green Bowl's zone B is inactive.
  deliveryZones.find((z) => z.id === 'Z-1006-B').active = false;

  // ---------- AI conversations ----------
  const aiRestaurants = restaurants.filter((r) => r.ai.voiceEnabled || r.ai.whatsappEnabled);
  const outcomes = ['Completed', 'Completed', 'Completed', 'Completed', 'Handoff', 'Failed', 'Flagged'];
  const reasons = {
    Handoff: ['Customer asked for a human', 'Allergy question outside AI scope'],
    Failed: ['Address could not be validated', 'Speech recognition confidence too low'],
    Flagged: ['Offered an unavailable menu item', 'Price mismatch in order summary'],
  };
  const conversations = Array.from({ length: 18 }, (_, i) => {
    const r = aiRestaurants[i % aiRestaurants.length];
    const channel = r.ai.voiceEnabled && (i % 2 === 0 || !r.ai.whatsappEnabled) ? 'voice' : 'whatsapp';
    const status = outcomes[Math.floor(rand() * outcomes.length)];
    return {
      id: `CONV-${8800 + i}`,
      channel,
      restaurantId: r.id,
      status,
      failureReason: reasons[status] ? pick(reasons[status]) : null,
      at: ago(5 + i * 23),
      durationSec: 40 + Math.floor(rand() * 200),
      turns: 4 + Math.floor(rand() * 12),
      issueId: r.id === 'R-1010' && status !== 'Completed' ? 'ISS-1008' : null,
      contact: channel === 'voice' ? `+49 30 ${Math.floor(1000000 + rand() * 8999999)}` : `+49 17${Math.floor(rand() * 9)} ${Math.floor(1000000 + rand() * 8999999)}`,
    };
  });

  // ---------- Platform ----------
  const platform = {
    release: { version: '2026.10.2', commit: '8c41f2e', deployedAt: ago(60 * 26), deployedBy: 'Sarah Klein', environment: 'Production' },
    queues: [
      { name: 'order-ingestion', depth: 1240, consumers: 8, status: 'Backlogged' },
      { name: 'menu-sync', depth: 312, consumers: 2, status: 'Backlogged' },
      { name: 'provider-callbacks', depth: 18, consumers: 4, status: 'Healthy' },
      { name: 'notifications', depth: 3, consumers: 2, status: 'Healthy' },
    ],
    featureFlags: [
      { key: 'ai-voice-ordering', name: 'AI voice ordering', environment: 'Production', rollout: 35, enabled: true, modifiedBy: 'u-2', modifiedAt: ago(60 * 48) },
      { key: 'whatsapp-ordering', name: 'WhatsApp ordering', environment: 'Production', rollout: 100, enabled: true, modifiedBy: 'u-1', modifiedAt: ago(60 * 24 * 9) },
      { key: 'new-dispatch-engine', name: 'New dispatch engine', environment: 'Production', rollout: 10, enabled: true, modifiedBy: 'u-2', modifiedAt: ago(60 * 5) },
      { key: 'auto-pause-offline', name: 'Auto-pause offline restaurants', environment: 'Production', rollout: 100, enabled: true, modifiedBy: 'u-1', modifiedAt: ago(60 * 24 * 20) },
      { key: 'menu-photo-ai', name: 'AI menu photo enhancement', environment: 'Staging', rollout: 50, enabled: true, modifiedBy: 'u-4', modifiedAt: ago(60 * 3) },
      { key: 'zone-heatmaps', name: 'Delivery zone heatmaps', environment: 'Staging', rollout: 0, enabled: false, modifiedBy: 'u-2', modifiedAt: ago(60 * 24 * 2) },
      { key: 'smart-prep-time', name: 'Smart preparation time', environment: 'Production', rollout: 0, enabled: false, modifiedBy: 'u-1', modifiedAt: ago(60 * 24 * 14) },
    ],
    jobs: [
      { id: 'JOB-77120', type: 'menu-sync', status: 'Failed', environment: 'Production', startedAt: ago(300), durationSec: 42, error: 'Invalid modifier group reference (restaurant R-1007)' },
      { id: 'JOB-77131', type: 'menu-sync', status: 'Running', environment: 'Production', startedAt: ago(3), durationSec: null, error: null },
      { id: 'JOB-77129', type: 'price-reconciliation', status: 'Succeeded', environment: 'Production', startedAt: ago(600), durationSec: 312, error: null },
      { id: 'JOB-77128', type: 'payout-export', status: 'Succeeded', environment: 'Production', startedAt: ago(720), durationSec: 95, error: null },
      { id: 'JOB-77127', type: 'webhook-replay', status: 'Failed', environment: 'Production', startedAt: ago(8), durationSec: 11, error: 'Wolt endpoint returned 502 for 48 of 48 events' },
      { id: 'JOB-77126', type: 'report-daily', status: 'Succeeded', environment: 'Production', startedAt: ago(60 * 9), durationSec: 61, error: null },
      { id: 'JOB-77125', type: 'menu-sync', status: 'Succeeded', environment: 'Staging', startedAt: ago(60 * 2), durationSec: 37, error: null },
      { id: 'JOB-77124', type: 'device-firmware-check', status: 'Succeeded', environment: 'Production', startedAt: ago(60 * 4), durationSec: 18, error: null },
      { id: 'JOB-77123', type: 'webhook-replay', status: 'Queued', environment: 'Production', startedAt: null, durationSec: null, error: null },
      { id: 'JOB-77122', type: 'search-reindex', status: 'Failed', environment: 'Staging', startedAt: ago(60 * 6), durationSec: 140, error: 'Out of memory on worker staging-3' },
    ],
  };

  // ---------- Audit ----------
  const auditLog = [
    { id: 'AUD-9001', at: ago(4), actorId: 'u-1', action: 'incident.update', resource: 'INC-301', ip: '10.20.4.17', result: 'Success' },
    { id: 'AUD-9000', at: ago(13), actorId: 'u-1', action: 'incident.create', resource: 'INC-301', ip: '10.20.4.17', result: 'Success' },
    { id: 'AUD-8999', at: ago(55), actorId: 'u-1', action: 'issue.assign', resource: 'ISS-1002', ip: '10.20.4.17', result: 'Success' },
    { id: 'AUD-8998', at: ago(70), actorId: 'u-3', action: 'pii.reveal', resource: 'ORD-50004 customer phone', ip: '10.20.7.41', result: 'Success', reason: 'Customer callback requested (ticket SUP-4412)' },
    { id: 'AUD-8997', at: ago(130), actorId: 'u-4', action: 'view_as.start', resource: 'R-1007 Curry Corner', ip: '10.20.9.3', result: 'Success', reason: 'SUP-4409 menu check' },
    { id: 'AUD-8996', at: ago(118), actorId: 'u-4', action: 'view_as.end', resource: 'R-1007 Curry Corner', ip: '10.20.9.3', result: 'Success' },
    { id: 'AUD-8995', at: ago(300), actorId: 'u-2', action: 'feature_flag.update', resource: 'new-dispatch-engine', ip: '10.20.4.22', result: 'Success' },
    { id: 'AUD-8994', at: ago(330), actorId: 'u-5', action: 'restaurant.config.update', resource: 'R-1002 Sushi Central', ip: '10.20.8.9', result: 'Denied' },
    { id: 'AUD-8993', at: ago(420), actorId: 'u-3', action: 'auth.login', resource: 'Control Center', ip: '10.20.7.41', result: 'Success' },
    { id: 'AUD-8992', at: ago(425), actorId: 'u-3', action: 'auth.login', resource: 'Control Center', ip: '10.20.7.41', result: 'Failed' },
    { id: 'AUD-8991', at: ago(600), actorId: 'u-2', action: 'restaurant.config.update', resource: 'R-1012 Bao Brothers', ip: '10.20.4.22', result: 'Success' },
    { id: 'AUD-8990', at: ago(1440), actorId: 'u-1', action: 'auth.logout', resource: 'Control Center', ip: '10.20.4.17', result: 'Success' },
  ];

  const notifications = [
    { id: 'N-1', at: ago(5), title: 'Critical issue: Orders not coming from Wolt', link: '/issues/ISS-1001', read: false },
    { id: 'N-2', at: ago(13), title: 'Incident INC-301 opened', link: '/incidents/INC-301', read: false },
    { id: 'N-3', at: ago(18), title: 'Taco Loco is offline for 3 hours', link: '/restaurants/R-1004', read: false },
    { id: 'N-4', at: ago(300), title: 'Menu sync failed for Curry Corner', link: '/restaurants/R-1007/menu', read: true },
    { id: 'N-5', at: ago(60 * 26), title: 'Release 2026.10.2 deployed', link: '/platform', read: true },
  ];

  return {
    now,
    users,
    restaurants,
    orders,
    issues,
    incidents,
    integrations,
    devices,
    deliveryZones,
    conversations,
    platform,
    auditLog,
    notifications,
    piiGrants: [],
    viewAsSession: null,
    seq: { issue: 1012, incident: 301, audit: 9001 },
  };
}
