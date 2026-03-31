export type QuestionType = 'single_choice' | 'multiple_choice' | 'code';

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
  max_score: number;
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
  image_url: string | null;
}

export interface CourseDetail extends CourseListItem {
  modules: CourseModule[];
}
