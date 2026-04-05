import type { PracticeTimerProps } from '../types';

function formatTime(seconds: number | null): string {
  if (seconds === null) {
    return '--:--';
  }

  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const remaining = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function PracticeTimer({ remainingSeconds, timeLimitSeconds, isActive, timedOut }: PracticeTimerProps) {
  const limit = timeLimitSeconds || 0;
  const remaining = remainingSeconds ?? limit;
  let tone = 'practice-timer--safe';

  if (timedOut) {
    tone = 'practice-timer--danger';
  } else if (limit > 0 && remaining <= 15 && isActive) {
    tone = 'practice-timer--warning';
  }

  return (
    <div className={`practice-timer ${tone}`} aria-live="polite">
      <span className="practice-timer__value">{formatTime(remaining)}</span>
    </div>
  );
}

export default PracticeTimer;
