import { API_URL } from '../../../../shared/api';

import type { GitHubCallbackResult } from '../../types';

const GITHUB_CALLBACK_PARAMS = ['access', 'refresh', 'error', 'provider', 'next'] as const;

function readGitHubCallbackParams() {
  const params = new URLSearchParams(window.location.search);
  const access = params.get('access');
  const refresh = params.get('refresh');
  const error = params.get('error');
  const provider = params.get('provider');
  const nextPath = params.get('next');

  return {
    access,
    refresh,
    error,
    provider,
    nextPath,
    isGitHubCallback:
      provider === 'github' || Boolean(access) || Boolean(refresh) || Boolean(error),
  };
}

function clearGitHubCallbackParams(): void {
  const url = new URL(window.location.href);
  for (const param of GITHUB_CALLBACK_PARAMS) {
    url.searchParams.delete(param);
  }

  const nextUrl = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}${url.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
}

export function initiateGitHubLogin(nextPath = '/courses'): void {
  const url = `${API_URL}/accounts/github/login/?next=${encodeURIComponent(nextPath)}&select_account=1`;
  window.location.href = url;
}

export function isGitHubCallbackInUrl(): boolean {
  return readGitHubCallbackParams().isGitHubCallback;
}

export function handleGitHubCallback(): GitHubCallbackResult {
  const callback = readGitHubCallbackParams();

  if (callback.isGitHubCallback) {
    clearGitHubCallbackParams();
  }

  return {
    access: callback.access,
    refresh: callback.refresh,
    error: callback.error,
    provider: callback.provider,
    nextPath:
      callback.nextPath && callback.nextPath.startsWith('/') ? callback.nextPath : '/courses',
    isGitHubCallback: callback.isGitHubCallback,
  };
}
