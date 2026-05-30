import type { PracticeCompletionPanelProps } from '../types';

function formatDuration(seconds: number | null | undefined) {
  if (typeof seconds !== 'number') {
    return '00:00';
  }

  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function PracticeCompletionPanel({
  isTimed,
  timedOut,
  passed,
  scorePercent,
  correctAnswers,
  totalQuestions,
  durationSeconds,
  onRetry,
  onViewHistory,
  isReviewMode,
}: PracticeCompletionPanelProps) {
  const accuracy =
    typeof scorePercent === 'number' ? scorePercent : Math.round((correctAnswers * 100) / (totalQuestions || 1));
  const resolvedPassed = Boolean(passed);
  const shouldShowRetry = Boolean(onRetry && isTimed && !resolvedPassed);
  const summaryClassName = ['practice-summary', isTimed ? 'practice-summary--timed' : ''].filter(Boolean).join(' ');
  const statusClassName = [
    'topic-practice__completed',
    resolvedPassed
      ? 'topic-practice__completed--passed'
      : timedOut
        ? 'topic-practice__completed--timeout'
        : 'topic-practice__completed--failed',
  ].join(' ');

  const statusLabel = resolvedPassed
    ? "Test passed"
    : timedOut
      ? "Test failed – time is up"
      : "Test not passed";

  return (
    <div className="topic-practice__completed-block">
      <p className={statusClassName}>{statusLabel}</p>

      <div className={summaryClassName}>
        <div className="practice-summary__item">
          <div className="practice-summary__label">{"Correct"}</div>
          <div className="practice-summary__value">{correctAnswers}/{totalQuestions}</div>
        </div>
        <div className="practice-summary__item">
          <div className="practice-summary__label">{"Accuracy"}</div>
          <div className="practice-summary__value">{accuracy}%</div>
        </div>
        {isTimed && (
          <div className="practice-summary__item">
            <div className="practice-summary__label">{"Time"}</div>
            <div className="practice-summary__value">{formatDuration(durationSeconds)}</div>
          </div>
        )}
      </div>

      <div className="topic-practice__buttons-row topic-practice__completed-actions">
        {onViewHistory && (
          <button
            type="button"
            className="topic-practice__primary-btn topic-practice__history-btn"
            onClick={onViewHistory}
            disabled={isReviewMode}
          >
            {isReviewMode ? "History opened" : "View test history"}
          </button>
        )}

        {shouldShowRetry && (
          <button type="button" className="topic-practice__secondary-btn" onClick={onRetry}>
            {"Retry"}
          </button>
        )}
      </div>
    </div>
  );
}

export default PracticeCompletionPanel;
