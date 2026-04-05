import type { QuestionType } from '../../../../shared/types';
import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { TeacherEditableQuestion } from '../../model/types';

interface TeacherTopicQuestionsSectionProps {
  questions: TeacherEditableQuestion[];
  onAddQuestion: () => void;
  onDeleteQuestion: (questionIndex: number) => void;
  onQuestionTextChange: (questionIndex: number, value: string) => void;
  onQuestionTypeChange: (questionIndex: number, value: QuestionType) => void;
  onQuestionScoreChange: (questionIndex: number, value: number) => void;
  onAddOption: (questionIndex: number) => void;
  onOptionTextChange: (questionIndex: number, optionIndex: number, value: string) => void;
  onOptionCorrectChange: (questionIndex: number, optionIndex: number, checked: boolean) => void;
  onDeleteOption: (questionIndex: number, optionIndex: number) => void;
}

function TeacherTopicQuestionsSection({
  questions,
  onAddQuestion,
  onDeleteQuestion,
  onQuestionTextChange,
  onQuestionTypeChange,
  onQuestionScoreChange,
  onAddOption,
  onOptionTextChange,
  onOptionCorrectChange,
  onDeleteOption,
}: TeacherTopicQuestionsSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="teacher-questions-section">
      <div className="teacher-questions-header">
        <h5 className="teacher-questions-title">{t('pages.teacher.questions')}</h5>
        <button className="teacher-add-question-btn" type="button" onClick={onAddQuestion}>
          + {t('pages.teacher.addQuestion')}
        </button>
      </div>

      {questions.length > 0 ? (
        <div className="teacher-questions-list">
          {questions.map((question, questionIndex) => (
            <div key={question.id || questionIndex} className="teacher-question-item">
              <div className="teacher-question-header">
                <h6 className="teacher-question-title">
                  {t('pages.teacher.question')} {questionIndex + 1}
                </h6>
                <button
                  className="teacher-question-delete-btn"
                  type="button"
                  onClick={() => onDeleteQuestion(questionIndex)}
                >
                  {t('pages.teacher.delete')}
                </button>
              </div>

              <div className="teacher-form-group">
                <label className="teacher-form-label">{t('pages.teacher.questionText')}</label>
                <textarea
                  className="teacher-form-textarea"
                  value={question.text}
                  onChange={(event) => onQuestionTextChange(questionIndex, event.target.value)}
                  placeholder={t('pages.teacher.enterQuestionText')}
                  rows={2}
                />
              </div>

              <div className="teacher-form-group">
                <label className="teacher-form-label">{t('pages.teacher.questionType')}</label>
                <select
                  className="teacher-form-input"
                  value={question.question_type}
                  onChange={(event) => onQuestionTypeChange(questionIndex, event.target.value as QuestionType)}
                >
                  <option value="single_choice">{t('pages.teacher.singleChoice')}</option>
                  <option value="multiple_choice">{t('pages.teacher.multipleChoice')}</option>
                </select>
              </div>

              <div className="teacher-form-group">
                <label className="teacher-form-label">{t('pages.teacher.maxScore')}</label>
                <input
                  type="number"
                  className="teacher-form-input"
                  value={question.max_score || 100}
                  onChange={(event) => onQuestionScoreChange(questionIndex, Number(event.target.value) || 100)}
                  min="1"
                  max="100"
                />
              </div>

              <div className="teacher-options-section">
                <div className="teacher-options-header">
                  <label className="teacher-form-label">{t('pages.teacher.options')}</label>
                  <button
                    className="teacher-add-option-btn"
                    type="button"
                    onClick={() => onAddOption(questionIndex)}
                  >
                    + {t('pages.teacher.addOption')}
                  </button>
                </div>

                {question.options.length > 0 ? (
                  <div className="teacher-options-list">
                    {question.options.map((option, optionIndex) => (
                      <div key={option.id || optionIndex} className="teacher-option-item">
                        <div className="teacher-option-content">
                          <input
                            type="text"
                            className="teacher-form-input"
                            value={option.text}
                            onChange={(event) => onOptionTextChange(questionIndex, optionIndex, event.target.value)}
                            placeholder={t('pages.teacher.optionText')}
                          />
                          <label className="teacher-form-checkbox-label">
                            <input
                              type={question.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                              name={`question-${questionIndex}`}
                              checked={option.is_correct}
                              onChange={(event) => onOptionCorrectChange(questionIndex, optionIndex, event.target.checked)}
                            />
                            {t('pages.teacher.correct')}
                          </label>
                          <button
                            className="teacher-option-delete-btn"
                            type="button"
                            onClick={() => onDeleteOption(questionIndex, optionIndex)}
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="teacher-empty-text-small">{t('pages.teacher.noOptionsYet')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="teacher-empty-text-small">{t('pages.teacher.noQuestionsYet')}</p>
      )}
    </div>
  );
}

export default TeacherTopicQuestionsSection;
