import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, loading = false, disabled, children, className = '', type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="spin" aria-hidden="true" /> : Icon && <Icon size={15} aria-hidden="true" />}
      {children}
    </button>
  );
});

/** Icon-only button. `label` is required and becomes the accessible name. */
export const IconButton = forwardRef(function IconButton({ icon: Icon, label, badge, className = '', size = 18, ...rest }, ref) {
  return (
    <button ref={ref} type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon size={size} aria-hidden="true" />
      {badge ? <span className="icon-btn__dot" aria-hidden="true" /> : null}
    </button>
  );
});
