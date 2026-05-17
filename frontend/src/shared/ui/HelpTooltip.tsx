import { useEffect, useRef, useState } from 'react';

import './HelpTooltip.css';

type HelpTooltipProps = {
  text: string;
};

function HelpTooltip({ text }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [open]);

  return (
    <span
      className="help-tip"
      ref={rootRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="help-tip__button"
        aria-label="Help"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((previous) => !previous);
        }}
      >
        {"?"}
      </button>
      {open && (
        <span className="help-tip__bubble" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}

export default HelpTooltip;
