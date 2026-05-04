import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { LoadingIndicator } from '../../../shared/ui';
import { cleanOptionText } from '../lib/text';
import type { PracticeQuestionCardProps } from '../types';

function PracticeQuestionCard({
  question,
  selectedOptions,
  onOptionToggle,
  codeAnswer,
  codeRunResult,
  codeRunLoading,
  onCodeChange,
  onRunCode,
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
  const isCodeQuestion = question.question_type === 'code';

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

      {isCodeQuestion ? (
        <div className="topic-practice__code-area">
          <label className="topic-practice__code-label" htmlFor={`code-question-${question.id}`}>
            {t('pages.learning.codeEditor')}
          </label>
          <div className="topic-practice__code-editor-window">
            <div className="topic-practice__code-editor-titlebar">
              <span className="topic-theory__code-window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>python</span>
            </div>
            <textarea
              id={`code-question-${question.id}`}
              className="topic-practice__code-editor"
              value={codeAnswer}
              onChange={(event) => onCodeChange(event.target.value)}
              spellCheck={false}
              rows={10}
              disabled={isAnswerLocked || submitLoading || practiceLoading}
            />
          </div>

          {codeRunResult && (
            <div className="topic-practice__code-output">
              <div className="topic-practice__code-output-row">
                <span className="topic-practice__code-output-label">{t('pages.learning.output')}</span>
                <pre className="topic-practice__code-output-box">
                  {codeRunResult.stdout || t('pages.learning.noOutput')}
                </pre>
              </div>
              {(codeRunResult.stderr || codeRunResult.timed_out || codeRunResult.exit_code !== 0) && (
                <div className="topic-practice__code-output-row">
                  <span className="topic-practice__code-output-label">{t('pages.learning.stderr')}</span>
                  <pre className="topic-practice__code-output-box topic-practice__code-output-box--error">
                    {codeRunResult.timed_out ? 'Execution timed out.' : codeRunResult.stderr || `Exit code ${codeRunResult.exit_code}`}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
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
      )}

      <div className="topic-practice__actions">
        {renderFeedback()}
        <div className="topic-practice__buttons-row">
          {isCodeQuestion && (
            <button
              type="button"
              className="topic-practice__secondary-btn"
              onClick={onRunCode}
              disabled={codeRunLoading || submitLoading || practiceLoading || isAnswerLocked}
            >
              {codeRunLoading ? t('pages.learning.runningCode') : t('pages.learning.runCode')}
            </button>
          )}

          {!isTimedMode && (!answerFeedback || answerFeedback.type !== 'success') && (
            <button
              type="button"
              className="topic-practice__secondary-btn"
              onClick={onSubmit}
              disabled={submitLoading || codeRunLoading || !question || disableSubmit}
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
              disabled={submitLoading || codeRunLoading || practiceLoading}
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
