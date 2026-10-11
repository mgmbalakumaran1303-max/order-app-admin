import {
  AlertCircle,
  Bot,
  FileSearch,
  Gauge,
  LayoutDashboard,
  MapPinned,
  Plug,
  Printer,
  ShieldCheck,
  Store,
  Zap,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { to: '/command-center', label: 'Command Center', icon: LayoutDashboard },
      { to: '/issues', label: 'Issue Inbox', icon: AlertCircle, badge: 'openIssues' },
      { to: '/restaurants', label: 'Restaurants', icon: Store },
      { to: '/order-trace', label: 'Order Trace', icon: FileSearch },
      { to: '/delivery-zones', label: 'Delivery Zones', icon: MapPinned },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/incidents', label: 'Incident Workspace', icon: Zap },
      { to: '/integrations', label: 'Integrations', icon: Plug },
      { to: '/devices', label: 'Device Fleet', icon: Printer },
      { to: '/ai-operations', label: 'AI Operations', icon: Bot },
      { to: '/platform', label: 'Platform', icon: Gauge },
      { to: '/security-audit', label: 'Security & Audit', icon: ShieldCheck },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** Breadcrumb trail for a pathname: [{ label, to }]. */
export function breadcrumbsFor(pathname) {
  const [first, second] = pathname.split('/').filter(Boolean);
  const section = ALL_ITEMS.find((i) => i.to === `/${first}`);
  if (!section) return [{ label: 'Not found' }];
  const trail = [{ label: section.label, to: section.to }];
  if (second) trail.push({ label: decodeURIComponent(second) });
  return trail;
}
