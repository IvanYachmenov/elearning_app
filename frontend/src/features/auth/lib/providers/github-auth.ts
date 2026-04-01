import { API_URL } from '../../../../shared/api';

import type { GitHubCallbackResult } from '../../types';

export function initiateGitHubLogin(nextPath = '/home'): void {
  const url = `${API_URL}/accounts/github/login/?next=${nextPath}&select_account=1`;
  window.location.href = url;
}

export function handleGitHubCallback(): GitHubCallbackResult {
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
    nextPath: nextPath && nextPath.startsWith('/') ? nextPath : '/home',
    isGitHubCallback: provider === 'github',
  };
}
