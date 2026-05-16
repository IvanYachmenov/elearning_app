import { AppSelect, AutoGrowTextarea } from '../../../../shared/ui';
import { isCodeQuestion } from '../../../../shared/types';
import type { QuestionType } from '../../../../shared/types';
import type { TeacherEditableQuestion } from '../../model/types';

interface TeacherTopicQuestionsSectionProps {
  questions: TeacherEditableQuestion[];
  onAddQuestion: () => void;
  onDeleteQuestion: (questionIndex: number) => void;
  onQuestionTextChange: (questionIndex: number, value: string) => void;
  onQuestionTypeChange: (questionIndex: number, value: QuestionType) => void;
  onQuestionExpectedOutputChange: (questionIndex: number, value: string) => void;
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
  onQuestionExpectedOutputChange,
  onAddOption,
  onOptionTextChange,
  onOptionCorrectChange,
  onDeleteOption,
}: TeacherTopicQuestionsSectionProps) {

  return (
    <div className="teacher-questions-section">
      <div className="teacher-questions-header">
        <h5 className="teacher-questions-title">{"Questions"}</h5>
        <button className="teacher-add-question-btn" type="button" onClick={onAddQuestion}>
          + {"Add Question"}
        </button>
      </div>

      {questions.length > 0 ? (
        <div className="teacher-questions-list">
          {questions.map((question, questionIndex) => (
            <div key={question.id || questionIndex} className="teacher-question-item">
              <div className="teacher-question-header">
                <h6 className="teacher-question-title">
                  {"Question"} {questionIndex + 1}
                </h6>
                <button
                  className="teacher-question-delete-btn"
                  type="button"
                  onClick={() => onDeleteQuestion(questionIndex)}
                >
                  {"Delete"}
                </button>
              </div>

              <div className="teacher-form-group">
                <label className="teacher-form-label">{"Question Text"}</label>
                <AutoGrowTextarea
                  className="teacher-form-textarea"
                  value={question.text}
                  onChange={(event) => onQuestionTextChange(questionIndex, event.target.value)}
                  placeholder={"Enter question text"}
                  rows={2}
                />
              </div>

              <div className="teacher-form-group">
                <label className="teacher-form-label">{"Question Type"}</label>
                <AppSelect
                  className="app-select--block"
                  ariaLabel="Question type"
                  value={question.question_type}
                  options={[
                    { value: 'single_choice', label: 'Single Choice' },
                    { value: 'multiple_choice', label: 'Multiple Choice' },
                    { value: 'code', label: 'Python Code' },
                    { value: 'javascript_code', label: 'JavaScript Code' },
                  ]}
                  onChange={(next) => onQuestionTypeChange(questionIndex, next as QuestionType)}
                />
              </div>

              {isCodeQuestion(question.question_type) ? (
                <div className="teacher-form-group">
                  <label className="teacher-form-label">{"Expected Output"}</label>
                  <AutoGrowTextarea
                    className="teacher-form-textarea teacher-form-textarea--code-output"
                    value={question.expected_output}
                    onChange={(event) => onQuestionExpectedOutputChange(questionIndex, event.target.value)}
                    placeholder={"Exact stdout, including line breaks"}
                    rows={4}
                  />
                </div>
              ) : (
                <div className="teacher-options-section">
                  <div className="teacher-options-header">
                    <label className="teacher-form-label">{"Options"}</label>
                    <button
                      className="teacher-add-option-btn"
                      type="button"
                      onClick={() => onAddOption(questionIndex)}
                    >
                      + {"Add Option"}
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
                              placeholder={"Option text"}
                            />
                            <label className="teacher-form-checkbox-label">
                              <input
                                type={question.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                                name={`question-${questionIndex}`}
                                checked={option.is_correct}
                                onChange={(event) => onOptionCorrectChange(questionIndex, optionIndex, event.target.checked)}
                              />
                              {"Correct"}
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
                    <p className="teacher-empty-text-small">{"No options yet. Add at least 2 options."}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="teacher-empty-text-small">{"No questions yet. Click \"Add Question\" to create one."}</p>
      )}
    </div>
  );
}

export default TeacherTopicQuestionsSection;
