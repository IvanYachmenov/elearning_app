import axios from 'axios';

const DEFAULT_API_URL = 'http://127.0.0.1:8000';

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_URL,
});

// Public auth endpoints must work even if the browser still holds an old /
// invalid token (e.g. after the DB was reset). Never attach Authorization to
// them, otherwise the backend rejects the request with 401 before login runs.
const PUBLIC_AUTH_PATHS = [
  '/api/auth/register/',
  '/api/auth/token/',
  '/api/auth/token/refresh/',
  '/api/auth/google/',
  '/api/auth/github/login/',
  '/api/auth/github/callback/',
];

api.interceptors.request.use((config) => {
  const url = config.url || '';
  if (PUBLIC_AUTH_PATHS.some((path) => url.includes(path))) {
    config.headers.delete('Authorization');
  }
  return config;
});

export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
