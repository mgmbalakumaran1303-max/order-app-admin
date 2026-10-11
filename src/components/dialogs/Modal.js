import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: labelled, traps focus, closes on Escape / close
 * button, restores focus to the opener. Backdrop clicks do not close it so
 * half-filled forms are not lost by accident. `busy` blocks closing while a
 * submission is pending.
 */
export function Modal({ title, eyebrow, description, onClose, children, footer, size = 'md', busy = false, tone }) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    const first = dialog.querySelector('[data-autofocus]') || dialog.querySelectorAll(FOCUSABLE)[1] || dialog;
    first.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !busyRef.current) {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === 'Tab') {
        const nodes = [...dialog.querySelectorAll(FOCUSABLE)];
        if (!nodes.length) return;
        const firstNode = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstNode) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          firstNode.focus();
        }
      }
    };
    dialog.addEventListener('keydown', onKey);
    document.body.classList.add('has-modal');
    return () => {
      dialog.removeEventListener('keydown', onKey);
      document.body.classList.remove('has-modal');
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop">
      <div
        ref={dialogRef}
        className={`modal modal--${size} ${tone ? `modal--${tone}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
      >
        <div className="modal__head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {description && (
              <p id={descId} className="modal__desc">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={busy} aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
