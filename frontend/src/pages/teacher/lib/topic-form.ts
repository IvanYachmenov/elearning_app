import { createEmptyOption, createEmptyQuestion } from './factories';
import { getNextOrder } from './normalize';
import type {
  TeacherEditableOption,
  TeacherEditableQuestion,
  TeacherTimeParts,
} from '../model/types';

export function secondsToTimeParts(totalSeconds: number | null): TeacherTimeParts {
  if (!totalSeconds || totalSeconds < 30) {
    return { minutes: 0, seconds: 30 };
  }

  return {
    minutes: Math.min(Math.floor(totalSeconds / 60), 29),
    seconds: Math.min(totalSeconds % 60, 59),
  };
}

export function timePartsToSeconds(minutes: number, seconds: number): number {
  const total = minutes * 60 + seconds;

  if (total < 30) {
    return 30;
  }

  if (total > 1800) {
    return 1800;
  }

  return total;
}

export function addEmptyQuestion(questions: TeacherEditableQuestion[]): TeacherEditableQuestion[] {
  return [...questions, createEmptyQuestion(getNextOrder(questions))];
}

export function updateQuestionField<K extends keyof TeacherEditableQuestion>(
  questions: TeacherEditableQuestion[],
  questionIndex: number,
  field: K,
  value: TeacherEditableQuestion[K],
): TeacherEditableQuestion[] {
  return questions.map((question, index) => (
    index === questionIndex ? { ...question, [field]: value } : question
  ));
}

export function removeQuestion(
  questions: TeacherEditableQuestion[],
  questionIndex: number,
): TeacherEditableQuestion[] {
  return questions.filter((_, index) => index !== questionIndex);
}

export function addEmptyOptionToQuestion(
  questions: TeacherEditableQuestion[],
  questionIndex: number,
): TeacherEditableQuestion[] {
  return questions.map((question, index) => {
    if (index !== questionIndex) {
      return question;
    }

    return {
      ...question,
      options: [...question.options, createEmptyOption()],
    };
  });
}

export function updateOptionField<K extends keyof TeacherEditableOption>(
  questions: TeacherEditableQuestion[],
  questionIndex: number,
  optionIndex: number,
  field: K,
  value: TeacherEditableOption[K],
): TeacherEditableQuestion[] {
  return questions.map((question, currentQuestionIndex) => {
    if (currentQuestionIndex !== questionIndex) {
      return question;
    }

    return {
      ...question,
      options: question.options.map((option, currentOptionIndex) => (
        currentOptionIndex === optionIndex ? { ...option, [field]: value } : option
      )),
    };
  });
}

export function setOptionCorrectState(
  questions: TeacherEditableQuestion[],
  questionIndex: number,
  optionIndex: number,
  isCorrect: boolean,
): TeacherEditableQuestion[] {
  return questions.map((question, currentQuestionIndex) => {
    if (currentQuestionIndex !== questionIndex) {
      return question;
    }

    return {
      ...question,
      options: question.options.map((option, currentOptionIndex) => {
        if (question.question_type === 'single_choice') {
          return { ...option, is_correct: currentOptionIndex === optionIndex ? isCorrect : false };
        }

        if (currentOptionIndex === optionIndex) {
          return { ...option, is_correct: isCorrect };
        }

        return option;
      }),
    };
  });
}

export function removeOption(
  questions: TeacherEditableQuestion[],
  questionIndex: number,
  optionIndex: number,
): TeacherEditableQuestion[] {
  return questions.map((question, currentQuestionIndex) => {
    if (currentQuestionIndex !== questionIndex) {
      return question;
    }

    return {
      ...question,
      options: question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex),
    };
  });
}
