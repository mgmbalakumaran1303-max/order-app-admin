import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/FormControls';
import { useAsync } from '../../hooks/useAsync';
import { useMutation } from '../../hooks/useMutation';
import { useToast } from '../../context/ToastContext';
import { authService, incidentService, restaurantService } from '../../services';
import { ISSUE_CATEGORIES, SEVERITIES } from '../../utils/constants';
import { publish, TOPICS } from '../../utils/events';

export function validateIncident(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Incident title is required.';
  if (!values.severity) errors.severity = 'Severity is required.';
  return errors;
}

/** Shared create-incident form used from the Issue Inbox, Issue Detail and Incident Workspace. */
export function CreateIncidentDialog({ defaults = {}, onClose, onCreated }) {
  const toast = useToast();
  const lookups = useAsync(() => Promise.all([restaurantService.listRestaurants(), authService.listUsers()]), []);
  const [values, setValues] = useState({
    title: defaults.title ?? '',
    description: defaults.description ?? '',
    severity: defaults.severity ?? '',
    category: defaults.category ?? '',
    restaurantId: defaults.restaurantId ?? '',
    ownerId: '',
  });
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState(null);
  const { mutate, pending } = useMutation((input) => incidentService.createIncident(input));

  const errors = touched ? validateIncident(values) : {};
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(validateIncident(values)).length) return;
    setServerError(null);
    try {
      const incident = await mutate({ ...values, relatedIssueId: defaults.relatedIssueId });
      if (!incident) return;
      toast.success(`Incident ${incident.id} created.`);
      publish(TOPICS.INCIDENTS);
      onCreated?.(incident);
      onClose();
    } catch (err) {
      setServerError(err.code === 'FORBIDDEN' ? 'You are not allowed to create incidents.' : err.message);
    }
  };

  const [restaurants, users] = lookups.data ?? [[], []];

  return (
    <Modal title="Create incident" eyebrow="Incident management" onClose={onClose} busy={pending} size="lg">
      <form onSubmit={submit} noValidate className="form">
        <Field label="Incident title" required error={errors.title}>
          {(props) => <input {...props} value={values.title} onChange={set('title')} data-autofocus placeholder="e.g. Wolt orders not arriving" />}
        </Field>
        <Field label="Description">
          {(props) => <textarea {...props} rows={3} value={values.description} onChange={set('description')} placeholder="What is happening and who is affected?" />}
        </Field>
        <div className="form__row">
          <Field label="Severity" required error={errors.severity}>
            {(props) => (
              <select {...props} value={values.severity} onChange={set('severity')}>
                <option value="">Select severity</option>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Category">
            {(props) => (
              <select {...props} value={values.category} onChange={set('category')}>
                <option value="">Select category</option>
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <div className="form__row">
          <Field label="Affected restaurant">
            {(props) => (
              <select {...props} value={values.restaurantId} onChange={set('restaurantId')}>
                <option value="">None / platform-wide</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Owner (optional)">
            {(props) => (
              <select {...props} value={values.ownerId} onChange={set('ownerId')}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
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
          <Button type="submit" variant="primary" loading={pending}>
            Create Incident
          </Button>
        </div>
      </form>
    </Modal>
  );
}
