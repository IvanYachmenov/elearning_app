import { createEmptyModule, createEmptyTopic } from './factories';
import { getNextOrder } from './normalize';
import type { TeacherEditableModule, TeacherEditableTopic } from '../model/types';

export function addEmptyModule(modules: TeacherEditableModule[]): TeacherEditableModule[] {
  return [...modules, createEmptyModule(getNextOrder(modules))];
}

export function updateModuleField<K extends keyof TeacherEditableModule>(
  modules: TeacherEditableModule[],
  moduleIndex: number,
  field: K,
  value: TeacherEditableModule[K],
): TeacherEditableModule[] {
  return modules.map((moduleItem, index) => (
    index === moduleIndex ? { ...moduleItem, [field]: value } : moduleItem
  ));
}

export function removeModule(modules: TeacherEditableModule[], moduleIndex: number): TeacherEditableModule[] {
  return modules.filter((_, index) => index !== moduleIndex);
}

export function addEmptyTopicToModule(modules: TeacherEditableModule[], moduleIndex: number): TeacherEditableModule[] {
  return modules.map((moduleItem, index) => {
    if (index !== moduleIndex) {
      return moduleItem;
    }

    return {
      ...moduleItem,
      topics: [...moduleItem.topics, createEmptyTopic(getNextOrder(moduleItem.topics))],
    };
  });
}

export function updateTopicFieldInModule<K extends keyof TeacherEditableTopic>(
  modules: TeacherEditableModule[],
  moduleIndex: number,
  topicIndex: number,
  field: K,
  value: TeacherEditableTopic[K],
): TeacherEditableModule[] {
  return modules.map((moduleItem, currentModuleIndex) => {
    if (currentModuleIndex !== moduleIndex) {
      return moduleItem;
    }

    return {
      ...moduleItem,
      topics: moduleItem.topics.map((topic, currentTopicIndex) => (
        currentTopicIndex === topicIndex ? { ...topic, [field]: value } : topic
      )),
    };
  });
}

export function removeTopicFromModule(
  modules: TeacherEditableModule[],
  moduleIndex: number,
  topicIndex: number,
): TeacherEditableModule[] {
  return modules.map((moduleItem, index) => {
    if (index !== moduleIndex) {
      return moduleItem;
    }

    return {
      ...moduleItem,
      topics: moduleItem.topics.filter((_, currentTopicIndex) => currentTopicIndex !== topicIndex),
    };
  });
}
