export type QuestionType = 'single_choice' | 'multiple_choice' | 'code' | 'javascript_code';

export const isCodeQuestion = (type: QuestionType): boolean =>
  type === 'code' || type === 'javascript_code';

export interface TopicQuestionOption {
  id: number;
  text: string;
  is_correct?: boolean;
}

export interface TopicQuestion {
  id: number;
  text: string;
  order: number;
  question_type: QuestionType;
  options: TopicQuestionOption[];
}

export interface CourseTopic {
  id: number;
  title: string;
  content: string;
  order: number;
  is_timed_test: boolean;
  time_limit_seconds: number | null;
  questions?: TopicQuestion[];
}

export interface CourseModule {
  id: number;
  title: string;
  order: number;
  topics: CourseTopic[];
}

export interface CourseListItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  author_name: string | null;
  is_enrolled: boolean;
  average_rating: number | null;
  reviews_count: number;
}

export interface CourseReview {
  id: number;
  rating: number;
  comment: string;
  user_name: string;
  is_current_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends CourseListItem {
  modules: CourseModule[];
  reviews: CourseReview[];
}
