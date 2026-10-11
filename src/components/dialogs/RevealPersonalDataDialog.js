import { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/FormControls';
import { useMutation } from '../../hooks/useMutation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { piiService } from '../../services';
import { IS_MOCK } from '../../config/env';
import { PERMISSIONS } from '../../utils/constants';
import { formatTime } from '../../utils/format';

export const MIN_REASON_LENGTH = 10;
const DURATIONS = [5, 15, 30];

/**
 * Asks for a reason and access duration, then requests the value from the
 * backend (piiService). The value is only shown if that request succeeds;
 * the backend is responsible for authorization and audit logging.
 */
export function RevealPersonalDataDialog({ fieldLabel, resourceLabel, request, onRevealed, onClose }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(15);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState(null);
  const { mutate, pending } = useMutation((input) => piiService.reveal(input));

  const reasonError = reason.trim().length < MIN_REASON_LENGTH ? `Enter a reason of at least ${MIN_REASON_LENGTH} characters.` : null;

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (reasonError) return;
    setServerError(null);
    try {
      const result = await mutate({ ...request, reason: reason.trim(), durationMinutes: duration });
      if (result) onRevealed(result);
    } catch (err) {
      setServerError(err.code === 'FORBIDDEN' ? 'You are not authorised to reveal personal data.' : err.message);
    }
  };

  return (
    <Modal title="Reveal personal data" eyebrow="Sensitive data access" onClose={onClose} busy={pending}>
      <form onSubmit={submit} noValidate className="form">
        <div className="banner banner--info">
          <ShieldAlert size={16} aria-hidden="true" />
          <span>
            You are requesting <strong>{fieldLabel}</strong> for <strong>{resourceLabel}</strong>. Access is logged with your name and
            reason, and the value is hidden again when access expires.
            {IS_MOCK && ' (Mock mode: the access grant and audit entry are simulated.)'}
          </span>
        </div>
        <Field label="Reason for access" required error={touched ? reasonError : null} hint="For example a support ticket reference and purpose.">
          {(props) => (
            <textarea {...props} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} data-autofocus placeholder="SUP-1234: customer asked for a callback about a missing item" />
          )}
        </Field>
        <Field label="Access duration">
          {(props) => (
            <select {...props} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          )}
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
          <Button type="submit" variant="primary" loading={pending} icon={Eye}>
            Reveal for {duration} min
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Masked value with an inline "Reveal" control wired to the dialog above. */
export function MaskedValue({ masked, fieldLabel, resourceLabel, request }) {
  const { can } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [grant, setGrant] = useState(null);

  useEffect(() => {
    if (!grant) return undefined;
    const ms = new Date(grant.expiresAt).getTime() - Date.now();
    const t = setTimeout(() => setGrant(null), Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [grant]);

  const allowed = can(PERMISSIONS.PII_REVEAL);

  return (
    <span className="masked">
      <span className={grant ? 'masked__value is-revealed' : 'masked__value'}>{grant ? grant.value : masked}</span>
      {grant ? (
        <>
          <span className="masked__expiry">visible until {formatTime(grant.expiresAt)}</span>
          <button type="button" className="link-btn" onClick={() => setGrant(null)}>
            <EyeOff size={13} aria-hidden="true" /> Hide
          </button>
        </>
      ) : (
        <button
          type="button"
          className="link-btn"
          disabled={!allowed}
          title={allowed ? undefined : 'Your role cannot reveal personal data'}
          onClick={() => setOpen(true)}
        >
          <Eye size={13} aria-hidden="true" /> Reveal
        </button>
      )}
      {open && (
        <RevealPersonalDataDialog
          fieldLabel={fieldLabel}
          resourceLabel={resourceLabel}
          request={request}
          onClose={() => setOpen(false)}
          onRevealed={(g) => {
            setGrant(g);
            setOpen(false);
            toast.info('Personal data revealed. This access has been logged.');
          }}
        />
      )}
    </span>
  );
}
