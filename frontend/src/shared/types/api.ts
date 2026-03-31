export interface ApiListResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export type ApiFieldErrors = Record<string, string | string[]>;

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errors?: ApiFieldErrors;
  [key: string]: unknown;
}
