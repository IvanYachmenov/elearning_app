import type { ApiListResponse, CourseDetail, CourseListItem } from '../../../shared/types';

export interface CourseAuthorSummary {
  username?: string | null;
  email?: string | null;
}

export interface CourseDetailPageData extends CourseDetail {
  author?: CourseAuthorSummary | null;
}

export type CourseListResponse = ApiListResponse<CourseListItem> | CourseListItem[];
