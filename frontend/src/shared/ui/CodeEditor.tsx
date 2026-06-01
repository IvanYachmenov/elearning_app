import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ChangeEvent, type KeyboardEvent, type UIEvent } from 'react';

import { tokenizeCodeLine } from '../lib/highlightCode';

import './CodeEditor.css';

type CodeEditorProps = {
  value: string;
  onChange: (next: string) => void;
  spellCheck?: boolean;
  disabled?: boolean;
  placeholder?: string;
  minRows?: number;
  ariaLabel?: string;
  id?: string;
};

const TAB_INDENT = '    ';

function renderOverlay(value: string) {
  // Trailing newline so the overlay always has at least one row matching the textarea.
  const display = value.endsWith('\n') ? `${value}​` : value;
  return display.split('\n').map((line, index) => (
    <span className="code-editor__line" key={`line-${index}`}>
      {line.length ? tokenizeCodeLine(line, index, 'code-editor__token') : '​'}
      {'\n'}
    </span>
  ));
}

export function CodeEditor({
  value,
  onChange,
  spellCheck = false,
  disabled = false,
  placeholder,
  minRows = 8,
  ariaLabel,
  id,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLPreElement | null>(null);

  const { lineNumbers, gutterStyle } = useMemo(() => {
    const count = Math.max(1, value.split('\n').length);
    const numbers = Array.from({ length: count }, (_, i) => i + 1).join('\n');
    const digits = Math.max(2, String(count).length);
    const style = { '--code-editor-gutter-width': `calc(${digits}ch + 12px)` } as CSSProperties;
    return { lineNumbers: numbers, gutterStyle: style };
  }, [value]);

  // Auto-grow textarea with its content; cap at 2x viewport height, then scroll.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const cap = typeof window === 'undefined' ? Infinity : window.innerHeight * 2;
    const next = Math.min(el.scrollHeight, cap);
    el.style.height = `${next}px`;
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();

    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${value.slice(0, start)}${TAB_INDENT}${value.slice(end)}`;
    onChange(next);

    // Restore caret position after React re-renders.
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const caret = start + TAB_INDENT.length;
        textareaRef.current.selectionStart = caret;
        textareaRef.current.selectionEnd = caret;
      }
    });
  };

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const top = event.currentTarget.scrollTop;
    const left = event.currentTarget.scrollLeft;
    if (overlayRef.current) {
      overlayRef.current.scrollTop = top;
      overlayRef.current.scrollLeft = left;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = top;
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="code-editor" style={gutterStyle}>
      <pre className="code-editor__gutter" ref={gutterRef} aria-hidden="true">
        {lineNumbers}
      </pre>
      <pre className="code-editor__overlay" ref={overlayRef} aria-hidden="true">
        {renderOverlay(value)}
      </pre>
      <textarea
        ref={textareaRef}
        id={id}
        className="code-editor__textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck={spellCheck}
        disabled={disabled}
        placeholder={placeholder}
        rows={minRows}
        aria-label={ariaLabel}
        style={{ minHeight: `calc(${minRows} * 1.5em + 28px)` }}
      />
    </div>
  );
}
