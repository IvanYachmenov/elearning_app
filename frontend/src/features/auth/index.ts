export { default as AuthSocialButtons } from './ui/AuthSocialButtons';
export type { AuthPageProps, AuthSocialButtonsProps } from './types';
export {
  initializeGoogleSignIn,
  loadGoogleScript,
  initiateGitHubLogin,
  handleGitHubCallback,
  isGitHubCallbackInUrl,
  applyAuthSession,
  clearAuthSession,
  fetchCurrentUser,
  exchangeGoogleToken,
  loginWithPassword,
  triggerGoogleFedCmSignIn,
  processGitHubCallback,
} from './lib';
