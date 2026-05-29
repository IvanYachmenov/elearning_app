import type {
  ApiListResponse,
  LearningCourse,
  PracticeHistoryResponse,
  PracticeStats,
  PracticeLastAnswer,
  PracticeQuestion,
  TopicTheory,
} from '../../../shared/types';

export type LearningRouteParams = Record<'id', string | undefined>

export type TopicRouteParams = Record<'courseId' | 'topicId', string | undefined>

export interface ExpandedModulesState {
  [moduleId: number]: boolean;
}

export interface PracticeApiPayload {
  question?: PracticeQuestion | null;
  test_completed?: boolean;
  completed?: boolean;
  passed?: boolean;
  timed_out?: boolean;
  total_questions?: number;
  answered_questions?: number;
  correct_answers?: number;
  progress_percent?: number;
  topic_progress_percent?: number;
  score_percent?: number | null;
  practice_stats?: PracticeStats;
  remaining_seconds?: number | null;
  time_limit_seconds?: number | null;
  duration_seconds?: number | null;
  is_timed?: boolean;
  is_timed_test?: boolean;
  last_answer?: PracticeLastAnswer | null;
  score?: number;
  is_correct?: boolean;
  viewer_has_reviewed_course?: boolean;
}

export type LearningCoursesResponse = ApiListResponse<LearningCourse> | LearningCourse[];
export type TopicHistoryResponse = PracticeHistoryResponse;
export type TopicTheoryResponse = TopicTheory;


