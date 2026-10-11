// Domain vocabularies shared by real and mock services and by the UI.

export const CHANNELS = [
  { id: 'direct', label: 'Direct' },
  { id: 'lieferando', label: 'Lieferando' },
  { id: 'wolt', label: 'Wolt' },
  { id: 'uber_eats', label: 'Uber Eats' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export const channelLabel = (id) => CHANNELS.find((c) => c.id === id)?.label ?? id;

export const REGIONS = [
  { id: 'north', label: 'North', cities: ['Hamburg', 'Bremen'] },
  { id: 'east', label: 'East', cities: ['Berlin', 'Leipzig'] },
  { id: 'south', label: 'South', cities: ['Munich', 'Stuttgart'] },
  { id: 'west', label: 'West', cities: ['Cologne', 'Düsseldorf', 'Frankfurt'] },
];

export const ALL_CITIES = REGIONS.flatMap((r) => r.cities).sort();

export const regionOfCity = (city) => REGIONS.find((r) => r.cities.includes(city))?.id;

export const TIME_RANGES = [
  { id: '24h', label: 'Last 24 hours', hours: 24 },
  { id: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { id: '30d', label: 'Last 30 days', hours: 24 * 30 },
];

export const timeRangeHours = (id) => TIME_RANGES.find((t) => t.id === id)?.hours ?? 24;

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

export const ISSUE_STATUSES = ['Open', 'Investigating', 'In Progress', 'Monitoring', 'Resolved'];

export const ISSUE_CATEGORIES = [
  'Integration',
  'Orders',
  'Restaurant',
  'Devices',
  'Delivery Zones',
  'Menu',
  'Performance',
  'AI Ordering',
];

// Allowed issue status transitions. Used to show only valid actions.
export const ISSUE_TRANSITIONS = {
  Open: ['Investigating', 'In Progress', 'Resolved'],
  Investigating: ['In Progress', 'Monitoring', 'Resolved'],
  'In Progress': ['Monitoring', 'Resolved'],
  Monitoring: ['In Progress', 'Resolved'],
  Resolved: ['Open'],
};

export const INCIDENT_STATUSES = ['Investigating', 'Mitigating', 'Monitoring', 'Resolved'];

export const INCIDENT_TRANSITIONS = {
  Investigating: ['Mitigating', 'Monitoring', 'Resolved'],
  Mitigating: ['Monitoring', 'Resolved'],
  Monitoring: ['Mitigating', 'Resolved'],
  Resolved: [],
};

export const RESTAURANT_STATUSES = ['Online', 'Degraded', 'Maintenance', 'Offline'];

export const DEVICE_TYPES = ['Tablet', 'Printer'];
export const DEVICE_STATUSES = ['Online', 'Warning', 'Offline'];

// Order lifecycle. Not every order reaches every step.
export const ORDER_LIFECYCLE = ['Received', 'Accepted', 'Preparing', 'Ready', 'Picked Up', 'Delivered'];
export const ORDER_FAILURE_STATUSES = ['Rejected', 'Cancelled', 'Failed'];

export const PERMISSIONS = {
  ISSUES_WRITE: 'issues:write',
  INCIDENTS_WRITE: 'incidents:write',
  RESTAURANT_CONFIG_WRITE: 'restaurants:config:write',
  VIEW_AS_RESTAURANT: 'restaurants:view-as',
  PII_REVEAL: 'pii:reveal',
  PLATFORM_READ: 'platform:read',
  PLATFORM_WRITE: 'platform:write',
  AUDIT_READ: 'audit:read',
};
