import type { User } from './user';

export interface AuthTokens {
  access: string;
  refresh?: string | null;
}

export type AuthSuccessHandler = (accessToken: string, profile: User) => void;
