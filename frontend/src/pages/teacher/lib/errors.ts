import { isAxiosError } from 'axios';

import type { TeacherApiErrorResponse } from '../model/types';

export function getTeacherErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<TeacherApiErrorResponse>(error)) {
    return fallback;
  }

  const data = error.response?.data;
  if (!data) {
    return fallback;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  const entries = Object.entries(data).filter(([key]) => key !== 'detail' && key !== 'message');
  if (entries.length === 0) {
    return fallback;
  }

  const [, value] = entries[0];
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  if (typeof value === 'string') {
    return value;
  }

  return fallback;
}
