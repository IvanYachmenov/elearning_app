import { LoadingIndicator } from '../../../shared/ui';
import { isCodeQuestion } from '../../../shared/types';
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
  const hintCharacterLimit = 280;
  const activeHint = hints[activeHintIndex] ?? null;
  const hasMoreHints = hints.length > 1 && activeHintIndex < hints.length - 1;
  const isLastHint = hints.length > 1 && activeHintIndex === hints.length - 1;
  const isCode = isCodeQuestion(question.question_type);
  const codeLabel = question.question_type === 'javascript_code' ? 'JavaScript code' : 'Python code';

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
            ? "Single choice"
            : question.question_type === 'multiple_choice'
              ? "Multiple choice"
              : "Code"}
        </span>
        <div className="topic-practice__question-text">{question.text}</div>
      </div>

      {isCode ? (
        <div className="topic-practice__code-area">
          <label className="topic-practice__code-label" htmlFor={`code-question-${question.id}`}>
            {codeLabel}
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
                <span className="topic-practice__code-output-label">{"Output"}</span>
                <pre className="topic-practice__code-output-box">
                  {codeRunResult.stdout || "No output"}
                </pre>
              </div>
              {(codeRunResult.stderr || codeRunResult.timed_out || codeRunResult.exit_code !== 0) && (
                <div className="topic-practice__code-output-row">
                  <span className="topic-practice__code-output-label">{"Errors"}</span>
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
          {isCode && (
            <button
              type="button"
              className="topic-practice__secondary-btn"
              onClick={onRunCode}
              disabled={codeRunLoading || submitLoading || practiceLoading || isAnswerLocked}
            >
              {codeRunLoading ? "Running" : "Run"}
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
                ? "Submitting..."
                : answerFeedback?.type === 'fail'
                  ? "Try again"
                  : "Submit answer"}
            </button>
          )}

          {isTimedMode && !timedAnswerSaved && (
            <button
              type="button"
              className="topic-practice__secondary-btn"
              onClick={onSubmit}
              disabled={submitLoading || codeRunLoading || practiceLoading}
            >
              {submitLoading ? "Saving..." : "Submit answer"}
            </button>
          )}

          {showNextButton && !isTimedMode && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {"Next question"}
            </button>
          )}

          {showFinishButton && !isTimedMode && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {"Finish test"}
            </button>
          )}

          {showTimedNextButton && !showFinishButton && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {"Next question"}
            </button>
          )}

          {showFinishButton && isTimedMode && (
            <button type="button" className="topic-practice__secondary-btn" onClick={onContinue} disabled={practiceLoading}>
              {"Finish test"}
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
            <span>{hintsOpen ? "Hide hints" : "Hint"}</span>
          </button>
        </div>

        {hintsOpen && (
          <div className="topic-practice__hint-panel">
            {hintsLoading && <LoadingIndicator compact label={"Loading..."} />}

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
                    {"Next hint"}
                  </button>
                )}
                {isLastHint && (
                  <p className="topic-practice__hint-end">{"No more hints for this question."}</p>
                )}
              </article>
            )}

            {!hintsLoading && !hintsError && !activeHint && (
              <p className="topic-practice__hint-empty">{"No hints yet. Be the first to add one."}</p>
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
                  placeholder={"Write a useful hint for this question..."}
                  rows={2}
                  maxLength={hintCharacterLimit}
                  disabled={hintSubmitLoading}
                />
                <button
                  type="submit"
                  className="topic-practice__secondary-btn topic-practice__hint-submit"
                  disabled={hintSubmitLoading || hintDraft.trim().length === 0}
                >
                  {hintSubmitLoading ? "Posting..." : "Post hint"}
                </button>
              </form>
            ) : (
              <p className="topic-practice__hint-locked">{"You can add a hint after answering this question correctly."}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PracticeQuestionCard;
