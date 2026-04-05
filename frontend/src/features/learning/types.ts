import type { PracticeHistoryQuestion, PracticeQuestion } from '../../shared/types';

export type PracticeFeedbackType = 'success' | 'fail' | 'error' | 'neutral';

export interface PracticeAnswerFeedback {
  type: PracticeFeedbackType;
  message: string;
  score?: number | null;
  isLastQuestion?: boolean;
}

export interface PracticeTimerProps {
  remainingSeconds: number | null;
  timeLimitSeconds: number | null;
  isActive: boolean;
  timedOut: boolean;
}

export interface PracticeQuestionCardProps {
  question: PracticeQuestion;
  selectedOptions: number[];
  onOptionToggle: (optionId: number) => void;
  answerFeedback: PracticeAnswerFeedback | null;
  onSubmit: () => void;
  onContinue: () => void;
  submitLoading: boolean;
  practiceLoading: boolean;
  isTimedMode: boolean;
  isAnswerLocked: boolean;
  disableSubmit: boolean;
  showNextButton: boolean;
  showFinishButton: boolean;
  showTimedNextButton: boolean;
  timedAnswerSaved: boolean;
}

export interface PracticeHistorySectionProps {
  historyQuestions: PracticeHistoryQuestion[];
  loading: boolean;
  error: string | null;
}

export interface PracticeCompletionPanelProps {
  topicTitle: string;
  isTimed: boolean;
  timedOut: boolean;
  passed: boolean;
  scorePercent: number | null;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: number;
  onRetry?: () => void;
  onViewHistory?: () => void;
  isReviewMode: boolean;
}
