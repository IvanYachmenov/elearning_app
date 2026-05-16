import { useEffect, useRef, useState } from 'react';

import './AppSelect.css';

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * App-styled dropdown. Replaces the native <select> so the open list uses our
 * colours (white / orange, square) instead of the browser's blue popup.
 */
function AppSelect({ value, options, onChange, ariaLabel, disabled, className }: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`app-select${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        className="app-select__control"
        onClick={() => !disabled && setOpen((previous) => !previous)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="app-select__value">{current ? current.label : ''}</span>
        <span className="app-select__arrow" aria-hidden="true" />
      </button>

      {open && (
        <ul className="app-select__list" role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={
                  'app-select__option' +
                  (option.value === value ? ' app-select__option--active' : '')
                }
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AppSelect;
