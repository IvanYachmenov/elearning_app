interface LoadingIndicatorProps {
  label?: string;
  compact?: boolean;
  className?: string;
}

function LoadingIndicator({ label = 'Loading...', compact = false, className = '' }: LoadingIndicatorProps) {
  const classNames = [
    'loading-indicator',
    compact ? 'loading-indicator--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="status" aria-live="polite" aria-label={label}>
      <span className="loading-indicator__spinner" aria-hidden="true" />
      <span className="loading-indicator__label">{label}</span>
    </div>
  );
}

export default LoadingIndicator;
