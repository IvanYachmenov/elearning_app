export { default as AuthDisplayControls } from './ui/AuthDisplayControls';
export { default as AuthSocialButtons } from './ui/AuthSocialButtons';
export type { AuthPageProps, AuthSocialButtonsProps } from './types';
export {
  initializeGoogleSignIn,
  loadGoogleScript,
  initiateGitHubLogin,
  handleGitHubCallback,
  applyAuthSession,
  fetchCurrentUser,
  exchangeGoogleToken,
  loginWithPassword,
  triggerGoogleFedCmSignIn,
  processGitHubCallback,
} from './lib';
