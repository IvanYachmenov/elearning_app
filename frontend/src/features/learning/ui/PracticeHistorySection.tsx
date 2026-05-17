import { renderHighlightedCode } from '../../../shared/lib/highlightCode';
import { LoadingIndicator } from '../../../shared/ui';
import { cleanOptionText } from '../lib/text';
import type { PracticeHistorySectionProps } from '../types';

function PracticeHistorySection({ historyQuestions, loading, error }: PracticeHistorySectionProps) {

  return (
    <section className="topic-practice__history">
      {loading && <LoadingIndicator compact label={"Loading..."} />}

      {error && <p style={{ color: '#dc2626', marginTop: '8px' }}>{error}</p>}

      {!loading && !error && historyQuestions.length === 0 && (
        <p className="topic-practice__empty">{"No answered questions to display."}</p>
      )}

      {!loading && !error && historyQuestions.length > 0 && (
        <div className="topic-practice__history-list">
          {historyQuestions.map((question) => (
            <div
              key={question.id}
              className="topic-practice__question-card topic-practice__question-card--readonly"
            >
              <div className="topic-practice__question-header">
                <span className="topic-practice__type">
                  {question.question_type === 'single_choice'
                    ? "Single choice"
                    : question.question_type === 'multiple_choice'
                      ? "Multiple choice"
                      : question.question_type === 'javascript_code'
                        ? "JavaScript code"
                        : "Python code"}
                </span>
                <div className="topic-practice__question-text">{question.text}</div>
              </div>

              {(question.question_type === 'code' || question.question_type === 'javascript_code') ? (
                <div className="topic-practice__code-output topic-practice__code-output--history">
                  <figure className="topic-theory__code-block">
                    <figcaption>
                      <span className="topic-theory__code-window-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span>{question.question_type === 'javascript_code' ? 'javascript' : 'python'}</span>
                    </figcaption>
                    <pre>
                      <code>{renderHighlightedCode(question.submitted_code || '')}</code>
                    </pre>
                  </figure>
                  <div className="topic-practice__code-output-row">
                    <span className="topic-practice__code-output-label">{"Output"}</span>
                    <pre className="topic-practice__code-output-box topic-practice__code-output-box--muted">
                      {question.stdout || "No output"}
                    </pre>
                  </div>
                  {question.stderr && (
                    <div className="topic-practice__code-output-row">
                      <span className="topic-practice__code-output-label">{"Error"}</span>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="topic-practice__options">
                  {question.options.map((option) => {
                    const selected = question.user_option_ids?.includes(option.id);
                    const correct = option.is_correct;
                    return (
                      <li key={option.id}>
                        <div
                          className={
                            'topic-practice__option-button topic-practice__option-button_history' +
                            (correct
                              ? ' topic-practice__option-button--success'
                              : selected
                                ? ' topic-practice__option-button--selected-history'
                                : '')
                          }
                        >
                          <span
                            className={
                              'topic-practice__option-indicator' +
                              (correct
                                ? ' topic-practice__option-indicator--correct'
                                : selected
                                  ? ' topic-practice__option-indicator--selected-history'
                                  : '')
                            }
                            aria-hidden="true"
                          />
                          <span className="topic-practice__option-text">{cleanOptionText(option.text)}</span>
                          {correct && (
                            <span className="topic-practice__option-correct-label">{"Correct"}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {question.is_correct !== null && (
                <span
                  className={
                    'topic-practice__verdict' +
                    (question.is_correct
                      ? ' topic-practice__verdict--ok'
                      : ' topic-practice__verdict--bad')
                  }
                  title={question.is_correct ? 'Answered correctly' : 'Answered incorrectly'}
                >
                  {question.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default PracticeHistorySection;
