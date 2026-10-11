import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { useMutation } from '../../hooks/useMutation';

/**
 * Confirmation for consequential actions. States what will change, who/what
 * is affected, the impact, and how to undo it. If `undo` is not supplied the
 * dialog says the action cannot be undone here rather than promising it can.
 */
export function ConfirmActionDialog({
  title,
  change,
  resource,
  impact,
  undo,
  confirmLabel = 'Confirm',
  tone = 'primary',
  onConfirm,
  onClose,
}) {
  const { mutate, pending } = useMutation(onConfirm);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setError(null);
    try {
      await mutate();
      onClose();
    } catch (err) {
      setError(err.message || 'The action failed.');
    }
  };

  return (
    <Modal
      title={title}
      eyebrow="Confirm action"
      onClose={onClose}
      busy={pending}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant={tone} onClick={confirm} loading={pending} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <dl className="confirm-summary">
        <div>
          <dt>What will change</dt>
          <dd>{change}</dd>
        </div>
        <div>
          <dt>Affected</dt>
          <dd data-testid="confirm-resource">{resource}</dd>
        </div>
        {impact && (
          <div>
            <dt>Potential impact</dt>
            <dd>{impact}</dd>
          </div>
        )}
        <div>
          <dt>How to undo</dt>
          <dd>{undo || 'This action cannot be undone from the Control Center.'}</dd>
        </div>
      </dl>
      {error && (
        <div className="banner banner--danger" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </Modal>
  );
}
