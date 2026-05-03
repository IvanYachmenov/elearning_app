import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { LoadingIndicator } from '../../../shared/ui';
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
  hints,
  hintsOpen,
  hintsLoading,
  hintsError,
  activeHintIndex,
  hintDraft,
  hintSubmitLoading,
  canPostHint,
  onToggleHints,
  onNextHint,
  onHintDraftChange,
  onSubmitHint,
}: PracticeQuestionCardProps) {
  const { t } = useLanguage();
  const hintCharacterLimit = 280;
  const activeHint = hints[activeHintIndex] ?? null;
  const hasMoreHints = hints.length > 1 && activeHintIndex < hints.length - 1;
  const isLastHint = hints.length > 1 && activeHintIndex === hints.length - 1;

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
                <span
                  className={
                    'topic-practice__option-indicator' +
                    (selected ? ' topic-practice__option-indicator--selected' : '')
                  }
                  aria-hidden="true"
                />
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

          <button
            type="button"
            className="topic-practice__hint-toggle"
            onClick={onToggleHints}
            disabled={practiceLoading}
            aria-expanded={hintsOpen}
          >
            <span className="topic-practice__hint-icon" aria-hidden="true" />
            <span>{hintsOpen ? t('pages.learning.hideHints') : t('pages.learning.hint')}</span>
          </button>
        </div>

        {hintsOpen && (
          <div className="topic-practice__hint-panel">
            {hintsLoading && <LoadingIndicator compact label={t('common.loading')} />}

            {!hintsLoading && hintsError && (
              <p className="topic-practice__hint-error">{hintsError}</p>
            )}

            {!hintsLoading && !hintsError && activeHint && (
              <article className="topic-practice__hint-card">
                <p className="topic-practice__hint-text">{activeHint.text}</p>
                <div className="topic-practice__hint-meta">
                  {activeHint.author_name} - {new Date(activeHint.created_at).toLocaleDateString()}
                </div>
                {hasMoreHints && (
                  <button
                    type="button"
                    className="topic-practice__secondary-btn topic-practice__hint-next"
                    onClick={onNextHint}
                  >
                    {t('pages.learning.nextHint')}
                  </button>
                )}
                {isLastHint && (
                  <p className="topic-practice__hint-end">{t('pages.learning.noMoreHints')}</p>
                )}
              </article>
            )}

            {!hintsLoading && !hintsError && !activeHint && (
              <p className="topic-practice__hint-empty">{t('pages.learning.noHintsYet')}</p>
            )}

            {canPostHint ? (
              <form
                className="topic-practice__hint-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmitHint();
                }}
              >
                <textarea
                  className="topic-practice__hint-input"
                  value={hintDraft}
                  onChange={(event) => onHintDraftChange(event.target.value)}
                  placeholder={t('pages.learning.hintPlaceholder')}
                  rows={2}
                  maxLength={hintCharacterLimit}
                  disabled={hintSubmitLoading}
                />
                <button
                  type="submit"
                  className="topic-practice__secondary-btn topic-practice__hint-submit"
                  disabled={hintSubmitLoading || hintDraft.trim().length === 0}
                >
                  {hintSubmitLoading ? t('pages.learning.postingHint') : t('pages.learning.postHint')}
                </button>
              </form>
            ) : (
              <p className="topic-practice__hint-locked">{t('pages.learning.hintPostLocked')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PracticeQuestionCard;
