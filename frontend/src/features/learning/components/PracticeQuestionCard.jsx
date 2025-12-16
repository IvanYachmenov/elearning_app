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
    showTimedNextButton,
    timedAnswerSaved,
}) {
    const renderFeedback = () => {
        if (!answerFeedback || isTimedMode) return null;
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
            <div className="topic-practice__question-meta">
                <span/>
                <span className="topic-practice__type">
                    {question.question_type === 'single_choice'
                        ? 'Single choice'
                        : question.question_type === 'multiple_choice'
                            ? 'Multiple choice'
                            : 'Code'}
                </span>
            </div>

            <div className="topic-practice__question-text">
                {question.text}
            </div>

            <ul className="topic-practice__options">
                {question.options.map((opt) => {
                    const selected = selectedOptions.includes(opt.id);
                    return (
                        <li key={opt.id}>
                            <button
                                type="button"
                                className={
                                    'topic-practice__option-button' +
                                    (selected
                                        ? ' topic-practice__option-button--selected'
                                        : '')
                                }
                                onClick={() => onOptionToggle(opt.id)}
                                disabled={isAnswerLocked || submitLoading || practiceLoading}
                            >
                                <span className="topic-practice__option-indicator">
                                    {selected ? '●' : '○'}
                                </span>
                                <span className="topic-practice__option-text">
                                    {opt.text}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <div className="topic-practice__actions">
                {renderFeedback()}
                {isTimedMode && timedAnswerSaved && (
                    <div className="topic-practice__feedback topic-practice__feedback--neutral">
                        Answer accepted!
                    </div>
                )}
                <div className="topic-practice__buttons-row">
                    {!isTimedMode && (!answerFeedback || answerFeedback.type !== 'success') && (
                        <button
                            type="button"
                            className="topic-practice__secondary-btn"
                            onClick={onSubmit}
                            disabled={
                                submitLoading ||
                                !question ||
                                disableSubmit
                            }
                        >
                            {submitLoading ? 'Submitting...' : answerFeedback?.type === 'fail' ? 'Try again' : 'Submit answer'}
                        </button>
                    )}

                    {isTimedMode && !timedAnswerSaved && (
                        <button
                            type="button"
                            className="topic-practice__secondary-btn"
                            onClick={onSubmit}
                            disabled={submitLoading || practiceLoading}
                        >
                            {submitLoading ? 'Saving...' : 'Submit answer'}
                        </button>
                    )}

                    {showNextButton && !isTimedMode && (
                        <button
                            type="button"
                            className="topic-practice__secondary-btn"
                            onClick={onContinue}
                            disabled={practiceLoading}
                        >
                            Next question
                        </button>
                    )}

                    {showTimedNextButton && (
                        <button
                            type="button"
                            className="topic-practice__secondary-btn"
                            onClick={onContinue}
                            disabled={practiceLoading}
                        >
                            Next question
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PracticeQuestionCard;