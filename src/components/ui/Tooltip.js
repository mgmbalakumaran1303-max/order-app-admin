import { useId } from 'react';
import { Info } from 'lucide-react';

/** Hover/focus tooltip. The trigger is a focusable button so keyboard users get it too. */
export function InfoTooltip({ text, label = 'More information' }) {
  const id = useId();
  return (
    <span className="tooltip">
      <button type="button" className="tooltip__trigger" aria-label={label} aria-describedby={id}>
        <Info size={13} aria-hidden="true" />
      </button>
      <span role="tooltip" id={id} className="tooltip__bubble">
        {text}
      </span>
    </span>
  );
}
