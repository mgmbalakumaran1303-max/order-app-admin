import { Link } from 'react-router-dom';
import { AlertTriangle, MessageCircle, Percent, PhoneCall, UserRound } from 'lucide-react';
import { MetricCard, MetricGrid } from '../../../components/ui/MetricCard';
import { Panel } from '../../../components/ui/Panel';
import { NoDataState } from '../../../components/feedback/States';
import { formatPercent } from '../../../utils/format';
import { useRestaurant } from '../Restaurant360Layout';

export default function AiTab() {
  const { restaurant } = useRestaurant();
  const { ai } = restaurant;
  if (!ai.voiceEnabled && !ai.whatsappEnabled) {
    return <NoDataState title="AI ordering not enabled">Voice and WhatsApp AI ordering are not enabled for {restaurant.name}.</NoDataState>;
  }
  return (
    <>
      <MetricGrid>
        <MetricCard icon={PhoneCall} label="Voice ordering" value={ai.voiceEnabled ? 'Enabled' : 'Disabled'} />
        <MetricCard icon={MessageCircle} tone="green" label="WhatsApp ordering" value={ai.whatsappEnabled ? 'Enabled' : 'Disabled'} />
        <MetricCard icon={Percent} tone="purple" label="Successful conversations" value={formatPercent(ai.successRate)} sublabel="Completed without a human" />
        <MetricCard icon={UserRound} tone="red" label="Human handoff rate" value={formatPercent(ai.handoffRate)} sublabel="Escalated to staff" />
      </MetricGrid>
      <Panel title="Operational warnings" actions={<Link to="/ai-operations" className="link-btn">AI Operations</Link>}>
        {ai.warnings.length ? (
          <ul className="error-list">
            {ai.warnings.map((w) => (
              <li key={w}>
                <AlertTriangle size={14} aria-hidden="true" /> {w}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No AI warnings for this restaurant.</p>
        )}
      </Panel>
    </>
  );
}
