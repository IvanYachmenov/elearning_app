import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { cleanOptionText } from '../lib/text';
import type { PracticeHistorySectionProps } from '../types';

function PracticeHistorySection({ historyQuestions, loading, error }: PracticeHistorySectionProps) {
  const { t } = useLanguage();

  return (
    <section className="topic-practice__history">
      {loading && <p className="topic-practice__empty">{t('pages.learning.loadingTestHistory')}</p>}

      {error && <p style={{ color: '#dc2626', marginTop: '8px' }}>{error}</p>}

      {!loading && !error && historyQuestions.length === 0 && (
        <p className="topic-practice__empty">{t('pages.learning.noAnsweredQuestions')}</p>
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
                    ? t('pages.learning.singleChoice')
                    : question.question_type === 'multiple_choice'
                      ? t('pages.learning.multipleChoice')
                      : t('pages.learning.code')}
                </span>
                <div className="topic-practice__question-text">{question.text}</div>
              </div>

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
                          <span className="topic-practice__option-correct-label">{t('pages.learning.correct')}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {question.is_correct !== null && (
                <div
                  className={
                    'topic-practice__feedback' +
                    (question.is_correct ? ' topic-practice__feedback--success' : ' topic-practice__feedback--fail')
                  }
                  style={{ marginTop: '8px' }}
                >
                  {question.is_correct ? t('pages.learning.correctAnswer') : t('pages.learning.incorrectAnswer')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default PracticeHistorySection;
