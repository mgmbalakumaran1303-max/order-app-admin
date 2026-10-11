import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MonitorSmartphone, X } from 'lucide-react';
import { useViewAs } from '../../context/ViewAsContext';
import { useToast } from '../../context/ToastContext';
import { formatTime } from '../../utils/format';

export function ViewAsBanner() {
  const { session, end } = useViewAs();
  const toast = useToast();
  const [ending, setEnding] = useState(false);
  if (!session) return null;

  const onEnd = async () => {
    setEnding(true);
    try {
      await end();
      toast.success('View-as session ended.');
    } catch (err) {
      toast.error(`Could not end the session: ${err.message}`);
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="viewas-banner" role="alert" data-testid="view-as-banner">
      <MonitorSmartphone size={18} aria-hidden="true" />
      <b>VIEW AS RESTAURANT ACTIVE</b>
      <span>
        Viewing as <Link to={`/restaurants/${session.restaurantId}`}>{session.restaurantName}</Link> · started {formatTime(session.startedAt)} · expires{' '}
        {formatTime(session.expiresAt)} · reason: {session.reason}
        {session.simulated && ' · simulated session (mock mode)'}
      </span>
      <button type="button" onClick={onEnd} disabled={ending}>
        <X size={14} aria-hidden="true" /> {ending ? 'Ending…' : 'End session'}
      </button>
    </div>
  );
}
