import {handleGitHubCallback} from './providers/github-auth';
import {applyAuthSession, fetchCurrentUser} from './session';

export async function processGitHubCallback({
    onAuth,
    navigate,
    setError,
    setIsLoading,
    formatProviderError,
    genericError,
}) {
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

        navigate(callback.nextPath, {replace: true});
    } catch (err) {
        console.error('GitHub callback handling error:', err);
        setError(genericError);
    } finally {
        setIsLoading(false);
    }
}
