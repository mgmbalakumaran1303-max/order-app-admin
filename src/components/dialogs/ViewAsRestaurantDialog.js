import { useState } from 'react';
import { AlertTriangle, MonitorSmartphone } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/FormControls';
import { useAsync } from '../../hooks/useAsync';
import { useMutation } from '../../hooks/useMutation';
import { useViewAs } from '../../context/ViewAsContext';
import { useToast } from '../../context/ToastContext';
import { restaurantService } from '../../services';
import { IS_MOCK } from '../../config/env';

export function ViewAsRestaurantDialog({ defaultRestaurantId = '', onClose }) {
  const restaurants = useAsync(() => restaurantService.listRestaurants(), []);
  const { start } = useViewAs();
  const toast = useToast();
  const [restaurantId, setRestaurantId] = useState(defaultRestaurantId);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState(null);
  const { mutate, pending } = useMutation(start);

  const errors = {
    restaurantId: restaurantId ? null : 'Select a restaurant.',
    reason: reason.trim().length >= 5 ? null : 'Enter a reason or support ticket reference.',
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (errors.restaurantId || errors.reason) return;
    setServerError(null);
    try {
      const session = await mutate({ restaurantId, reason });
      if (session) {
        toast.info(`View-as session started for ${session.restaurantName}.`);
        onClose();
      }
    } catch (err) {
      setServerError(err.code === 'FORBIDDEN' ? 'Your role is not allowed to view as a restaurant.' : err.message);
    }
  };

  return (
    <Modal title="View as restaurant" eyebrow="Support session" onClose={onClose} busy={pending}>
      <form onSubmit={submit} noValidate className="form">
        <div className="banner banner--warning">
          <MonitorSmartphone size={16} aria-hidden="true" />
          <span>
            You will see the Control Center as this restaurant sees it. The session is logged and a red banner stays visible until you end it.
            {IS_MOCK && ' Mock mode: this is a simulated session; no backend impersonation is created.'}
          </span>
        </div>
        <Field label="Restaurant" required error={touched ? errors.restaurantId : null}>
          {(props) => (
            <select {...props} value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} data-autofocus disabled={restaurants.loading}>
              <option value="">{restaurants.loading ? 'Loading restaurants…' : 'Select a restaurant'}</option>
              {(restaurants.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id})
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Reason or support ticket" required error={touched ? errors.reason : null}>
          {(props) => <input {...props} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="SUP-4412 – check menu display" />}
        </Field>
        {serverError && (
          <div className="banner banner--danger" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}
        <div className="modal__footer">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={pending}>
            Start session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
