// Status information is always conveyed by text + shape, never color alone.

const STATUS_TONES = {
  // restaurants / devices / integrations
  Online: 'success', Operational: 'success', Connected: 'success', Synced: 'success', Healthy: 'success', Succeeded: 'success', Success: 'success', Completed: 'success', Active: 'success', Covered: 'success', Delivered: 'success',
  Degraded: 'warning', Warning: 'warning', Maintenance: 'warning', Unstable: 'warning', Pending: 'warning', Backlogged: 'warning', Handoff: 'warning', Delayed: 'warning', Queued: 'neutral', Inactive: 'neutral',
  Offline: 'danger', Down: 'danger', Disconnected: 'danger', Error: 'danger', Failed: 'danger', Denied: 'danger', Rejected: 'danger', Cancelled: 'danger', Flagged: 'danger',
  // issue / incident workflow
  Open: 'info', Investigating: 'purple', 'In Progress': 'purple', Mitigating: 'purple', Monitoring: 'teal', Resolved: 'success', Running: 'info',
  Received: 'info', Accepted: 'info', Preparing: 'info', Ready: 'info', 'Picked Up': 'info',
};

const SEVERITY_TONES = { Critical: 'danger', High: 'orange', Medium: 'warning', Low: 'neutral' };

export function Badge({ tone = 'neutral', children, dot = false, className = '' }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} dot>
      {status}
    </Badge>
  );
}

export function SeverityBadge({ severity }) {
  return (
    <Badge tone={SEVERITY_TONES[severity] ?? 'neutral'} className={`severity severity--${String(severity).toLowerCase()}`}>
      <span className="severity__bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {severity}
    </Badge>
  );
}

export const statusTone = (status) => STATUS_TONES[status] ?? 'neutral';
