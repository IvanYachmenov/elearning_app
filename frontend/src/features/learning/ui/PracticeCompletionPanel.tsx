import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { PracticeCompletionPanelProps } from '../types';

function PracticeCompletionPanel({
  topicTitle,
  isTimed,
  timedOut,
  passed,
  scorePercent,
  correctAnswers,
  totalQuestions,
  answeredQuestions,
  onRetry,
  onViewHistory,
  isReviewMode,
}: PracticeCompletionPanelProps) {
  const { t } = useLanguage();
  const accuracy =
    typeof scorePercent === 'number' ? scorePercent : Math.round((correctAnswers * 100) / (totalQuestions || 1));

  const statusLabel = timedOut
    ? t('pages.learning.testFailedTimeUp')
    : passed
      ? t('pages.learning.testPassed')
      : t('pages.learning.testNotPassed');

  const description = timedOut
    ? t('pages.learning.timeExpired')
    : isTimed
      ? t('pages.learning.timedTestRequirement')
      : t('pages.learning.allQuestionsCompleted');

  return (
    <div className="topic-practice__completed-block">
      <p className="topic-practice__completed">{topicTitle} - {statusLabel}</p>
      <p className="topic-practice__subtitle">{description}</p>

      <div className="practice-summary">
        <div className="practice-summary__item">
          <div className="practice-summary__label">{t('pages.learning.correct')}</div>
          <div className="practice-summary__value">{correctAnswers}/{totalQuestions}</div>
        </div>
        <div className="practice-summary__item">
          <div className="practice-summary__label">{t('pages.learning.answered')}</div>
          <div className="practice-summary__value">{answeredQuestions}/{totalQuestions}</div>
        </div>
        <div className="practice-summary__item">
          <div className="practice-summary__label">{t('pages.learning.accuracy')}</div>
          <div className="practice-summary__value">{accuracy}%</div>
        </div>
      </div>

      <div className="topic-practice__buttons-row" style={{ marginTop: '12px' }}>
        {onViewHistory && (
          <button
            type="button"
            className="topic-practice__primary-btn topic-practice__history-btn"
            onClick={onViewHistory}
            disabled={isReviewMode}
          >
            {isReviewMode ? t('pages.auth.historyOpened') : t('pages.auth.viewTestHistory')}
          </button>
        )}

        {onRetry && (
          <button type="button" className="topic-practice__secondary-btn" onClick={onRetry}>
            {t('pages.auth.retry')}
          </button>
        )}
      </div>
    </div>
  );
}

export default PracticeCompletionPanel;
