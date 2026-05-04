import type {
  TeacherCourseFormData,
  TeacherEditableModule,
  TeacherEditableOption,
  TeacherEditableQuestion,
  TeacherEditableTopic,
  TeacherModuleFormData,
  TeacherTopicFormData,
} from '../model/types';

export const INITIAL_COURSE_DATA: TeacherCourseFormData = {
  title: '',
  slug: '',
  description: '',
  modules: [],
  image: null,
  image_url: null,
};

export const INITIAL_MODULE_DATA: TeacherModuleFormData = {
  title: '',
  order: 0,
  topics: [],
};

export const INITIAL_TOPIC_DATA: TeacherTopicFormData = {
  title: '',
  content: '',
  order: 0,
  is_timed_test: false,
  time_limit_seconds: null,
  questions: [],
};

export function createEmptyOption(): TeacherEditableOption {
  return {
    id: null,
    text: '',
    is_correct: false,
  };
}

export function createEmptyQuestion(order: number): TeacherEditableQuestion {
  return {
    id: null,
    text: '',
    order,
    question_type: 'single_choice',
    max_score: 100,
    expected_output: '',
    options: [],
  };
}

export function createEmptyTopic(order: number): TeacherEditableTopic {
  return {
    id: null,
    title: '',
    content: '',
    order,
    is_timed_test: false,
    time_limit_seconds: null,
    questions: [],
  };
}

export function createEmptyModule(order: number): TeacherEditableModule {
  return {
    id: null,
    title: '',
    order,
    topics: [],
  };
}
