import type {
  TeacherCourseFormData,
  TeacherCourseListItem,
  TeacherEditableModule,
  TeacherEditableOption,
  TeacherEditableQuestion,
  TeacherEditableTopic,
  TeacherModuleFormData,
  TeacherTopicFormData,
} from '../model/types';

export function normalizeOption(option: unknown): TeacherEditableOption {
  const data = typeof option === 'object' && option !== null ? (option as Record<string, unknown>) : {};
  return {
    id: typeof data.id === 'number' ? data.id : null,
    text: String(data.text || ''),
    is_correct: Boolean(data.is_correct),
  };
}

export function normalizeQuestion(question: unknown, fallbackOrder = 0): TeacherEditableQuestion {
  const data = typeof question === 'object' && question !== null ? (question as Record<string, unknown>) : {};
  const questionType = data.question_type;
  return {
    id: typeof data.id === 'number' ? data.id : null,
    text: String(data.text || ''),
    order: typeof data.order === 'number' ? data.order : fallbackOrder,
    question_type:
      questionType === 'multiple_choice' ||
      questionType === 'code' ||
      questionType === 'javascript_code'
        ? questionType
        : 'single_choice',
    expected_output: String(data.expected_output ?? ''),
    options: Array.isArray(data.options) ? data.options.map(normalizeOption) : [],
  };
}

export function normalizeTopic(topic: unknown, fallbackOrder = 0): TeacherEditableTopic {
  const data = typeof topic === 'object' && topic !== null ? (topic as Record<string, unknown>) : {};
  return {
    id: typeof data.id === 'number' ? data.id : null,
    title: String(data.title || ''),
    content: String(data.content || ''),
    order: typeof data.order === 'number' ? data.order : fallbackOrder,
    is_timed_test: Boolean(data.is_timed_test),
    time_limit_seconds: typeof data.time_limit_seconds === 'number' ? data.time_limit_seconds : null,
    questions: Array.isArray(data.questions) ? data.questions.map((item, index) => normalizeQuestion(item, index)) : [],
  };
}

export function normalizeModule(moduleItem: unknown, fallbackOrder = 0): TeacherEditableModule {
  const data = typeof moduleItem === 'object' && moduleItem !== null ? (moduleItem as Record<string, unknown>) : {};
  return {
    id: typeof data.id === 'number' ? data.id : null,
    title: String(data.title || ''),
    order: typeof data.order === 'number' ? data.order : fallbackOrder,
    topics: Array.isArray(data.topics) ? data.topics.map((item, index) => normalizeTopic(item, index)) : [],
  };
}

export function normalizeCourse(data: unknown): TeacherCourseFormData {
  const course = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};

  return {
    title: String(course.title || ''),
    slug: String(course.slug || ''),
    description: String(course.description || ''),
    modules: Array.isArray(course.modules) ? course.modules.map((item, index) => normalizeModule(item, index)) : [],
  };
}

export function normalizeModuleForm(data: unknown): TeacherModuleFormData {
  const moduleItem = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  return {
    title: String(moduleItem.title || ''),
    order: typeof moduleItem.order === 'number' ? moduleItem.order : 0,
    topics: Array.isArray(moduleItem.topics)
      ? moduleItem.topics.map((item, index) => normalizeTopic(item, index))
      : [],
  };
}

export function normalizeTopicForm(data: unknown): TeacherTopicFormData {
  const topic = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  return {
    title: String(topic.title || ''),
    content: String(topic.content || ''),
    order: typeof topic.order === 'number' ? topic.order : 0,
    is_timed_test: Boolean(topic.is_timed_test),
    time_limit_seconds: typeof topic.time_limit_seconds === 'number' ? topic.time_limit_seconds : null,
    questions: Array.isArray(topic.questions)
      ? topic.questions.map((item, index) => normalizeQuestion(item, index))
      : [],
  };
}

export function normalizeTeacherCourseList(data: unknown): TeacherCourseListItem[] {
  const items = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && Array.isArray((data as Record<string, unknown>).results)
      ? ((data as Record<string, unknown>).results as unknown[])
      : [];

  return items.map((item) => {
    const course = normalizeCourse(item);
    const source = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
    return {
      id: typeof source.id === 'number' ? source.id : 0,
      title: course.title,
      modules: course.modules,
    };
  });
}

export function getNextOrder(items: Array<{ order: number }>): number {
  if (items.length === 0) {
    return 0;
  }

  return Math.max(...items.map((item) => (typeof item.order === 'number' ? item.order : 0))) + 1;
}
