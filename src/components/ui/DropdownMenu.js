import { useEffect, useId, useRef, useState } from 'react';

/**
 * Accessible popover menu. `trigger` receives props to spread on the button.
 * `children` is a render function receiving close().
 */
export function DropdownMenu({ trigger, children, align = 'right', className = '', label }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) rootRef.current?.querySelector('.menu [role="menuitem"]:not([disabled]), .menu a, .menu button')?.focus();
  }, [open]);

  const onMenuKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...rootRef.current.querySelectorAll('.menu [role="menuitem"]:not([disabled])')];
    const idx = items.indexOf(document.activeElement);
    const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const close = () => setOpen(false);

  return (
    <div className={`dropdown ${className}`} ref={rootRef}>
      {trigger({
        ref: triggerRef,
        onClick: (e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
      })}
      {open && (
        <div
          className={`menu menu--${align}`}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          onClick={(e) => e.stopPropagation()}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onSelect, disabled, danger, hint }) {
  return (
    <button type="button" role="menuitem" className={`menu__item ${danger ? 'is-danger' : ''}`} disabled={disabled} onClick={onSelect} title={hint}>
      {Icon && <Icon size={15} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
