import type {
  TeacherCourseFormData,
  TeacherEditableModule,
  TeacherEditableOption,
  TeacherEditableQuestion,
  TeacherEditableTopic,
  TeacherModuleFormData,
  TeacherTopicFormData,
} from '../model/types';

function serializeOption(option: TeacherEditableOption) {
  return {
    ...(option.id ? { id: option.id } : {}),
    text: String(option.text || ''),
    is_correct: Boolean(option.is_correct),
  };
}

function serializeQuestion(question: TeacherEditableQuestion, index: number) {
  return {
    ...(question.id ? { id: question.id } : {}),
    text: String(question.text || ''),
    order: typeof question.order === 'number' ? question.order : index,
    question_type: question.question_type || 'single_choice',
    max_score: Number(question.max_score) || 100,
    options: (question.options || []).map(serializeOption),
  };
}

function serializeTopic(topic: TeacherEditableTopic, index: number) {
  return {
    ...(topic.id ? { id: topic.id } : {}),
    title: String(topic.title || ''),
    content: String(topic.content || ''),
    order: typeof topic.order === 'number' ? topic.order : index,
    is_timed_test: Boolean(topic.is_timed_test),
    time_limit_seconds: topic.is_timed_test ? topic.time_limit_seconds || 30 : null,
    questions: (topic.questions || []).map((question, questionIndex) => serializeQuestion(question, questionIndex)),
  };
}

function serializeModule(moduleItem: TeacherEditableModule, index: number) {
  return {
    ...(moduleItem.id ? { id: moduleItem.id } : {}),
    title: String(moduleItem.title || ''),
    order: typeof moduleItem.order === 'number' ? moduleItem.order : index,
    topics: (moduleItem.topics || []).map((topic, topicIndex) => serializeTopic(topic, topicIndex)),
  };
}

export function buildCourseFormData(courseData: TeacherCourseFormData): FormData {
  const formData = new FormData();
  const validModules = (courseData.modules || [])
    .filter((moduleItem) => moduleItem.title.trim())
    .map((moduleItem, index) => serializeModule(moduleItem, index));

  formData.append('title', courseData.title);
  formData.append('description', courseData.description || '');
  formData.append('programming_languages', JSON.stringify(courseData.programming_languages || []));
  formData.append('frameworks', JSON.stringify(courseData.frameworks || []));
  formData.append('modules', JSON.stringify(validModules));

  if (courseData.image instanceof File) {
    formData.append('image', courseData.image);
  }

  return formData;
}

export function buildModulePayload(moduleData: TeacherModuleFormData, courseId: number) {
  return {
    title: moduleData.title,
    order: moduleData.order,
    course: courseId,
    topics: moduleData.topics.map((topic, index) => serializeTopic(topic, index)),
  };
}

export function buildTopicPayload(topicData: TeacherTopicFormData, moduleId?: number) {
  const payload = {
    title: topicData.title,
    content: topicData.content || '',
    order: topicData.order,
    is_timed_test: Boolean(topicData.is_timed_test),
    time_limit_seconds: topicData.is_timed_test ? Math.max(30, Math.min(topicData.time_limit_seconds || 30, 1800)) : null,
    questions: topicData.questions.map((question, index) => serializeQuestion(question, index)),
  };

  return moduleId ? { ...payload, module: moduleId } : payload;
}
