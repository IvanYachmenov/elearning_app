import type { CourseDetail, CourseModule, CourseTopic, TopicQuestion } from './course';

export type TopicProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'passed';

export interface LearningTopic extends Omit<CourseTopic, 'content' | 'questions'> {
  status: TopicProgressStatus;
  score: number | null;
}

export interface LearningModule extends Omit<CourseModule, 'topics'> {
  topics: LearningTopic[];
}

export interface LearningCourse extends Omit<CourseDetail, 'modules'> {
  modules: LearningModule[];
  total_topics: number;
  completed_topics: number;
  progress_percent: number;
}

export interface PracticeStats {
  completed_users: number;
  passed_users: number;
  average_success_percent: number | null;
  pass_rate_percent: number | null;
}

export interface TopicTheory extends CourseTopic {
  course_id: number;
  course_title: string;
  module_id: number;
  module_title: string;
  status: TopicProgressStatus;
  score: number | null;
  timed_out?: boolean;
  total_questions: number;
  answered_questions: number;
  progress_percent: number;
  correct_answers?: number;
  practice_stats?: PracticeStats;
  duration_seconds?: number | null;
}

export interface PracticeLastAnswer {
  is_correct: boolean;
  selected_option_ids: number[];
  submitted_code?: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number | null;
  score: number;
}

export type PracticeQuestion = TopicQuestion;

export interface CodeRunResult {
  status: 'completed' | 'runtime_error' | 'timeout' | 'error';
  stdout: string;
  stderr: string;
  exit_code: number | null;
  timed_out: boolean;
}

export interface PracticeQuestionHint {
  id: number;
  text: string;
  author_name: string;
  created_at: string;
  is_mine: boolean;
}

export interface PracticeQuestionHintsResponse {
  hints: PracticeQuestionHint[];
}

export interface PracticeHistoryQuestion extends TopicQuestion {
  user_option_ids: number[];
  submitted_code: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  is_correct: boolean | null;
}

export interface PracticeHistoryResponse {
  questions: PracticeHistoryQuestion[];
}

export interface PracticePayload {
  question: PracticeQuestion | null;
  test_completed: boolean;
  passed: boolean;
  timed_out: boolean;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  progress_percent: number;
  topic_progress_percent?: number;
  score_percent: number;
  practice_stats?: PracticeStats;
  remaining_seconds: number | null;
  time_limit_seconds: number | null;
  duration_seconds: number | null;
  is_timed_test: boolean;
  last_answer: PracticeLastAnswer | null;
}
