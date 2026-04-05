import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { cleanOptionText } from '../lib/text';
import type { PracticeQuestionCardProps } from '../types';

function PracticeQuestionCard({
  question,
  selectedOptions,
  onOptionToggle,
  answerFeedback,
  onSubmit,
  onContinue,
  submitLoading,
  practiceLoading,
  isTimedMode,
  isAnswerLocked,
  disableSubmit,
  showNextButton,
  showFinishButton,
  showTimedNextButton,
  timedAnswerSaved,
}: PracticeQuestionCardProps) {
  const { t } = useLanguage();

  const renderFeedback = () => {
    if (!answerFeedback) {
      return null;
    }

    if (isTimedMode) {
      return <div className="topic-practice__feedback topic-practice__feedback--neutral">{answerFeedback.message}</div>;
    }

    return (
      <div
        className={
          'topic-practice__feedback' +
          (answerFeedback.type === 'success'
            ? ' topic-practice__feedback--success'
            : answerFeedback.type === 'fail'
              ? ' topic-practice__feedback--fail'
              : ' topic-practice__feedback--error')
        }
      >
        {answerFeedback.message}
      </div>
    );
  };

  return (
    <div className="topic-practice__question-card">
      <div className="topic-practice__question-header">
        <span className="topic-practice__type">
          {question.question_type === 'single_choice'
            ? t('pages.learning.singleChoice')
            : question.question_type === 'multiple_choice'
              ? t('pages.learning.multipleChoice')
              : t('pages.learning.code')}
        </span>
        <div className="topic-practice__question-text">{question.text}</div>
      </div>

      <ul className="topic-practice__options">
        {question.options.map((option) => {
          const selected = selectedOptions.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                className={
                  'topic-practice__option-button' +
                  (selected ? ' topic-practice__option-button--selected' : '')
                }
                onClick={() => onOptionToggle(option.id)}
                disabled={isAnswerLocked || submitLoading || practiceLoading}
              >
                <span className="topic-practice__option-indicator">{selected ? 'YES' : 'NO'}</span>
                <span className="topic-practice__option-text">{cleanOptionText(option.text)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="topic-practice__actions">
        {renderFeedback()}
        <div className="topic-practice__buttons-row">
          {!isTimedMode && (!answerFeedback || answerFeedback.type !== 'success') && (
            <button
              type="button"
              className="topic-practice__secondary-btn"
              onClick={onSubmit}
              disabled={submitLoading || !question || disableSubmit}
            >
              {submitLoading
                ? t('pages.auth.submitting')
                : answerFeedback?.type === 'fail'
                  ? t('pages.auth.tryAgain')
                  : t('pages.auth.submitAnswer')}
            </button>
          )}

          {isTimedMode && !timedAnswerSaved && (
            <button
              type="button"
              className="topic-practice__secondary-btn"
              onClick={onSubmit}
              disabled={submitLoading || practiceLoading}
            >
              {submitLoading ? t('pages.auth.saving') : t('pages.auth.submitAnswer')}
            </button>
          )}

          {showNextButton && !isTimedMode && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {t('pages.auth.nextQuestion')}
            </button>
          )}

          {showFinishButton && !isTimedMode && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {t('pages.auth.finishTest')}
            </button>
          )}

          {showTimedNextButton && !showFinishButton && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {t('pages.auth.nextQuestion')}
            </button>
          )}

          {showFinishButton && isTimedMode && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {t('pages.auth.finishTest')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PracticeQuestionCard;
