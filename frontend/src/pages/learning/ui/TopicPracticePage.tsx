import { isAxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  PracticeCompletionPanel,
  PracticeHistorySection,
  PracticeQuestionCard,
  PracticeTimer,
} from '../../../features/learning';
import type { PracticeAnswerFeedback } from '../../../features/learning/types';
import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { useNavigationLock } from '../../../shared/lib/navigation-lock';
import type {
  CodeRunResult,
  PracticeHistoryQuestion,
  PracticeQuestion,
  PracticeQuestionHint,
  PracticeQuestionHintsResponse,
  PracticeStats,
  TopicTheory,
} from '../../../shared/types';
import { LoadingIndicator } from '../../../shared/ui';
import type { PracticeApiPayload, TopicRouteParams, TopicHistoryResponse } from '../model/types';
import '../styles/learning.css';

interface PracticePayloadOptions {
  preserveQuestion?: boolean;
}

const isPassingScore = (score: number | null | undefined) => typeof score === 'number' && score >= 100;

const resolvePassedState = (passed: boolean | undefined, score: number | null | undefined, timedOut: boolean) => {
  if (timedOut) {
    return false;
  }

  return Boolean(passed) || isPassingScore(score);
};

function TopicPracticePage() {
  const { courseId, topicId } = useParams<TopicRouteParams>();
  const navigate = useNavigate();
  const { lockNavigation, unlockNavigation } = useNavigationLock();
  const { t } = useLanguage();

  const [topic, setTopic] = useState<TopicTheory | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceQuestion, setPracticeQuestion] = useState<PracticeQuestion | null>(null);
  const [practiceCompleted, setPracticeCompleted] = useState(false);

  const [timedOut, setTimedOut] = useState(false);
  const [passed, setPassed] = useState(false);
  const [scorePercent, setScorePercent] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null);

  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [codeRunResult, setCodeRunResult] = useState<CodeRunResult | null>(null);
  const [codeRunLoading, setCodeRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<PracticeAnswerFeedback | null>(null);

  const [topicProgressPercent, setTopicProgressPercent] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [isTimedMode, setIsTimedMode] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const [isReviewMode, setIsReviewMode] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyQuestions, setHistoryQuestions] = useState<PracticeHistoryQuestion[]>([]);

  const [timedAnswerSaved, setTimedAnswerSaved] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [questionHints, setQuestionHints] = useState<PracticeQuestionHint[]>([]);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsError, setHintsError] = useState<string | null>(null);
  const [hintsLoadedQuestionId, setHintsLoadedQuestionId] = useState<number | null>(null);
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const [hintDraft, setHintDraft] = useState('');
  const [hintSubmitLoading, setHintSubmitLoading] = useState(false);

  const timerExpiredRef = useRef(false);
  const practiceQuestionId = practiceQuestion?.id ?? null;

  useEffect(() => {
    let isActive = true;

    const loadTopic = async () => {
      if (!topicId) {
        if (isActive) {
          setError(t('pages.learning.topicNotFound'));
          setLoadingTopic(false);
        }
        return;
      }

      try {
        setLoadingTopic(true);
        setError(null);

        const response = await api.get<TopicTheory>(`/api/learning/topics/${topicId}/`);
        if (!isActive) {
          return;
        }

        const data = response.data;
        setTopic(data);
        setTopicProgressPercent(data.progress_percent ?? 0);
        setAnsweredCount(data.answered_questions ?? 0);
        setCorrectAnswers(data.correct_answers ?? data.answered_questions ?? 0);
        setTotalQuestions(data.total_questions ?? 0);
        setPracticeStats(data.practice_stats ?? null);

        const topicScore = typeof data.score === 'number' ? data.score : data.progress_percent ?? null;
        setScorePercent(topicScore);
        setDurationSeconds(typeof data.duration_seconds === 'number' ? data.duration_seconds : null);
        setTimedOut(Boolean(data.timed_out));
        setPassed(resolvePassedState(data.status === 'completed', topicScore, Boolean(data.timed_out)));

        const timed = Boolean(data.is_timed_test);
        setIsTimedMode(timed);

        if (timed && typeof data.time_limit_seconds === 'number') {
          setTimeLimitSeconds(data.time_limit_seconds);
        }

        if (
          (data.total_questions ?? 0) > 0 &&
          (data.status === 'completed' || data.status === 'failed' || (data.progress_percent ?? 0) >= 100)
        ) {
          setPracticeCompleted(true);
        }
      } catch (requestError: unknown) {
        console.error(requestError);
        if (!isActive) {
          return;
        }

        const status = isAxiosError(requestError) ? requestError.response?.status : undefined;
        if (status === 404) {
          setError(t('pages.learning.topicNotFound'));
        } else if (status === 403) {
          setError(t('pages.learning.notEnrolled'));
        } else {
          setError(t('pages.learning.failedToLoadTopic'));
        }
      } finally {
        if (isActive) {
          setLoadingTopic(false);
        }
      }
    };

    void loadTopic();

    return () => {
      isActive = false;
    };
  }, [topicId, t]);

  const applyPracticePayload = useCallback(
    (data: PracticeApiPayload, options: PracticePayloadOptions = {}) => {
      const { preserveQuestion = false } = options;

      setAnsweredCount((previous) => data.answered_questions ?? previous ?? 0);
      setCorrectAnswers((previous) => data.correct_answers ?? data.answered_questions ?? previous ?? 0);
      setTotalQuestions((previous) => data.total_questions ?? previous ?? 0);

      if (typeof data.progress_percent === 'number') {
        setTopicProgressPercent(data.progress_percent);
      }
      if (typeof data.score_percent === 'number') {
        setScorePercent(data.score_percent);
      }
      if (data.practice_stats) {
        setPracticeStats(data.practice_stats);
      }
      if ('duration_seconds' in data) {
        setDurationSeconds(typeof data.duration_seconds === 'number' ? data.duration_seconds : null);
      }

      const timed = Boolean(data.is_timed ?? data.is_timed_test);
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

      const completedFlag = Boolean(data.completed || data.test_completed || data.timed_out);
      const nextTimedOut = Boolean(data.timed_out);
      setPracticeCompleted(completedFlag);
      setTimedOut(nextTimedOut);
      setPassed(resolvePassedState(data.passed, data.score_percent, nextTimedOut));

      if (completedFlag) {
        unlockNavigation();
        setRemainingSeconds(null);
        timerExpiredRef.current = false;
        setPracticeQuestion(null);
        setSelectedOptions([]);
        setCodeAnswer('');
        setCodeRunResult(null);
        setAnswerFeedback(null);
        setTimedAnswerSaved(false);
        return;
      }

      setPracticeQuestion((previous) => data.question || (preserveQuestion ? previous : null));

      if (data.last_answer && !timed) {
        setSelectedOptions(data.last_answer.selected_option_ids || []);
        if (data.question?.question_type === 'code') {
          setCodeAnswer(data.last_answer.submitted_code || '');
          setCodeRunResult({
            status: data.last_answer.exit_code === 0 ? 'completed' : 'runtime_error',
            stdout: data.last_answer.stdout || '',
            stderr: data.last_answer.stderr || '',
            exit_code: data.last_answer.exit_code ?? null,
            timed_out: false,
          });
        }
        setAnswerFeedback({
          type: data.last_answer.is_correct ? 'success' : 'fail',
          message: data.last_answer.is_correct ? t('pages.learning.correctAnswer') : t('pages.learning.incorrectAnswer'),
          score: data.last_answer.score,
        });
      } else {
        setSelectedOptions((previous) => (timed && preserveQuestion ? previous : []));
        setAnswerFeedback(null);
        setTimedAnswerSaved(false);
      }
    },
    [t, unlockNavigation],
  );

  const fetchNextQuestion = useCallback(async () => {
    if (!topicId) {
      return;
    }

    setPracticeLoading(true);
    setTimedAnswerSaved(false);

    try {
      const response = await api.get<PracticeApiPayload>(`/api/learning/topics/${topicId}/next-question/`);
      applyPracticePayload(response.data);
    } catch (requestError) {
      console.error(requestError);
      setSelectedOptions([]);
      setAnswerFeedback({
        type: 'error',
        message: t('pages.learning.failedToLoadNextQuestion'),
      });
    } finally {
      setPracticeLoading(false);
    }
  }, [applyPracticePayload, topicId, t]);

  useEffect(() => {
    if (
      loadingTopic ||
      error ||
      !topic ||
      totalQuestions <= 0 ||
      practiceQuestion ||
      practiceCompleted ||
      practiceLoading
    ) {
      return;
    }

    const loadInitialQuestion = async () => {
      await fetchNextQuestion();
    };

    void loadInitialQuestion();
  }, [loadingTopic, error, topic, totalQuestions, practiceQuestion, practiceCompleted, practiceLoading, fetchNextQuestion]);

  useEffect(() => {
    setHintsOpen(false);
    setQuestionHints([]);
    setHintsLoading(false);
    setHintsError(null);
    setHintsLoadedQuestionId(null);
    setActiveHintIndex(0);
    setHintDraft('');
    setHintSubmitLoading(false);
    setCodeAnswer('');
    setCodeRunResult(null);
    setCodeRunLoading(false);
  }, [practiceQuestionId]);

  useEffect(() => {
    if (!isReviewMode || !topicId) {
      return;
    }

    let isActive = true;

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);

        const response = await api.get<TopicHistoryResponse>(`/api/learning/topics/${topicId}/history/`);
        if (!isActive) {
          return;
        }

        setHistoryQuestions(response.data.questions || []);
      } catch (requestError: unknown) {
        console.error(requestError);
        if (!isActive) {
          return;
        }

        const status = isAxiosError(requestError) ? requestError.response?.status : undefined;
        if (status === 400) {
          setHistoryError(t('pages.learning.historyAvailableAfterFinish'));
        } else {
          setHistoryError(t('pages.learning.failedToLoadTestHistory'));
        }
      } finally {
        if (isActive) {
          setHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [isReviewMode, topicId, t]);

  const hasTimer = typeof remainingSeconds === 'number';
  const isTimedTestActive =
    isTimedMode &&
    !practiceCompleted &&
    !timedOut &&
    Boolean(practiceQuestion) &&
    hasTimer &&
    remainingSeconds > 0;

  useEffect(() => {
    if (isTimedTestActive) {
      lockNavigation(t('pages.learning.timedTestInProgress'), [`/learning/courses/${courseId}/topics/${topicId}/practice`]);
    } else {
      unlockNavigation();
    }

    return () => {
      unlockNavigation();
    };
  }, [isTimedTestActive, lockNavigation, unlockNavigation, courseId, topicId, t]);

  useEffect(() => {
    return () => {
      unlockNavigation();
    };
  }, [unlockNavigation]);

  useEffect(() => {
    if (!isTimedMode || practiceCompleted || timedOut || !hasTimer) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous === null || previous === undefined) {
          return previous;
        }
        return Math.max(previous - 1, 0);
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isTimedMode, practiceCompleted, timedOut, hasTimer]);

  useEffect(() => {
    if (!isTimedMode || practiceCompleted || remainingSeconds !== 0 || timerExpiredRef.current) {
      return;
    }

    const handleExpiration = async () => {
      timerExpiredRef.current = true;
      await fetchNextQuestion();
    };

    void handleExpiration();
  }, [fetchNextQuestion, isTimedMode, practiceCompleted, remainingSeconds]);

  const handleBackToTheory = () => {
    if (isTimedTestActive) {
      return;
    }

    if (courseId) {
      navigate(`/learning/courses/${courseId}/topics/${topicId}`);
    } else if (topic?.course_id) {
      navigate(`/learning/courses/${topic.course_id}/topics/${topic.id}`);
    } else {
      navigate('/learning');
    }
  };

  const handleOptionToggle = (optionId: number) => {
    if (!practiceQuestion || (isTimedMode && timedAnswerSaved)) {
      return;
    }

    const locked = feedbackType === 'success' && !isTimedMode;
    if (locked) {
      return;
    }

    if (practiceQuestion.question_type === 'single_choice') {
      setSelectedOptions([optionId]);
      return;
    }

    setSelectedOptions((previous) =>
      previous.includes(optionId) ? previous.filter((id) => id !== optionId) : [...previous, optionId],
    );
  };

  const loadQuestionHints = useCallback(
    async (questionId: number, force = false) => {
      if (!force && hintsLoadedQuestionId === questionId) {
        return;
      }

      setHintsLoading(true);
      setHintsError(null);

      try {
        const response = await api.get<PracticeQuestionHintsResponse>(`/api/learning/questions/${questionId}/hints/`);
        setQuestionHints(response.data.hints || []);
        setActiveHintIndex(0);
        setHintsLoadedQuestionId(questionId);
      } catch (requestError) {
        console.error(requestError);
        setHintsError(t('pages.learning.failedToLoadHints'));
      } finally {
        setHintsLoading(false);
      }
    },
    [hintsLoadedQuestionId, t],
  );

  const handleToggleHints = () => {
    if (!practiceQuestion) {
      return;
    }

    if (!hintsOpen) {
      void loadQuestionHints(practiceQuestion.id);
    }

    setHintsOpen((previous) => !previous);
  };

  const handleNextHint = () => {
    setActiveHintIndex((previous) => Math.min(previous + 1, Math.max(questionHints.length - 1, 0)));
  };

  const handleSubmitHint = async () => {
    if (!practiceQuestion) {
      return;
    }

    const canSubmitHint = Boolean(answerFeedback && answerFeedback.score === practiceQuestion.max_score);
    if (!canSubmitHint) {
      setHintsError(t('pages.learning.hintPostLocked'));
      return;
    }

    const text = hintDraft.trim();
    if (!text) {
      return;
    }

    setHintSubmitLoading(true);
    setHintsError(null);

    try {
      const response = await api.post<PracticeQuestionHint>(`/api/learning/questions/${practiceQuestion.id}/hints/`, {
        text,
      });
      const nextIndex = questionHints.length;
      setQuestionHints((previous) => [...previous, response.data]);
      setHintsLoadedQuestionId(practiceQuestion.id);
      setActiveHintIndex(nextIndex);
      setHintDraft('');
    } catch (requestError) {
      console.error(requestError);
      setHintsError(t('pages.learning.failedToSaveHint'));
    } finally {
      setHintSubmitLoading(false);
    }
  };

  const handleContinueTimed = async () => {
    if (!practiceQuestion) {
      return;
    }

    setSubmitLoading(true);

    try {
      const answerPayload = practiceQuestion.question_type === 'code'
        ? { code: codeAnswer }
        : { selected_options: selectedOptions };
      const response = await api.post<PracticeApiPayload>(`/api/learning/questions/${practiceQuestion.id}/answer/`, {
        ...answerPayload,
      });
      const data = response.data;

      const newAnsweredCount = data.answered_questions ?? answeredCount;
      const newTotalQuestions = data.total_questions ?? totalQuestions;
      const isLastQuestionAnswer = newAnsweredCount >= newTotalQuestions && newTotalQuestions > 0;

      applyPracticePayload(
        {
          ...data,
          completed: data.test_completed,
        },
        { preserveQuestion: !data.test_completed && !data.timed_out },
      );

      if (data.test_completed || data.timed_out) {
        if (isLastQuestionAnswer && !data.timed_out) {
          setAnswerFeedback({
            type: 'neutral',
            message: 'Answer accepted!',
            score: data.score,
            isLastQuestion: true,
          });
          setTimedAnswerSaved(true);
        } else {
          setPracticeCompleted(true);
          setTimedOut(Boolean(data.timed_out));
          setPassed(resolvePassedState(data.passed, data.score_percent, Boolean(data.timed_out)));
          setPracticeQuestion(null);
          setCodeAnswer('');
          setCodeRunResult(null);
          setTimedAnswerSaved(false);
        }
      } else {
        setAnswerFeedback({
          type: 'neutral',
          message: t('pages.learning.answerAccepted'),
          score: data.score,
          isLastQuestion: isLastQuestionAnswer,
        });
        setTimedAnswerSaved(true);
      }
    } catch (requestError) {
      console.error(requestError);
      setAnswerFeedback({
        type: 'error',
        message: t('pages.learning.failedToSubmitAnswer'),
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!practiceQuestion) {
      return;
    }

    if (isTimedMode) {
      await handleContinueTimed();
      return;
    }

    if (answerFeedback?.type === 'fail') {
      setAnswerFeedback(null);
      if (practiceQuestion.question_type !== 'code') {
        setSelectedOptions([]);
      }
      return;
    }

    if (practiceQuestion.question_type !== 'code' && selectedOptions.length === 0) {
      setAnswerFeedback({
        type: 'error',
        message: 'Please select at least one option.',
      });
      return;
    }

    setSubmitLoading(true);
    setAnswerFeedback(null);

    try {
      const answerPayload = practiceQuestion.question_type === 'code'
        ? { code: codeAnswer }
        : { selected_options: selectedOptions };
      const response = await api.post<PracticeApiPayload>(`/api/learning/questions/${practiceQuestion.id}/answer/`, {
        ...answerPayload,
      });
      const data = response.data;

      const newAnsweredCount = data.answered_questions ?? answeredCount;
      const newTotalQuestions = data.total_questions ?? totalQuestions;
      const isLastQuestionAnswer = newAnsweredCount >= newTotalQuestions && newTotalQuestions > 0;

      setAnswerFeedback({
        type: data.is_correct ? 'success' : 'fail',
        message: data.is_correct ? t('pages.learning.correctAnswer') : t('pages.learning.incorrectAnswer'),
        score: data.score,
        isLastQuestion: isLastQuestionAnswer,
      });

      setTotalQuestions(newTotalQuestions);
      setAnsweredCount(newAnsweredCount);

      const completed =
        Boolean(data.test_completed) ||
        (typeof data.topic_progress_percent === 'number' && data.topic_progress_percent >= 100);

      if (typeof data.score_percent === 'number') {
        setScorePercent(data.score_percent);
      }
      if (data.practice_stats) {
        setPracticeStats(data.practice_stats);
      }

      if (completed && data.test_completed && !isLastQuestionAnswer) {
        setPracticeCompleted(true);
        setPassed(resolvePassedState(data.passed, data.score_percent, Boolean(data.timed_out)));
        setPracticeQuestion(null);
        setSelectedOptions([]);
        setCodeAnswer('');
        setCodeRunResult(null);
        setAnswerFeedback(null);
      }

      if (data.is_correct) {
        setCorrectAnswers(data.correct_answers ?? data.answered_questions ?? newAnsweredCount);

        if (typeof data.topic_progress_percent === 'number') {
          setTopicProgressPercent(data.topic_progress_percent);
          if (data.topic_progress_percent >= 100 || data.test_completed) {
            setTopic((previous) => (previous ? { ...previous, status: 'completed' } : previous));
          }
        }
      }
    } catch (requestError) {
      console.error(requestError);
      setAnswerFeedback({
        type: 'error',
        message: t('pages.learning.failedToSubmitAnswer'),
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!practiceQuestion || practiceQuestion.question_type !== 'code') {
      return;
    }

    setCodeRunLoading(true);
    setCodeRunResult(null);

    try {
      const response = await api.post<CodeRunResult>(`/api/learning/questions/${practiceQuestion.id}/run-code/`, {
        code: codeAnswer,
      });
      setCodeRunResult(response.data);
    } catch (requestError) {
      console.error(requestError);
      setCodeRunResult({
        status: 'error',
        stdout: '',
        stderr: t('pages.learning.failedToRunCode'),
        exit_code: null,
        timed_out: false,
      });
    } finally {
      setCodeRunLoading(false);
    }
  };

  const handleContinue = async () => {
    const isLast = Boolean(answerFeedback?.isLastQuestion) || (answeredCount >= totalQuestions && totalQuestions > 0);

    if (isLast) {
      setPracticeCompleted(true);
      setTimedOut(false);
      setPassed(resolvePassedState(undefined, scorePercent, false));
      setPracticeQuestion(null);
      setSelectedOptions([]);
      setCodeAnswer('');
      setCodeRunResult(null);
      setAnswerFeedback(null);
      setTimedAnswerSaved(false);
      return;
    }

    await fetchNextQuestion();
  };

  const handleRetry = async () => {
    if (!topicId) {
      return;
    }

    setPracticeLoading(true);
    timerExpiredRef.current = false;

    try {
      await api.post(`/api/learning/topics/${topicId}/reset/`);
      setPracticeCompleted(false);
      setTimedOut(false);
      setPassed(false);
      setAnswerFeedback(null);
      setSelectedOptions([]);
      setCodeAnswer('');
      setCodeRunResult(null);
      setScorePercent(null);
      setDurationSeconds(null);
      setPracticeStats(null);
      setIsReviewMode(false);
      await fetchNextQuestion();
    } catch (requestError) {
      console.error(requestError);
      setAnswerFeedback({
        type: 'error',
        message: t('pages.learning.failedToRestartTest'),
      });
    } finally {
      setPracticeLoading(false);
    }
  };

  const feedbackType = answerFeedback?.type ?? null;
  const canPractice = totalQuestions > 0;
  const isExitLocked = isTimedTestActive;
  const isAnswerLocked =
    (feedbackType === 'success' && !isTimedMode) ||
    (feedbackType === 'fail' && !isTimedMode) ||
    (isTimedMode && timedAnswerSaved);
  const isLastQuestion = Boolean(answerFeedback?.isLastQuestion) || (answeredCount >= totalQuestions && totalQuestions > 0);
  const showNextButton = !isTimedMode && feedbackType === 'success' && !isLastQuestion;
  const showFinishButton =
    feedbackType !== null &&
    isLastQuestion &&
    ((!isTimedMode && (feedbackType === 'success' || feedbackType === 'fail')) ||
      (isTimedMode && feedbackType === 'neutral'));
  const showTimedNextButton = isTimedMode && timedAnswerSaved && !showFinishButton;
  const canPostHint = Boolean(practiceQuestion && answerFeedback && answerFeedback.score === practiceQuestion.max_score);

  if (loadingTopic && !topic) {
    return (
      <div className="page page-enter">
        <LoadingIndicator label={t('common.loading')} />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || t('pages.learning.topicNotFound')}</p>
        <button
          type="button"
          className="learning-back-link"
          onClick={() => navigate('/learning')}
          style={{ marginTop: '16px' }}
        >
          {t('pages.learning.backToMyLearning')}
        </button>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <header className="topic-page-header">
        <div className="topic-page-header__row">
          <button
            type="button"
            className="learning-back-link"
            onClick={handleBackToTheory}
            disabled={isExitLocked}
            aria-disabled={isExitLocked}
          >
            {t('pages.learning.backToTheory')}
          </button>

          {practiceCompleted && isReviewMode && (
            <button
              type="button"
              className="learning-back-link topic-page-header__back-results"
              onClick={() => setIsReviewMode(false)}
            >
              {t('pages.learning.backToResults')}
            </button>
          )}
        </div>

        <div className="topic-meta">
          {topic.course_title} | {topic.module_title}
        </div>

        <h1 className="page__title topic-page-header__title">{topic.title}</h1>
      </header>

      <section className="topic-practice">
        <header className="topic-practice__header">
          <div className="topic-practice__progress">
            <div className="learning-progress-bar">
              <div className="learning-progress-bar__fill" style={{ width: `${topicProgressPercent}%` }} />
            </div>
          </div>

          {isTimedMode && !practiceCompleted && !timedOut && (
            <PracticeTimer
              remainingSeconds={remainingSeconds}
              timeLimitSeconds={timeLimitSeconds}
              isActive={!practiceCompleted && !timedOut}
              timedOut={timedOut}
            />
          )}
        </header>

        {!canPractice && (
          <p className="topic-practice__empty">There are no practice questions for this topic yet.</p>
        )}

        {canPractice && (
          <>
            {practiceLoading && !practiceQuestion && (
              <LoadingIndicator compact label={t('common.loading')} />
            )}

            {practiceCompleted && !practiceQuestion && !practiceLoading && !isReviewMode && (
              <PracticeCompletionPanel
                isTimed={isTimedMode}
                timedOut={timedOut}
                passed={passed}
                scorePercent={scorePercent}
                correctAnswers={correctAnswers}
                totalQuestions={totalQuestions}
                durationSeconds={durationSeconds}
                practiceStats={practiceStats}
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
                codeAnswer={codeAnswer}
                codeRunResult={codeRunResult}
                codeRunLoading={codeRunLoading}
                onCodeChange={(value) => {
                  setCodeAnswer(value);
                  if (answerFeedback?.type === 'fail' || answerFeedback?.type === 'error') {
                    setAnswerFeedback(null);
                  }
                }}
                onRunCode={handleRunCode}
                answerFeedback={answerFeedback}
                onSubmit={handleSubmitAnswer}
                onContinue={handleContinue}
                submitLoading={submitLoading}
                practiceLoading={practiceLoading}
                isTimedMode={isTimedMode}
                isAnswerLocked={isAnswerLocked}
                timedAnswerSaved={timedAnswerSaved}
                disableSubmit={!isTimedMode && practiceQuestion.question_type !== 'code' && selectedOptions.length === 0}
                showNextButton={showNextButton}
                showFinishButton={showFinishButton}
                showTimedNextButton={showTimedNextButton}
                hints={questionHints}
                hintsOpen={hintsOpen}
                hintsLoading={hintsLoading}
                hintsError={hintsError}
                activeHintIndex={activeHintIndex}
                hintDraft={hintDraft}
                hintSubmitLoading={hintSubmitLoading}
                canPostHint={canPostHint}
                onToggleHints={handleToggleHints}
                onNextHint={handleNextHint}
                onHintDraftChange={setHintDraft}
                onSubmitHint={handleSubmitHint}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default TopicPracticePage;
