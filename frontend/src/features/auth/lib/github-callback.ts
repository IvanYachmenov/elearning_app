import { handleGitHubCallback } from './providers/github-auth';
import { applyAuthSession, clearAuthSession, fetchCurrentUser } from './session';

import type { GitHubCallbackHandlerOptions } from '../types';

export async function processGitHubCallback({
  onAuth,
  navigate,
  setError,
  setIsLoading,
  formatProviderError,
  genericError,
}: GitHubCallbackHandlerOptions): Promise<void> {
  const callback = handleGitHubCallback();

  if (callback.error && callback.isGitHubCallback) {
    setError(formatProviderError(callback.error));
    return;
  }

  if (!callback.access || !callback.refresh || !callback.isGitHubCallback) {
    return;
  }

  try {
    setIsLoading(true);

    applyAuthSession(callback.access, callback.refresh);
    const user = await fetchCurrentUser();

    if (onAuth) {
      onAuth(callback.access, user);
    }

    navigate(callback.nextPath, { replace: true });
  } catch (error) {
    clearAuthSession();
    console.error('GitHub callback handling error:', error);
    setError(genericError);
  } finally {
    setIsLoading(false);
  }
}
