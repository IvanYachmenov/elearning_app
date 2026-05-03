import type { Dispatch, SetStateAction } from 'react';

import type { QuestionType, User } from '../../../shared/types';

export interface TeacherPageProps {
  user: User;
}

export type TeacherRouteParams = Record<'id' | 'courseId' | 'moduleId' | 'topicId', string | undefined>;

export interface TeacherTimeParts {
  minutes: number;
  seconds: number;
}

export interface TeacherEditableOption {
  id: number | null;
  text: string;
  is_correct: boolean;
}

export interface TeacherEditableQuestion {
  id: number | null;
  text: string;
  order: number;
  question_type: QuestionType;
  max_score: number;
  options: TeacherEditableOption[];
}

export interface TeacherEditableTopic {
  id: number | null;
  title: string;
  content: string;
  order: number;
  is_timed_test: boolean;
  time_limit_seconds: number | null;
  questions: TeacherEditableQuestion[];
}

export interface TeacherEditableModule {
  id: number | null;
  title: string;
  order: number;
  topics: TeacherEditableTopic[];
}

export interface TeacherCourseFormData {
  title: string;
  slug: string;
  description: string;
  modules: TeacherEditableModule[];
  image: File | null;
  image_url: string | null;
}

export interface TeacherModuleFormData {
  title: string;
  order: number;
  topics: TeacherEditableTopic[];
}

export interface TeacherTopicFormData {
  title: string;
  content: string;
  order: number;
  is_timed_test: boolean;
  time_limit_seconds: number | null;
  questions: TeacherEditableQuestion[];
}

export interface TeacherCourseListItem {
  id: number;
  title: string;
  image_url: string | null;
  modules: TeacherEditableModule[];
}

export interface TeacherApiFieldErrors {
  [key: string]: string | string[] | undefined;
}

export interface TeacherApiErrorResponse {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface TeacherCoursesPageState {
  courses: TeacherCourseListItem[];
  loading: boolean;
  error: string | null;
}

export type SetStringState = Dispatch<SetStateAction<string | null>>;
