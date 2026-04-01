import type { AuthSocialButtonsProps } from '../types';

function AuthSocialButtons({
  isLoading,
  onGoogleClick,
  onGitHubClick,
  googleLoadingLabel,
  googleLabel,
  githubLabel,
}: AuthSocialButtonsProps) {
  return (
    <div className="auth-oauth">
      <button
        type="button"
        className="auth-oauth-button auth-oauth-button--google"
        onClick={onGoogleClick}
        disabled={isLoading}
      >
        <img src="/assets/icons/google.png" alt="Google" className="auth-oauth-icon" />
        {isLoading ? googleLoadingLabel : googleLabel}
      </button>
      <button
        type="button"
        className="auth-oauth-button auth-oauth-button--github"
        onClick={onGitHubClick}
        disabled={isLoading}
      >
        <img src="/assets/icons/github.png" alt="GitHub" className="auth-oauth-icon" />
        {githubLabel}
      </button>
    </div>
  );
}

export default AuthSocialButtons;
