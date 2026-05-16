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
  practiceStats,
  onRetry,
  onViewHistory,
  isReviewMode,
}: PracticeCompletionPanelProps) {
  const accuracy =
    typeof scorePercent === 'number' ? scorePercent : Math.round((correctAnswers * 100) / (totalQuestions || 1));
  const resolvedPassed = !timedOut && (passed || accuracy >= 100);
  const shouldShowPracticeStats = Boolean(isTimed && practiceStats && practiceStats.completed_users > 0);
  const shouldShowRetry = Boolean(onRetry && isTimed && !resolvedPassed);
  const summaryClassName = ['practice-summary', isTimed ? 'practice-summary--timed' : ''].filter(Boolean).join(' ');
  const statusClassName = [
    'topic-practice__completed',
    timedOut
      ? 'topic-practice__completed--timeout'
      : resolvedPassed
        ? 'topic-practice__completed--passed'
        : 'topic-practice__completed--failed',
  ].join(' ');

  const statusLabel = timedOut
    ? "Test failed – time is up"
    : resolvedPassed
      ? "Test passed"
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

      {shouldShowPracticeStats && practiceStats && (
        <div className="practice-community-stats" aria-label={"Community statistics"}>
          <p className="practice-community-stats__title">{"Community statistics"}</p>
          <div className="practice-community-stats__item">
            <span>{"Average user success"}</span>
            <strong>{practiceStats.average_success_percent ?? 0}%</strong>
          </div>
          <div className="practice-community-stats__item">
            <span>{"Users completed"}</span>
            <strong>{practiceStats.completed_users}</strong>
          </div>
          <div className="practice-community-stats__item">
            <span>{"Pass rate"}</span>
            <strong>{practiceStats.pass_rate_percent ?? 0}%</strong>
          </div>
        </div>
      )}

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
