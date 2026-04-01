import { api, setAuthToken } from '../../../shared/api';
import { setCookie } from '../../../shared/lib/storage/cookies';
import type { User } from '../../../shared/types';

import type { AuthSessionTokens, GoogleAuthExchangeResponse } from '../types';

export function applyAuthSession(access: string, refresh: string, days = 365): void {
  setCookie('access', access, days);
  setCookie('refresh', refresh, days);
  setAuthToken(access);
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await api.get<User>('/api/auth/me/');
  return response.data;
}

export async function exchangeGoogleToken(token: string): Promise<GoogleAuthExchangeResponse> {
  const response = await api.post<GoogleAuthExchangeResponse>('/api/auth/google/', {
    token,
  });

  return response.data;
}

export async function loginWithPassword(credentials: {
  username: string;
  password: string;
}): Promise<AuthSessionTokens> {
  const response = await api.post<AuthSessionTokens>('/api/auth/token/', credentials);
  return response.data;
}
