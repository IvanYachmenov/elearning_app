import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {api} from '../../../api/client';
import '../learning.css';

import PracticeQuestionCard from '../components/PracticeQuestionCard';
import PracticeHistorySection from '../components/PracticeHistorySection';
import PracticeCompletionPanel from '../components/PracticeCompletionPanel';
import PracticeTimer from '../components/PracticeTimer';
import {useNavigationLock} from '../../../shared/contexts/NavigationLockContext';

function TopicPracticePage() {
    const {courseId, topicId} = useParams();
    const navigate = useNavigate();
    const {lockNavigation, unlockNavigation} = useNavigationLock();

    const [topic, setTopic] = useState(null);
    const [loadingTopic, setLoadingTopic] = useState(true);
    const [error, setError] = useState(null);

    const [practiceLoading, setPracticeLoading] = useState(false);
    const [practiceQuestion, setPracticeQuestion] = useState(null);
    const [practiceCompleted, setPracticeCompleted] = useState(false);

    const [timedOut, setTimedOut] = useState(false);
    const [passed, setPassed] = useState(false);
    const [scorePercent, setScorePercent] = useState(null);

    const [selectedOptions, setSelectedOptions] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState(null);

    const [topicProgressPercent, setTopicProgressPercent] = useState(0);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);

    const [isTimedMode, setIsTimedMode] = useState(false);
    const [timeLimitSeconds, setTimeLimitSeconds] = useState(null);
    const [remainingSeconds, setRemainingSeconds] = useState(null);

    const [isReviewMode, setIsReviewMode] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [historyQuestions, setHistoryQuestions] = useState([]);

    const [timedAnswerSaved, setTimedAnswerSaved] = useState(false);

    const timerExpiredRef = useRef(false);

    // load topic meta data
    useEffect(() => {
        if (!topicId) return;

        setLoadingTopic(true);
        setError(null);

        api
            .get(`/api/learning/topics/${topicId}/`)
            .then((resp) => {
                const data = resp.data;

                setTopic(data);
                setTopicProgressPercent(data.progress_percent ?? 0);
                setAnsweredCount(data.answered_questions ?? 0);
                setCorrectAnswers(data.correct_answers ?? data.answered_questions ?? 0);
                setTotalQuestions(data.total_questions ?? 0);

                const timed = Boolean(data.is_timed_test);
                setIsTimedMode(timed);

                if (timed && typeof data.time_limit_seconds === 'number') {
                    setTimeLimitSeconds(data.time_limit_seconds);
                }

                // if backend marks it completed via progress
                if ((data.total_questions ?? 0) > 0 && (data.progress_percent ?? 0) >= 100) {
                    setPracticeCompleted(true);
                }
            })
            .catch((err) => {
                console.error(err);
                if (err.response && err.response.status === 404) {
                    setError('Topic not found or you are not enrolled.');
                } else if (err.response && err.response.status === 403) {
                    setError('You are not enrolled in this course.');
                } else {
                    setError('Failed to load topic.');
                }
            })
            .finally(() => setLoadingTopic(false));
    }, [topicId]);

    const applyPracticePayload = useCallback((data, options = {}) => {
        const {preserveQuestion = false} = options;

        setAnsweredCount((prev) => data.answered_questions ?? prev ?? 0);
        setCorrectAnswers((prev) => data.correct_answers ?? data.answered_questions ?? prev ?? 0);
        setTotalQuestions((prev) => data.total_questions ?? prev ?? 0);

        if (typeof data.progress_percent === 'number') {
            setTopicProgressPercent(data.progress_percent);
        }
        if (typeof data.score_percent === 'number') {
            setScorePercent(data.score_percent);
        }

        const timed = Boolean(data.is_timed);
        setIsTimedMode(timed);

        if (timed) {
            if (typeof data.time_limit_seconds === 'number') {
                setTimeLimitSeconds(data.time_limit_seconds);
            }
            if (typeof data.remaining_seconds === 'number') {
                setRemainingSeconds(data.remaining_seconds);
                if (data.remaining_seconds > 0) {
                    timerExpiredRef.current = false;
                }
            }
        }

        const completedFlag = Boolean(data.completed || data.test_completed);
        setPracticeCompleted(completedFlag);
        setTimedOut(Boolean(data.timed_out));
        setPassed(Boolean(data.passed));

        if (completedFlag) {
            setPracticeQuestion(null);
            setSelectedOptions([]);
            setAnswerFeedback(null);
            setTimedAnswerSaved(false);
            return;
        }

        setPracticeQuestion((prev) => data.question || (preserveQuestion ? prev : null));

        // Only show feedback in non-timed mode
        if (data.last_answer && !timed) {
            setSelectedOptions(data.last_answer.selected_option_ids || []);
            setAnswerFeedback({
                type: data.last_answer.is_correct ? 'success' : 'fail',
                message: data.last_answer.is_correct ? 'Correct answer!' : 'Incorrect answer.',
                score: data.last_answer.score,
            });
        } else {
            setSelectedOptions((prev) => (timed && preserveQuestion ? prev : []));
            setAnswerFeedback(null);
            setTimedAnswerSaved(false);
        }
    }, []);

    const fetchNextQuestion = useCallback(() => {
        if (!topicId) return;

        setPracticeLoading(true);
        setTimedAnswerSaved(false);

        api
            .get(`/api/learning/topics/${topicId}/next-question/`)
            .then((resp) => applyPracticePayload(resp.data))
            .catch((err) => {
                console.error(err);
                setSelectedOptions([]);
                setAnswerFeedback({
                    type: 'error',
                    message: 'Failed to load next question.',
                });
            })
            .finally(() => setPracticeLoading(false));
    }, [applyPracticePayload, topicId]);

    // fetch first question once topic meta is loaded
    useEffect(() => {
        if (
            !loadingTopic &&
            !error &&
            topic &&
            totalQuestions > 0 &&
            !practiceQuestion &&
            !practiceCompleted &&
            !practiceLoading
        ) {
            fetchNextQuestion();
        }
    }, [loadingTopic, error, topic, totalQuestions, practiceQuestion, practiceCompleted, practiceLoading, fetchNextQuestion]);

    // load history when toggling review mode
    useEffect(() => {
        if (!isReviewMode) return;
        if (!topicId) return;

        setHistoryLoading(true);
        setHistoryError(null);

        api
            .get(`/api/learning/topics/${topicId}/history/`)
            .then((resp) => {
                const data = resp.data;
                setHistoryQuestions(data.questions || []);
            })
            .catch((err) => {
                console.error(err);
                if (err.response && err.response.status === 400) {
                    setHistoryError('History is available only after you finish this topic.');
                } else {
                    setHistoryError('Failed to load test history.');
                }
            })
            .finally(() => setHistoryLoading(false));
    }, [isReviewMode, topicId]);

    // manage navigation lock for timed mode (NO redirects!)
    useEffect(() => {
        const shouldLock = isTimedMode && !practiceCompleted && !timedOut && !!practiceQuestion;

        if (shouldLock) {
            lockNavigation(
                'Timed test in progress. Navigation is locked until you finish or exit the test.',
                [`/learning/courses/${courseId}/topics/${topicId}/practice`],
            );
            return () => unlockNavigation();
        }

        unlockNavigation();
        return undefined;
    }, [courseId, isTimedMode, lockNavigation, practiceCompleted, practiceQuestion, timedOut, topicId, unlockNavigation]);

    // countdown timer (stable interval, no restart every second)
    const hasTimer = remainingSeconds !== null && remainingSeconds !== undefined;

    useEffect(() => {
        if (!isTimedMode || practiceCompleted || timedOut) return undefined;
        if (!hasTimer) return undefined;

        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev === null || prev === undefined) return prev;
                return Math.max(prev - 1, 0);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimedMode, practiceCompleted, timedOut, hasTimer]);

    // handle time expiration: let backend decide timed_out on next-question response
    useEffect(() => {
        if (!isTimedMode || practiceCompleted) return;
        if (remainingSeconds !== 0 || timerExpiredRef.current) return;

        timerExpiredRef.current = true;
        fetchNextQuestion();
    }, [fetchNextQuestion, isTimedMode, practiceCompleted, remainingSeconds]);

    const handleBackToTheory = () => {
        if (courseId) {
            navigate(`/learning/courses/${courseId}/topics/${topicId}`);
        } else if (topic && topic.course_id) {
            navigate(`/learning/courses/${topic.course_id}/topics/${topic.id}`);
        } else {
            navigate('/learning');
        }
    };

    const handleOptionToggle = (optionId) => {
        if (!practiceQuestion) return;
         if (isTimedMode && timedAnswerSaved) return;

        const locked = !!answerFeedback && answerFeedback.type === 'success' && !isTimedMode;
        if (locked) return;

        if (practiceQuestion.question_type === 'single_choice') {
            setSelectedOptions([optionId]);
        } else {
            setSelectedOptions((prev) =>
                prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
            );
        }
    };

    const handleContinueTimed = () => {
        if (!practiceQuestion) return;

        setSubmitLoading(true);

        api
            .post(`/api/learning/questions/${practiceQuestion.id}/answer/`, {
                selected_options: selectedOptions, // can be []
            })
            .then((resp) => {
                const data = resp.data;

                applyPracticePayload(
                    {
                        ...data,
                        completed: data.test_completed,
                    },
                    {preserveQuestion: !data.test_completed && !data.timed_out},
                );

                if (data.test_completed || data.timed_out) {
                    setPracticeCompleted(true);
                    setTimedOut(Boolean(data.timed_out));
                    setPassed(Boolean(data.passed));
                    setPracticeQuestion(null);
                    setTimedAnswerSaved(false);
                } else {
                    setTimedAnswerSaved(true);
                }
            })
            .catch((err) => {
                console.error(err);
                setAnswerFeedback({
                    type: 'error',
                    message: 'Failed to submit answer. Please try again.',
                });
            })
            .finally(() => {
                setSubmitLoading(false);
            });
    };

    const handleSubmitAnswer = () => {
        if (!practiceQuestion) return;

        if (isTimedMode) {
            handleContinueTimed();
            return;
        }

        if (selectedOptions.length === 0) {
            setAnswerFeedback({
                type: 'error',
                message: 'Please select at least one option.',
            });
            return;
        }

        setSubmitLoading(true);
        setAnswerFeedback(null);

        api
            .post(`/api/learning/questions/${practiceQuestion.id}/answer/`, {
                selected_options: selectedOptions,
            })
            .then((resp) => {
                const data = resp.data;

                setAnswerFeedback({
                    type: data.is_correct ? 'success' : 'fail',
                    message: data.is_correct ? 'Correct answer!' : 'Incorrect answer.',
                    score: data.score,
                });

                setTotalQuestions(data.total_questions ?? totalQuestions);

                if (data.is_correct) {
                    setAnsweredCount(data.answered_questions ?? answeredCount);
                    setCorrectAnswers(data.correct_answers ?? data.answered_questions ?? answeredCount);

                    if (typeof data.topic_progress_percent === 'number') {
                        setTopicProgressPercent(data.topic_progress_percent);
                        if (data.topic_progress_percent >= 100 || data.test_completed) {
                            setPracticeCompleted(true);
                            setTopic((prev) => (prev ? {...prev, status: 'completed'} : prev));
                        }
                    }
                }
            })
            .catch((err) => {
                console.error(err);
                setAnswerFeedback({
                    type: 'error',
                    message: 'Failed to submit answer. Please try again.',
                });
            })
            .finally(() => setSubmitLoading(false));
    };

    const handleContinue = () => {
        if (isTimedMode) {
            fetchNextQuestion();
            return;
        }
        fetchNextQuestion();
    };

    const handleRetry = () => {
        if (!topicId) return;

        setPracticeLoading(true);
        timerExpiredRef.current = false;

        api
            .post(`/api/learning/topics/${topicId}/reset/`)
            .then(() => {
                setPracticeCompleted(false);
                setTimedOut(false);
                setPassed(false);
                setAnswerFeedback(null);
                setSelectedOptions([]);
                setScorePercent(null);
                setIsReviewMode(false);
                fetchNextQuestion();
            })
            .catch((err) => {
                console.error(err);
                setAnswerFeedback({
                    type: 'error',
                    message: 'Failed to restart the test. Please try again.',
                });
            })
            .finally(() => setPracticeLoading(false));
    };

    const canPractice = useMemo(() => totalQuestions > 0, [totalQuestions]);
    const isAnswerLocked =
        (!!answerFeedback && answerFeedback.type === 'success' && !isTimedMode) ||
        (isTimedMode && timedAnswerSaved);
    const showNextButton =
        !isTimedMode &&
        !!answerFeedback &&
        answerFeedback.type === 'success' &&
        answeredCount <= totalQuestions;
    const showTimedNextButton = isTimedMode && timedAnswerSaved;
    if (loadingTopic && !topic) {
        return <div className="page page-enter"/>;
    }

    if (error || !topic) {
        return (
            <div className="page page-enter">
                <p style={{color: '#dc2626'}}>{error || 'Topic not found.'}</p>
                <button
                    type="button"
                    className="learning-back-link"
                    onClick={() => navigate('/learning')}
                    style={{marginTop: '16px'}}
                >
                    ← Back to My Learning
                </button>
            </div>
        );
    }

    return (
        <div className="page page-enter">
            <header className="topic-page-header">
                <button
                    type="button"
                    className="learning-back-link"
                    onClick={handleBackToTheory}
                >
                    ← Back to theory
                </button>

                <div className="topic-meta">
                    {topic.course_title} · {topic.module_title}
                </div>

                <h1 className="page__title">{topic.title} – Practice</h1>
            </header>

            <section className="topic-practice">
                <header className="topic-practice__header">
                    <div className="topic-practice__progress">
                        <div className="topic-practice__progress-info">
                            <span>
                                {answeredCount}/{totalQuestions} questions
                            </span>
                        </div>
                        <div className="learning-progress-bar">
                            <div
                                className="learning-progress-bar__fill"
                                style={{width: `${topicProgressPercent}%`}}
                            />
                        </div>
                    </div>

                    {isTimedMode && (
                        <PracticeTimer
                            remainingSeconds={remainingSeconds}
                            timeLimitSeconds={timeLimitSeconds}
                            isActive={!practiceCompleted && !timedOut}
                            timedOut={timedOut}
                        />
                    )}
                </header>

                {!canPractice && (
                    <p className="topic-practice__empty">
                        There are no practice questions for this topic yet.
                    </p>
                )}

                {canPractice && (
                    <>
                        {practiceLoading && !practiceQuestion && (
                            <p className="topic-practice__empty">Loading question...</p>
                        )}

                        {practiceCompleted && !practiceQuestion && !practiceLoading && !isReviewMode && (
                            <PracticeCompletionPanel
                                topicTitle={topic.title}
                                isTimed={isTimedMode}
                                timedOut={timedOut}
                                passed={passed}
                                scorePercent={scorePercent}
                                correctAnswers={correctAnswers}
                                totalQuestions={totalQuestions}
                                answeredQuestions={answeredCount}
                                onRetry={handleRetry}
                                onViewHistory={() => setIsReviewMode(true)}
                                isReviewMode={isReviewMode}
                            />
                        )}

                        {practiceCompleted && isReviewMode && (
                            <PracticeHistorySection
                                historyQuestions={historyQuestions}
                                loading={historyLoading}
                                error={historyError}
                            />
                        )}

                        {!practiceCompleted && practiceQuestion && (
                            <PracticeQuestionCard
                                question={practiceQuestion}
                                selectedOptions={selectedOptions}
                                onOptionToggle={handleOptionToggle}
                                answerFeedback={answerFeedback}
                                onSubmit={handleSubmitAnswer}
                                onContinue={handleContinue}
                                submitLoading={submitLoading}
                                practiceLoading={practiceLoading}
                                isTimedMode={isTimedMode}
                                isAnswerLocked={isAnswerLocked}
                                timedAnswerSaved={timedAnswerSaved}
                                // important: in timed mode Continue must NOT be blocked by empty selection
                                disableSubmit={!isTimedMode && selectedOptions.length === 0}
                                showNextButton={showNextButton}
                                showTimedNextButton={showTimedNextButton}
                            />
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

export default TopicPracticePage;
