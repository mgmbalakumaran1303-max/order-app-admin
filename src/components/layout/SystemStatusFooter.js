import { Link } from 'react-router-dom';
import { APP_VERSION, IS_MOCK } from '../../config/env';
import { useAsync } from '../../hooks/useAsync';
import { integrationService } from '../../services';

export function SystemStatusFooter() {
  const integrations = useAsync(() => integrationService.listIntegrations(), []);
  let status = { tone: 'neutral', text: 'Checking system status…' };
  if (integrations.error) status = { tone: 'neutral', text: 'System status unavailable' };
  else if (integrations.data) {
    const down = integrations.data.filter((i) => i.status === 'Down');
    const degraded = integrations.data.filter((i) => i.status === 'Degraded');
    status = down.length
      ? { tone: 'danger', text: `Outage: ${down.map((i) => i.name).join(', ')}` }
      : degraded.length
        ? { tone: 'warning', text: `Degraded: ${degraded.map((i) => i.name).join(', ')}` }
        : { tone: 'success', text: 'All systems operational' };
  }

  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} Orderflow Systems</span>
      <Link to="/integrations" className={`app-footer__status is-${status.tone}`}>
        <span className="status-dot" aria-hidden="true" />
        {status.text}
        {IS_MOCK && <span className="muted"> (sample data)</span>}
      </Link>
      <span>v{APP_VERSION}</span>
    </footer>
  );
}
